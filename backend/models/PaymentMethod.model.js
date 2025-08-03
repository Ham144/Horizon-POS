import { Schema, model } from "mongoose";

const paymentMethodSchema = new Schema({
  method: {
    type: String,
    required: true,
  },
  discount: Number,
  status: {
    type: Boolean,
    default: true,
  },
  additional_fee: Number,
});

const PaymentMethod = model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;
