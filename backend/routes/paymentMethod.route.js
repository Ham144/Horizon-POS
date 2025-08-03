import { Router } from "express";
import PaymentMethod from "../models/PaymentMethod.model.js";
import Invoice from "../models/invoice.model.js";

const router = Router();

router.get("/getAllPaymentMethod", async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find();
    res.status(200).json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/createPaymentMethod", async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.create(req.body);
    res.status(201).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route untuk menghapus metode pembayaran
router.delete("/deletePaymentMethod/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPaymentMethod = await PaymentMethod.findByIdAndDelete(id);

    if (!deletedPaymentMethod) {
      return res
        .status(404)
        .json({ message: "Metode pembayaran tidak ditemukan" });
    }

    res.status(200).json({ message: "Metode pembayaran berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route untuk mengaktifkan/menonaktifkan metode pembayaran
router.patch("/togglePaymentMethodStatus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const paymentMethod = await PaymentMethod.findById(id);

    if (!paymentMethod) {
      return res
        .status(404)
        .json({ message: "Metode pembayaran tidak ditemukan" });
    }

    // Toggle status (true menjadi false atau sebaliknya)
    paymentMethod.status = !paymentMethod.status;
    await paymentMethod.save();

    const statusMessage = paymentMethod.status ? "diaktifkan" : "dinonaktifkan";
    res.status(200).json({
      message: `Metode pembayaran berhasil ${statusMessage}`,
      paymentMethod,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//endpoint untuk get invoices by payment method saat diklik di page sales report
router.get("/getInvoicesByPaymentMethod/:id", async (req, res) => {
  try {
    const { id } = req.params; // payment method id
    const { startDate, endDate, transactionStatus, outlet } = req.query;

    console.log(id, startDate, endDate, transactionStatus, outlet);

    // Buat filter untuk query
    const filter = {
      paymentMethod: id, // Filter berdasarkan payment method dari params
    };

    // Filter outlet berdasarkan kode invoice
    if (
      outlet &&
      outlet !== "all" &&
      outlet !== "undefined" &&
      outlet !== "null"
    ) {
      filter.kodeInvoice = new RegExp(`^${outlet}`, "i");
    }

    // Filter tanggal
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = startDateObj;
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }

    // Filter berdasarkan transactionStatus
    if (transactionStatus && transactionStatus !== "all") {
      if (transactionStatus === "success") {
        filter.done = true;
        filter.isVoid = { $ne: true };
      } else if (transactionStatus === "void") {
        filter.isVoid = true;
      } else if (transactionStatus === "pending") {
        filter.done = false;
        filter.isVoid = { $ne: true };
      }
    }

    // Logging filter untuk debugging
    console.log(
      "Filter invoices by payment method:",
      JSON.stringify(filter, null, 2)
    );

    // Find invoices with the filter
    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .populate("spg", "name"); // Populate spg info jika diperlukan

    // Count total amount
    const totalAmount = invoices.reduce(
      (total, invoice) => total + (invoice.total || 0),
      0
    );

    // Return response
    res.status(200).json({
      success: true,
      count: invoices.length,
      totalAmount,
      data: invoices,
    });
  } catch (error) {
    console.error("Error getting invoices by payment method:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mendapatkan invoice berdasarkan metode pembayaran",
      error: error.message,
    });
  }
});

export default router;
