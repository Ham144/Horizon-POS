import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { //jadikan ini PK  utama
      type: String,
      required: true,
      unique: true
    },
    username: { //ini juga ga boleh diganti udah semuk kali codingannya dan banyak yang makai ini sebagai FK
      type: String,
      required: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    countryCode: String,
    telepon: {
      type: String,
    },
    registerCryto: String,
    registerCrytoExpiresIn: {
      type: Date,
      default: new Date(new Date().getHours() + 24)
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
    org: {
      // foreign key
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  { timestamps: true }
);

const UserRefrensi = new mongoose.model("UserRefrensi", userSchema);

export default UserRefrensi;
