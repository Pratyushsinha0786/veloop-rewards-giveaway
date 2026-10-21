import {
  User,
  Prize,
  Giveaway,
  GiveawayParticipation,
  GiveawayEntryTransaction,
  GiveawayWinner,
  PrizeClaim,
  FraudEvent,
  AuditLog,
} from './models/index.ts';
import { maskUserId, generateTransactionId } from './utils/helpers.ts';

export async function seedDatabase() {
  console.log('Seeding database with demo VELOOP data...');

  // 1. Delete everything in all collections
  await Promise.all([
    User.deleteMany({}),
    Prize.deleteMany({}),
    Giveaway.deleteMany({}),
    GiveawayParticipation.deleteMany({}),
    GiveawayEntryTransaction.deleteMany({}),
    GiveawayWinner.deleteMany({}),
    PrizeClaim.deleteMany({}),
    FraudEvent.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // 2. Insert Users
  const userDocs = await User.insertMany([
    {
      customUserId: 'VE10025',
      name: 'Pratyush Sinha',
      email: 'pratyush@veloop.mock',
      role: 'user',
      balances: { VES: 850, SVES: 1200, Tokens: 5000 },
    },
    {
      customUserId: 'VE98412',
      name: 'Rishu Kumar',
      email: 'rishu@veloop.mock',
      role: 'user',
      balances: { VES: 120, SVES: 100, Tokens: 500 },
    },
    {
      customUserId: 'VE77182',
      name: 'Ananya Rao',
      email: 'ananya@veloop.mock',
      role: 'user',
      balances: { VES: 400, SVES: 300, Tokens: 1200 },
    },
    {
      customUserId: 'VE31409',
      name: 'Karan Mehta',
      email: 'karan@veloop.mock',
      role: 'user',
      balances: { VES: 650, SVES: 900, Tokens: 2600 },
    },
    {
      customUserId: 'VE00001',
      name: 'VELOOP Admin',
      email: 'admin@veloop.mock',
      role: 'admin',
      balances: { VES: 0, SVES: 0, Tokens: 0 },
    },
  ]);

  const userMap = new Map<string, any>();
  for (const u of userDocs) {
    userMap.set(u.customUserId, u);
  }

  // 3. Insert Prizes
  const prizeDocs = await Prize.insertMany([
    {
      prizeCode: 'PRZ-IPH15P',
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      position: '1st Prize',
      prizeType: 'PHYSICAL',
      winnerCount: 1,
      requiredCurrency: 'VES',
      entryFee: 250,
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      description: 'Apple iPhone 15 Pro (128GB, Natural Titanium) with aerospace-grade titanium design and A17 Pro chip.',
      isActive: true,
    },
    {
      prizeCode: 'PRZ-AWS9',
      name: 'Apple Watch Series 9',
      slug: 'apple-watch',
      position: '2nd Prize',
      prizeType: 'PHYSICAL',
      winnerCount: 3,
      requiredCurrency: 'VES',
      entryFee: 200,
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
      description: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum Case with Sport Band.',
      isActive: true,
    },
    {
      prizeCode: 'PRZ-AIRP2',
      name: 'AirPods Pro',
      slug: 'airpods',
      position: '3rd Prize',
      prizeType: 'PHYSICAL',
      winnerCount: 5,
      requiredCurrency: 'SVES',
      entryFee: 500,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
      description: 'AirPods Pro (2nd Gen) with MagSafe Case (USB-C) and up to 2x more Active Noise Cancellation.',
      isActive: true,
    },
    {
      prizeCode: 'PRZ-AMZ2000',
      name: '₹2,000 Amazon Voucher',
      slug: 'amazon-2000',
      position: 'Lucky Draw',
      prizeType: 'GIFT_CARD',
      winnerCount: 10,
      requiredCurrency: 'VES',
      entryFee: 500,
      image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
      description: 'Digital Amazon Gift Card worth ₹2,000 redeemable instantly on Amazon.in.',
      isActive: true,
    },
    {
      prizeCode: 'PRZ-AMZ500',
      name: '₹500 Amazon Voucher',
      slug: 'amazon-500',
      position: 'Special Draw',
      prizeType: 'GIFT_CARD',
      winnerCount: 15,
      requiredCurrency: 'VES',
      entryFee: 300,
      image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&auto=format&fit=crop&q=80',
      description: 'Digital Amazon Gift Card worth ₹500 for shopping, recharges, or bill payments.',
      isActive: true,
    },
    {
      prizeCode: 'PRZ-AMZ20',
      name: '₹20 Voucher',
      slug: 'amazon-20',
      position: 'Instant Reward',
      prizeType: 'GIFT_CARD',
      winnerCount: 100,
      requiredCurrency: 'Tokens',
      entryFee: 2000,
      image: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=800&auto=format&fit=crop&q=80',
      description: '₹20 Instant Shopping Gift Voucher for quick purchases and daily micro-rewards.',
      isActive: true,
    },
  ]);

  const prizeMap = new Map<string, any>();
  for (const p of prizeDocs) {
    prizeMap.set(p.slug, p);
  }

  const standardRules = [
    'One entry per member per giveaway — pick the prize you want most.',
    'The entry fee is taken from your wallet as soon as you join and is not refundable.',
    'Winners are picked at random when the timer ends.',
    'Physical prizes ship only to a verified Indian address.',
    'Only one account per device can take part.',
  ];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  // 4. Active Giveaway: "October Mega Reward Rush"
  // started 3 days ago, ends 12 days 8 hours from now
  const activeGiveaway = await Giveaway.create({
    title: 'October Mega Reward Rush',
    slug: 'october-mega-rewards',
    status: 'ACTIVE',
    prizes: prizeDocs.map((p) => p._id),
    startAt: new Date(now - 3 * dayMs),
    endAt: new Date(now + 12 * dayMs + 8 * hourMs),
    rules: standardRules,
    eligibility: 'All active VELOOP members with sufficient wallet balance.',
    totalParticipants: 2,
  });

  // Ananya entered for Apple Watch
  const ananyaUser = userMap.get('VE77182')!;
  const appleWatchPrize = prizeMap.get('apple-watch')!;
  const ananyaTxnId = generateTransactionId();

  await GiveawayParticipation.create({
    userId: ananyaUser._id,
    giveawayId: activeGiveaway._id,
    prizeId: appleWatchPrize._id,
    entryCurrency: appleWatchPrize.requiredCurrency,
    entryAmount: appleWatchPrize.entryFee,
    deviceHash: 'dev-hash-ananya-demo-01',
    transactionId: ananyaTxnId,
    status: 'CONFIRMED',
    joinedAt: new Date(now - 2 * dayMs),
  });

  await GiveawayEntryTransaction.create({
    userId: ananyaUser._id,
    giveawayId: activeGiveaway._id,
    prizeId: appleWatchPrize._id,
    currency: appleWatchPrize.requiredCurrency,
    amount: appleWatchPrize.entryFee,
    balanceBefore: 600,
    balanceAfter: 400,
    type: 'ENTRY_FEE',
    status: 'SUCCESS',
    transactionId: ananyaTxnId,
  });

  // Karan entered for AirPods
  const karanUser = userMap.get('VE31409')!;
  const airpodsPrize = prizeMap.get('airpods')!;
  const karanTxnId = generateTransactionId();

  await GiveawayParticipation.create({
    userId: karanUser._id,
    giveawayId: activeGiveaway._id,
    prizeId: airpodsPrize._id,
    entryCurrency: airpodsPrize.requiredCurrency,
    entryAmount: airpodsPrize.entryFee,
    deviceHash: 'dev-hash-karan-demo-01',
    transactionId: karanTxnId,
    status: 'CONFIRMED',
    joinedAt: new Date(now - 1 * dayMs),
  });

  await GiveawayEntryTransaction.create({
    userId: karanUser._id,
    giveawayId: activeGiveaway._id,
    prizeId: airpodsPrize._id,
    currency: airpodsPrize.requiredCurrency,
    amount: airpodsPrize.entryFee,
    balanceBefore: 1400,
    balanceAfter: 900,
    type: 'ENTRY_FEE',
    status: 'SUCCESS',
    transactionId: karanTxnId,
  });

  // 5. Past Giveaway 1: "August Reward Rush" (ended 55 days ago)
  // Ananya won iPhone 15 Pro (COMPLETED)
  // Pratyush won Apple Watch (UNCLAIMED)
  const iphonePrize = prizeMap.get('iphone-15-pro')!;
  const pratyushUser = userMap.get('VE10025')!;
  const rishuUser = userMap.get('VE98412')!;

  const augustGiveaway = await Giveaway.create({
    title: 'August Reward Rush',
    slug: 'august-reward-rush',
    status: 'ENDED',
    prizes: [iphonePrize._id, appleWatchPrize._id, airpodsPrize._id],
    startAt: new Date(now - 65 * dayMs),
    endAt: new Date(now - 55 * dayMs),
    drawnAt: new Date(now - 55 * dayMs),
    rules: standardRules,
    eligibility: 'All active VELOOP members',
    totalParticipants: 2,
  });

  // Participation rows for August
  await GiveawayParticipation.create([
    {
      userId: ananyaUser._id,
      giveawayId: augustGiveaway._id,
      prizeId: iphonePrize._id,
      entryCurrency: 'VES',
      entryAmount: 250,
      deviceHash: 'dev-hash-ananya-august',
      transactionId: generateTransactionId(),
      status: 'CONFIRMED',
      joinedAt: new Date(now - 60 * dayMs),
    },
    {
      userId: pratyushUser._id,
      giveawayId: augustGiveaway._id,
      prizeId: appleWatchPrize._id,
      entryCurrency: 'VES',
      entryAmount: 200,
      deviceHash: 'dev-hash-pratyush-august',
      transactionId: generateTransactionId(),
      status: 'CONFIRMED',
      joinedAt: new Date(now - 59 * dayMs),
    },
  ]);

  // Winners for August
  const ananyaAugWinner = await GiveawayWinner.create({
    giveawayId: augustGiveaway._id,
    prizeId: iphonePrize._id,
    userId: ananyaUser._id,
    maskedUserId: maskUserId(ananyaUser.customUserId),
    status: 'COMPLETED',
    selectedAt: new Date(now - 55 * dayMs),
  });

  await PrizeClaim.create({
    winnerId: ananyaAugWinner._id,
    userId: ananyaUser._id,
    giveawayId: augustGiveaway._id,
    prizeId: iphonePrize._id,
    prizeType: 'PHYSICAL',
    claimDetails: {
      fullName: 'Ananya Rao',
      phone: '9845012345',
      address: '42, Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560038',
    },
    status: 'DELIVERED',
  });

  await GiveawayWinner.create({
    giveawayId: augustGiveaway._id,
    prizeId: appleWatchPrize._id,
    userId: pratyushUser._id,
    maskedUserId: maskUserId(pratyushUser.customUserId),
    status: 'UNCLAIMED',
    selectedAt: new Date(now - 55 * dayMs),
  });

  // 6. Past Giveaway 2: "September Voucher Week" (ended 25 days ago)
  // Karan won AirPods (COMPLETED)
  // Pratyush won ₹500 voucher (UNCLAIMED)
  // Rishu won ₹500 voucher (COMPLETED)
  const voucher500Prize = prizeMap.get('amazon-500')!;

  const septGiveaway = await Giveaway.create({
    title: 'September Voucher Week',
    slug: 'september-voucher-week',
    status: 'ENDED',
    prizes: [airpodsPrize._id, voucher500Prize._id],
    startAt: new Date(now - 32 * dayMs),
    endAt: new Date(now - 25 * dayMs),
    drawnAt: new Date(now - 25 * dayMs),
    rules: standardRules,
    eligibility: 'All active VELOOP members',
    totalParticipants: 3,
  });

  // Participation rows for September
  await GiveawayParticipation.create([
    {
      userId: karanUser._id,
      giveawayId: septGiveaway._id,
      prizeId: airpodsPrize._id,
      entryCurrency: 'SVES',
      entryAmount: 500,
      deviceHash: 'dev-hash-karan-sept',
      transactionId: generateTransactionId(),
      status: 'CONFIRMED',
      joinedAt: new Date(now - 30 * dayMs),
    },
    {
      userId: pratyushUser._id,
      giveawayId: septGiveaway._id,
      prizeId: voucher500Prize._id,
      entryCurrency: 'VES',
      entryAmount: 300,
      deviceHash: 'dev-hash-pratyush-sept',
      transactionId: generateTransactionId(),
      status: 'CONFIRMED',
      joinedAt: new Date(now - 29 * dayMs),
    },
    {
      userId: rishuUser._id,
      giveawayId: septGiveaway._id,
      prizeId: voucher500Prize._id,
      entryCurrency: 'VES',
      entryAmount: 300,
      deviceHash: 'dev-hash-rishu-sept',
      transactionId: generateTransactionId(),
      status: 'CONFIRMED',
      joinedAt: new Date(now - 28 * dayMs),
    },
  ]);

  // Winners for September
  const karanSeptWinner = await GiveawayWinner.create({
    giveawayId: septGiveaway._id,
    prizeId: airpodsPrize._id,
    userId: karanUser._id,
    maskedUserId: maskUserId(karanUser.customUserId),
    status: 'COMPLETED',
    selectedAt: new Date(now - 25 * dayMs),
  });

  await PrizeClaim.create({
    winnerId: karanSeptWinner._id,
    userId: karanUser._id,
    giveawayId: septGiveaway._id,
    prizeId: airpodsPrize._id,
    prizeType: 'PHYSICAL',
    claimDetails: {
      fullName: 'Karan Mehta',
      phone: '9920154321',
      address: '7B, Bandra West, Hill Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400050',
    },
    status: 'DELIVERED',
  });

  await GiveawayWinner.create({
    giveawayId: septGiveaway._id,
    prizeId: voucher500Prize._id,
    userId: pratyushUser._id,
    maskedUserId: maskUserId(pratyushUser.customUserId),
    status: 'UNCLAIMED',
    selectedAt: new Date(now - 25 * dayMs),
  });

  const rishuSeptWinner = await GiveawayWinner.create({
    giveawayId: septGiveaway._id,
    prizeId: voucher500Prize._id,
    userId: rishuUser._id,
    maskedUserId: maskUserId(rishuUser.customUserId),
    status: 'COMPLETED',
    selectedAt: new Date(now - 25 * dayMs),
  });

  await PrizeClaim.create({
    winnerId: rishuSeptWinner._id,
    userId: rishuUser._id,
    giveawayId: septGiveaway._id,
    prizeId: voucher500Prize._id,
    prizeType: 'GIFT_CARD',
    claimDetails: {
      email: 'rishu@veloop.mock',
    },
    status: 'DELIVERED',
  });

  console.log('Database seeding complete!');
}
