import mongoose from "mongoose";

const InventoryRefrensiSchema = new mongoose.Schema(
  {
    _id: {
      type: String, //ini` SKU
    },
    sku: {
      type: String, //ini sku jg, ribet mengganti semua keyword sku jadi _id kodingan lama
      required: true,
      unique: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    RpHargaDasar: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    barcodeItem: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },
    terjual: {
      type: Number,
      default: 0,
    },
    //memeriksa perubahan yang dilakukan cms(mengurangi response size)
  },
  {
    timestamps: true,
  }
);

const InventoryRefrensi = mongoose.model(
  "InventoryRefrensi",
  InventoryRefrensiSchema
);
export default InventoryRefrensi;
