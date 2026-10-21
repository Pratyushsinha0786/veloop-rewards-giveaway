import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  Giveaway,
  Prize,
  GiveawayParticipation,
  GiveawayWinner,
  AuditLog,
  IUser,
} from '../models/index.ts';
import { maskUserId } from '../utils/helpers.ts';
import { AppError } from '../utils/errors.ts';

// Fisher-Yates shuffle using crypto.randomInt
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function drawWinners(
  giveawayId: string | mongoose.Types.ObjectId,
  options: { force?: boolean; actorId?: string } = {}
) {
  const now = new Date();
  const query: any = {
    _id: giveawayId,
    status: 'ACTIVE',
  };

  if (!options.force) {
    query.endAt = { $lte: now };
  }

  // 1. Atomically switch giveaway from ACTIVE to DRAWING to lock
  const lockedGiveaway = await Giveaway.findOneAndUpdate(
    query,
    { $set: { status: 'DRAWING' } },
    { new: true }
  ).populate('prizes');

  if (!lockedGiveaway) {
    throw new AppError(
      'Could not initiate draw: Giveaway is not active or has already been drawn.',
      409,
      'DRAW_CONFLICT'
    );
  }

  try {
    const perPrizeSummary: Array<{
      prize: string;
      entries: number;
      winners: number;
      slots: number;
    }> = [];

    let totalWinnersPicked = 0;

    // 2. Draw winners for each prize in this giveaway
    const prizes = lockedGiveaway.prizes as any[];

    for (const prize of prizes) {
      const participations = await GiveawayParticipation.find({
        giveawayId: lockedGiveaway._id,
        prizeId: prize._id,
        status: 'CONFIRMED',
      }).populate<{ userId: IUser }>('userId');

      const shuffled = fisherYatesShuffle(participations);
      const winnersCountToPick = Math.min(prize.winnerCount, shuffled.length);
      const chosen = shuffled.slice(0, winnersCountToPick);

      for (const entry of chosen) {
        const u = entry.userId;
        const customId = u ? u.customUserId : 'VEMEMBER';
        await GiveawayWinner.create({
          giveawayId: lockedGiveaway._id,
          prizeId: prize._id,
          userId: u._id,
          maskedUserId: maskUserId(customId),
          status: 'UNCLAIMED',
          selectedAt: now,
        });
        totalWinnersPicked += 1;
      }

      perPrizeSummary.push({
        prize: prize.name,
        entries: participations.length,
        winners: chosen.length,
        slots: prize.winnerCount,
      });
    }

    // 3. Mark giveaway as ENDED and set drawnAt
    const updateFields: any = {
      status: 'ENDED',
      drawnAt: now,
    };
    if (options.force) {
      updateFields.endAt = now;
    }

    await Giveaway.findByIdAndUpdate(lockedGiveaway._id, { $set: updateFields });

    // Write AuditLog
    await AuditLog.create({
      userId: options.actorId ? new mongoose.Types.ObjectId(options.actorId) : undefined,
      action: 'DRAW_WINNERS',
      details: {
        giveawayId: lockedGiveaway._id,
        forced: !!options.force,
        totalWinnersPicked,
        summary: perPrizeSummary,
      },
    });

    return {
      message: `Draw completed successfully. ${totalWinnersPicked} winners picked across ${prizes.length} prizes.`,
      giveawayId: lockedGiveaway._id,
      totalWinnersPicked,
      summary: perPrizeSummary,
    };
  } catch (error) {
    // Revert status to ACTIVE if error occurred
    await Giveaway.findByIdAndUpdate(lockedGiveaway._id, { $set: { status: 'ACTIVE' } });
    throw error;
  }
}

export async function drawExpiredGiveaways() {
  try {
    const now = new Date();
    const expiredActiveGiveaways = await Giveaway.find({
      status: 'ACTIVE',
      endAt: { $lte: now },
    });

    for (const g of expiredActiveGiveaways) {
      console.log(`Auto-drawing expired giveaway: "${g.title}" (${g._id})...`);
      try {
        await drawWinners(g._id, { force: false });
        console.log(`Successfully completed auto-draw for "${g.title}"`);
      } catch (err) {
        console.error(`Error auto-drawing giveaway ${g._id}:`, err);
      }
    }
  } catch (err) {
    console.error('Error checking for expired giveaways:', err);
  }
}
