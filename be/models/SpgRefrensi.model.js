import mongoose from "mongoose";

// Define Spg Schema
const SpgSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: String,
  totalHargaPenjualan: { type: Number, default: 0 },
  totalQuantityPenjualan: { type: Number, default: 0 },
  targetHargaPenjualan: { type: Number },
  targetQuantityPenjualan: { type: Number },
  telepon: String,
  skuTerjual: [
    {
      _id: false,
      sku: String,
      quantity: { type: Number, default: 0 },
    },
  ],
});

// Register SpgRefrensi model
const SpgRefrensi = mongoose.model("spgRefrensi", SpgSchema);

export default SpgRefrensi;
