import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Theme schema — the "default" preset is the factory restore point.
 */
const ThemeSchema = new Schema(
  {
    preset: { type: String, required: true, unique: true, enum: ["default", "custom"] },
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    bgImageUrl: { type: String, default: null },
    backgroundColor: { type: String, required: true },
    surfaceColor: { type: String, required: true },
    primaryColor: { type: String, required: true },
    accentFrom: { type: String, required: true },
    accentTo: { type: String, required: true },
    isDark: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ThemeDoc = InferSchemaType<typeof ThemeSchema>;
export type ThemeModel = Model<ThemeDoc>;

export const Theme =
  (mongoose.models.Theme as ThemeModel) ||
  mongoose.model<ThemeDoc>("Theme", ThemeSchema);
