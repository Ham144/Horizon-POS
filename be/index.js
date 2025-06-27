import express from "express";
import "dotenv/config";
import paymentRoute from "./routes/payment.route.js";
import inventoryRoutes from "./routes/inventory-route.js";
import unlistedLibrarySourceRoute from "./routes/unlistedLibrary.route.js";
import { connectDB } from "./utils/connectDB.js";
import diskonRoutes from "./routes/diskon.route.js";
import cors from "cors";
import promoRoutes from "./routes/promo.route.js";
import brandRoutes from "./routes/brand.route.js";
import voucherRoutes from "./routes/voucher.route.js";
import purchaseOrderRoutes from "./routes/purchaseOrder.route.js";
import transactionRoutes from "./routes/transaction.routes.js";
import syncMobileRoutes from "./routes/syncMobile.route.js";
import printerRouter from "./routes/printer.route.js";
import spgRoutes from "./routes/spg.route.js";
import customerRoutes from "./routes/customer.route.js";
import invoiceRoutes from "./routes/invoice.route.js  ";
import thumbnailRoutes from "./routes/thumbnail.route.js";
import outletRoutes from "./routes/Outlet.route.js";
import kasirRoutes from "./routes/kasir.route.js";
import auhtRoutes from "./routes/auth.route.js";
import authenticate from "./middlewares/authenticate.js";
import authorize from "./middlewares/authorize.js";
import documentRoutes from "./routes/document.route.js";
import reportRoutes from "./routes/report.route.js";
import inventoryStatRoute from "./routes/inventoryStat.route.js";
import paymentMethodRoutes from "./routes/paymentMethod.route.js";
import adminRoutes from "./routes/admin.route.js";
import cookieParser from "cookie-parser";
import salesReportRoutes from "./routes/saleReport.route.js";
import pengirimanVoucherCodeJob, {
  verifyEmailConnection,
} from "./cronjobs/pengirimanVoucherCode.js";
import donwloadRoutes from "./routes/download.route.js";
import stackTraceSkuRoutes from "./routes/stackTrace.route.js";

const isProduction = process.env.NODE_ENV === "production";
const corsOrigin = isProduction
  ? [
      "http://pos.mycsi.net",
      "https://www.mycsi.net",
      "http://192.168.169.12:5173",
      "http://192.168.169.14",
    ]
  : [
      "http://192.168.169.12:5173",
      "http://localhost:8081",
      "http://localhost:8082",
      "http://pos.mycsi.net",
      "https://pos.mycsi.net",
    ];

const app = express();

//midlerwares
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.get("/", async (req, res) => {
  return res.send("CSI POS BACKEND : 200");
});

//database
connectDB();

//public seutuhnya || kalau sebagian, tambah ke noAuthOriginalUrl sj
app.use("/api/v1/report", reportRoutes);
app.use("/api/v1/document", documentRoutes);
app.use("/api/v1/download", donwloadRoutes);

//buat ini sebagai pengecekan semua Berjalan dengan baik
app.get("/api/v1/ping", async (_, res) => {
  return res.json({
    status: 200,
    message: "semua berjalan dengan baik",
    online: true,
  });
});

//private
app.use(authenticate);
app.use(authorize);
//routes
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/inventories", inventoryRoutes);
app.use("/api/v1/unlistedLibraries", unlistedLibrarySourceRoute);
app.use("/api/v1/diskon", diskonRoutes);
app.use("/api/v1/promo", promoRoutes);
app.use("/api/v1/brand", brandRoutes);
app.use("/api/v1/voucher", voucherRoutes);
app.use("/api/v1/purchaseOrder", purchaseOrderRoutes);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/sinkronisasi", syncMobileRoutes);
app.use("/api/v1/printer", printerRouter);
app.use("/api/v1/customer", customerRoutes);
app.use("/api/v1/invoice", invoiceRoutes);
app.use("/api/v1/thumbnail", thumbnailRoutes);
app.use("/api/v1/outlet", outletRoutes);
app.use("/api/v1/spg", spgRoutes);
app.use("/api/v1/kasir", kasirRoutes);
app.use("/api/v1/auth", auhtRoutes);
app.use("/api/v1/inventoryStat", inventoryStatRoute);
app.use("/api/v1/paymentMethod", paymentMethodRoutes);
app.use("/api/v1/dashboard", salesReportRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/stackTraceSku", stackTraceSkuRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server Berjalan di port ", port);

  // Inisialisasi cron job pengiriman voucher code setelah server berjalan
  (async () => {
    try {
      await initPengirimanVoucherCodeJob();
      console.log(
        "✅ Cron job pengiriman voucher code berhasil diinisialisasi"
      );
    } catch (error) {
      console.error(
        "❌ Gagal menginisialisasi cron job pengiriman voucher code:",
        error
      );
    }
  })();
});

// Fungsi untuk inisialisasi cron job pengiriman voucher code
const initPengirimanVoucherCodeJob = async () => {
  try {
    // Verifikasi koneksi email
    const isEmailValid = await verifyEmailConnection();
    if (!isEmailValid) {
      console.warn(
        "⚠️ Konfigurasi email tidak valid, pengiriman voucher code tidak akan berjalan"
      );
      return false;
    }

    // Start pengiriman voucher code job
    pengirimanVoucherCodeJob.start();
    console.log("✅ Pengiriman voucher code job berhasil dijalankan");

    return true;
  } catch (error) {
    console.error(
      "❌ Error saat inisialisasi cron job pengiriman voucher code:",
      error
    );
    throw error;
  }
};
