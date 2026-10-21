import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. User
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  customUserId: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  balances: {
    VES: number;
    SVES: number;
    Tokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    customUserId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    balances: {
      VES: { type: Number, default: 0, min: 0 },
      SVES: { type: Number, default: 0, min: 0 },
      Tokens: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// 2. Prize
export interface IPrize extends Document {
  _id: mongoose.Types.ObjectId;
  prizeCode: string;
  name: string;
  slug: string;
  position: string;
  prizeType: 'PHYSICAL' | 'GIFT_CARD' | 'DIGITAL';
  winnerCount: number;
  requiredCurrency: 'VES' | 'SVES' | 'Tokens';
  entryFee: number;
  image: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrizeSchema = new Schema<IPrize>(
  {
    prizeCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    position: { type: String, default: 'Prize' },
    prizeType: { type: String, enum: ['PHYSICAL', 'GIFT_CARD', 'DIGITAL'], required: true },
    winnerCount: { type: Number, required: true, min: 1 },
    requiredCurrency: { type: String, enum: ['VES', 'SVES', 'Tokens'], required: true },
    entryFee: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Prize: Model<IPrize> = mongoose.models.Prize || mongoose.model<IPrize>('Prize', PrizeSchema);

// 3. Giveaway
export interface IGiveaway extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  status: 'UPCOMING' | 'ACTIVE' | 'DRAWING' | 'ENDED' | 'ARCHIVED';
  prizes: mongoose.Types.ObjectId[];
  startAt: Date;
  endAt: Date;
  drawnAt?: Date;
  rules: string[];
  eligibility?: string;
  totalParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

const GiveawaySchema = new Schema<IGiveaway>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'DRAWING', 'ENDED', 'ARCHIVED'],
      default: 'UPCOMING',
    },
    prizes: [{ type: Schema.Types.ObjectId, ref: 'Prize' }],
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    drawnAt: { type: Date },
    rules: [{ type: String }],
    eligibility: { type: String, default: 'All active VELOOP members' },
    totalParticipants: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

GiveawaySchema.index({ status: 1, endAt: 1 });

export const Giveaway: Model<IGiveaway> =
  mongoose.models.Giveaway || mongoose.model<IGiveaway>('Giveaway', GiveawaySchema);

// 4. GiveawayParticipation
export interface IGiveawayParticipation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  giveawayId: mongoose.Types.ObjectId;
  prizeId: mongoose.Types.ObjectId;
  entryCurrency: 'VES' | 'SVES' | 'Tokens';
  entryAmount: number;
  deviceHash: string;
  transactionId: string;
  status: 'CONFIRMED' | 'DISQUALIFIED';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GiveawayParticipationSchema = new Schema<IGiveawayParticipation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    giveawayId: { type: Schema.Types.ObjectId, ref: 'Giveaway', required: true },
    prizeId: { type: Schema.Types.ObjectId, ref: 'Prize', required: true },
    entryCurrency: { type: String, enum: ['VES', 'SVES', 'Tokens'], required: true },
    entryAmount: { type: Number, required: true },
    deviceHash: { type: String, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, enum: ['CONFIRMED', 'DISQUALIFIED'], default: 'CONFIRMED' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One entry per member per giveaway
GiveawayParticipationSchema.index({ userId: 1, giveawayId: 1 }, { unique: true });
GiveawayParticipationSchema.index({ giveawayId: 1, deviceHash: 1 });

export const GiveawayParticipation: Model<IGiveawayParticipation> =
  mongoose.models.GiveawayParticipation ||
  mongoose.model<IGiveawayParticipation>('GiveawayParticipation', GiveawayParticipationSchema);

// 5. GiveawayEntryTransaction (Wallet ledger)
export interface IGiveawayEntryTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  giveawayId: mongoose.Types.ObjectId;
  prizeId: mongoose.Types.ObjectId;
  currency: 'VES' | 'SVES' | 'Tokens';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: 'ENTRY_FEE' | 'REVERSAL';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
}

const GiveawayEntryTransactionSchema = new Schema<IGiveawayEntryTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    giveawayId: { type: Schema.Types.ObjectId, ref: 'Giveaway', required: true },
    prizeId: { type: Schema.Types.ObjectId, ref: 'Prize', required: true },
    currency: { type: String, enum: ['VES', 'SVES', 'Tokens'], required: true },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    type: { type: String, enum: ['ENTRY_FEE', 'REVERSAL'], default: 'ENTRY_FEE' },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
    transactionId: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

export const GiveawayEntryTransaction: Model<IGiveawayEntryTransaction> =
  mongoose.models.GiveawayEntryTransaction ||
  mongoose.model<IGiveawayEntryTransaction>('GiveawayEntryTransaction', GiveawayEntryTransactionSchema);

// 6. GiveawayWinner
export interface IGiveawayWinner extends Document {
  _id: mongoose.Types.ObjectId;
  giveawayId: mongoose.Types.ObjectId;
  prizeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  maskedUserId: string;
  status: 'UNCLAIMED' | 'CLAIM_SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED';
  selectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GiveawayWinnerSchema = new Schema<IGiveawayWinner>(
  {
    giveawayId: { type: Schema.Types.ObjectId, ref: 'Giveaway', required: true },
    prizeId: { type: Schema.Types.ObjectId, ref: 'Prize', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    maskedUserId: { type: String, required: true },
    status: {
      type: String,
      enum: ['UNCLAIMED', 'CLAIM_SUBMITTED', 'PROCESSING', 'COMPLETED', 'EXPIRED'],
      default: 'UNCLAIMED',
    },
    selectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

GiveawayWinnerSchema.index({ giveawayId: 1, prizeId: 1, userId: 1 }, { unique: true });

export const GiveawayWinner: Model<IGiveawayWinner> =
  mongoose.models.GiveawayWinner ||
  mongoose.model<IGiveawayWinner>('GiveawayWinner', GiveawayWinnerSchema);

// 7. PrizeClaim
export interface IClaimDetails {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  email?: string;
}

export interface IPrizeClaim extends Document {
  _id: mongoose.Types.ObjectId;
  winnerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  giveawayId: mongoose.Types.ObjectId;
  prizeId: mongoose.Types.ObjectId;
  prizeType: 'PHYSICAL' | 'GIFT_CARD' | 'DIGITAL';
  claimDetails: IClaimDetails;
  status: 'SUBMITTED' | 'PROCESSING' | 'DELIVERED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const PrizeClaimSchema = new Schema<IPrizeClaim>(
  {
    winnerId: { type: Schema.Types.ObjectId, ref: 'GiveawayWinner', unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    giveawayId: { type: Schema.Types.ObjectId, ref: 'Giveaway', required: true },
    prizeId: { type: Schema.Types.ObjectId, ref: 'Prize', required: true },
    prizeType: { type: String, enum: ['PHYSICAL', 'GIFT_CARD', 'DIGITAL'], required: true },
    claimDetails: {
      fullName: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pinCode: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'PROCESSING', 'DELIVERED', 'REJECTED'],
      default: 'SUBMITTED',
    },
  },
  { timestamps: true }
);

export const PrizeClaim: Model<IPrizeClaim> =
  mongoose.models.PrizeClaim || mongoose.model<IPrizeClaim>('PrizeClaim', PrizeClaimSchema);

// 8. FraudEvent
export interface IFraudEvent extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  giveawayId?: mongoose.Types.ObjectId;
  ip?: string;
  deviceHash?: string;
  riskScore: number;
  action: 'LOGGED' | 'FLAGGED' | 'BLOCKED';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FraudEventSchema = new Schema<IFraudEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    giveawayId: { type: Schema.Types.ObjectId, ref: 'Giveaway' },
    ip: { type: String },
    deviceHash: { type: String },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    action: { type: String, enum: ['LOGGED', 'FLAGGED', 'BLOCKED'], default: 'LOGGED' },
    reason: { type: String },
  },
  { timestamps: true }
);

export const FraudEvent: Model<IFraudEvent> =
  mongoose.models.FraudEvent || mongoose.model<IFraudEvent>('FraudEvent', FraudEventSchema);

// 9. AuditLog
export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: string;
  details?: any;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
