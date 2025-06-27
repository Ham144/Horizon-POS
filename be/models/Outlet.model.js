import mongoose from "mongoose";

//Outlet == pameran
//single
const outletSchema = mongoose.Schema({
  kodeOutlet: {
    //02, 03, 04 dst
    type: String,
    required: true,
    unique: true,
  },
  namaOutlet: {
    type: String,
    required: true,
    unique: true,
  }, //sama dengan nama event
  description: String,
  logo: String, //base64 sementara
  jumlahInvoice: {
    //acuan untuk kodeInvoice, pakai $inc mengatasi race condition
    type: Number,
    default: 0,
  },
  pendapatan: {
    type: Number,
    default: 0,
  },
  namaPerusahaan: String,
  alamat: String,
  npwp: String,
  kasirList: [mongoose.Schema.Types.ObjectId],
  spgList: [mongoose.Schema.Types.ObjectId],
  brandIds: [mongoose.Schema.Types.ObjectId],
  periodeSettlement: {
    //ini untuk mencatat dan mereset 0 jika sudah lewat waktunya: pendapatan outlet, spg, kasir(userInfo),
    type: Number,
    default: 1, //1 hari sekali
  },
  jamSettlement: {
    type: String,
    default: "00:00", //00:00
  },
});

const Outlet = mongoose.model("Outlet", outletSchema);
export default Outlet;
