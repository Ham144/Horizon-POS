// Import yang diperlukan
import cron from "node-cron";
import nodemailer from "nodemailer";
import Outlet from "../models/Outlet.model.js";
import Invoice from "../models/invoice.model.js";
import formatCurrency from "../utils/formatCurrency.js";
import GeneratedVoucher from "../models/GeneratedVoucher.model.js";
import DaftarVoucher from "../models/DaftarVoucher.model.js";

// Konfigurasi transporter email
// Gunakan konfigurasi SMTP email Anda
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || undefined,
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Mematikan verifikasi sertifikat jika terjadi masalah TLS
    rejectUnauthorized: false,
    ciphers: "SSLv3",
  },
  debug: true, // Aktifkan debugging untuk melihat detail koneksi
});

const kirimEmailVoucherCode = async (generatedVoucher) => {
  //cari refrensi voucher
  const voucherDB = await DaftarVoucher.findById(generatedVoucher.voucherId);
  if (!voucherDB) {
    console.error("❌ Voucher tidak ditemukan");
    return;
  }
  let certainOutlet = [];
  if (generatedVoucher.outletList.length > 0) {
    certainOutlet = await Outlet.find({
      _id: { $in: generatedVoucher.outletList },
    })
      .select("namaOutlet")
      .lean()
      .then((outlets) => outlets.map((o) => o.namaOutlet).join(", "));
  } else {
    certainOutlet = "Semua Outlet";
  }

  //kirim email
  const email = generatedVoucher.pemilik.email;
  const subject = `Anda memiliki voucher ${voucherDB.judulVoucher} atas pembelian baru baru ini`;
  const text = `Belanjamu baru baru ini mendapatkan voucher ${voucherDB.judulVoucher}, ini kode voucher mu "${generatedVoucher.privateVoucherCode}" jangan publikasi kode ini, dan beri tahu kekasir kode voucher ini saat transaksi untuk dapat potongan harga, voucher ini hanya berlaku di outlet berikut ${certainOutlet}`;
  await transporter.sendMail({ from: email, to: email, subject, text });
};

// Fungsi untuk mengumpulkan generatedVoucher yang belum dikirim
const kumpulkanGeneratedVoucherBelumDikirim = async () => {
  const generatedVoucher = await GeneratedVoucher.find({ isSend: false });

  //looping generatedVoucher
  for (const privateVoucher of generatedVoucher) {
    //kirim email
    await kirimEmailVoucherCode(privateVoucher);
    privateVoucher.isSend = true;
    await privateVoucher.save();
  }
};

// Jadwalkan cron job untuk berjalan setiap hari jam 7 pagi
// Format: Second (0-59), Minute (0-59), Hour (0-23), Day of Month (1-31), Month (1-12), Day of Week (0-6)
const pengirimanVoucherCodeJob = cron.schedule(
  "0 0 7 * * *",
  async () => {
    console.log("Menjalankan cron job pengiriman voucher code...");
    await kumpulkanGeneratedVoucherBelumDikirim();
  },
  {
    scheduled: true,
    timezone: "Asia/Jakarta", // Sesuaikan dengan timezone Indonesia
  }
);

// Verifikasi koneksi email saat startup
export const verifyEmailConnection = async () => {
  try {
    console.log("Verifikasi koneksi email...");
    const verification = await transporter.verify();
    if (verification) {
      console.log("✅ Koneksi email berhasil terverifikasi!");
      return true;
    } else {
      console.error("❌ Gagal verifikasi koneksi email.");
      return false;
    }
  } catch (error) {
    console.error("❌ Error saat verifikasi koneksi email:", error.message);
    console.error("Detail error:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      error: error.stack,
    });
    return false;
  }
};

// Fungsi untuk menjalankan job secara manual (untuk testing)
export const runManualPengirimanVoucherCodeJob = async () => {
  console.log("Menjalankan pengiriman voucher code secara manual...");

  // Verifikasi koneksi email terlebih dahulu
  const isEmailConfigValid = await verifyEmailConnection();
  if (!isEmailConfigValid) {
    console.error("⚠️ Konfigurasi email tidak valid, cek pengaturan SMTP Anda");
    return false;
  }

  await kumpulkanGeneratedVoucherBelumDikirim();
  return true;
};

// Export cron job
export default pengirimanVoucherCodeJob;
