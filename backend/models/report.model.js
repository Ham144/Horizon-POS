import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
