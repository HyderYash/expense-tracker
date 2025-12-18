import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEntry {
  name: string;
  quantity: number;
  invested: number;
  currentValue?: number;
  expectedPercent?: number;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  expectedPercent: number;
  currentValue: number;
  entries: IEntry[];
  displayName?: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  invested: { type: Number, required: true, default: 0 },
  currentValue: { type: Number, required: false },
  expectedPercent: { type: Number, required: false, default: 10 },
});

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    expectedPercent: { type: Number, required: true, default: 15 },
    currentValue: { type: Number, required: true, default: 0 },
    entries: { type: [EntrySchema], default: [] },
    displayName: { type: String },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique slug per user
CategorySchema.index({ userId: 1, slug: 1 }, { unique: true });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

// Ensure index exists (this will create it if it doesn't exist)
Category.createIndexes().catch((err) => {
  console.error("Error creating Category indexes:", err);
});

export default Category;

