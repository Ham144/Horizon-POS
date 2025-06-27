import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      //sudah jadi FK
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    telepon: {
      type: String,
    },
    otp: {
      type: Number,
    },
    otpExpiredAt: {
      type: Date,
    },
    skuTerjual: [
      {
        sku: String,
        totalQuantityPenjualan: Number,
      },
    ],
    totalHargaPenjualan: Number,
    totalQuantityPenjualan: Number, //total quantity item di akumulasi bukan invoice
    targetHargaPenjualan: Number,
    targetQuantityPenjualan: Number,
    isDisabled: {
      type: Boolean,
      default: false,
    },
    roleName: {
      type: String,
      required: true,
      default: "Tamu",
    },
    blockedAccess: {
      //logika terbalik [block page, atau enpoint],
      type: [String],
      default: ["Item Library", "Promo", "Diskon", "Voucher", "Super Admin"],
    },
    kodeKasir: {
      type: String,
    }, //3 huruf random dari usernamenya exp: HM1 krn username yafizham
  },
  { timestamps: true }
);

const UserRefrensi = new mongoose.model("UserRefrensi", userSchema);

export default UserRefrensi;
