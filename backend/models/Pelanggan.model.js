import mongoose, { Mongoose, Schema } from "mongoose";

const pelangganSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: { type: String, unique: true, required: true },
    jenisKelamin: {
      type: String,
      enum: ["laki-laki", "perempuan"],
    },
    alamat: String,
  },
  { timestamps: true }
);

const Pelanggan = mongoose.model("Pelanggan", pelangganSchema);
export default Pelanggan;
