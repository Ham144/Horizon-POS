import { Router } from "express";
import Invoice from "../models/invoice.model.js";
import Spg from "../models/SpgRefrensi.model.js";
import User from "../models/User.model.js";
import Outlet from "../models/Outlet.model.js";
import Inventory from "../models/InventoryRefrensi.model.js";
import Diskon from "../models/DaftarDiskon.model.js";
import Promo from "../models/DaftarPromo.model.js";
import { stackTracingSku } from "../utils/stackTracingSku.js";

const router = Router();

//untuk mobile perlu kode outlet biar ga berat ambil semua
router.get("/getAllInvoice", async (req, res) => {
  try {
    const userId = req.user.userId;
    const myOutlet = await Outlet.findOne({
      kasirList: {
        $in: [userId],
      },
    });

    if (!myOutlet) {
      return res.status(400).json({
        message:
          "Gagal mencari akun anda di outlet tertentu saat pengumpulan invoice",
      });
    }

    const data = await Invoice.find({
      kodeInvoice: {
        $regex: `^${myOutlet.kodeOutlet}`,
        $options: "i", // pakai "i" jika mau case-insensitive, atau hapus jika case-sensitive
      },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ message: "berhasil mendapatkan data invoice", data });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ message: "gagal mengambil invoice / bill billTersimpan" });
  }
});

//untuk web
router.get("/getInvoiceFilterComplex", async (req, res) => {
  try {
    const {
      kodeOutlet,
      spg,
      kasir,
      startDate,
      endDate,
      isVoid,
      done,
      search,
      limit = 50,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Buat filter dasar
    let filter = {};

    // Filter berdasarkan outlet
    if (kodeOutlet) {
      // Cari invoice yang kodeInvoice-nya dimulai dengan kodeOutlet
      filter.kodeInvoice = { $regex: `^${kodeOutlet}`, $options: "i" };
      console.log("Menggunakan filter kodeOutlet:", kodeOutlet);
    }

    // Filter berdasarkan SPG
    if (spg) {
      filter.spg = spg;
    }

    // Filter berdasarkan Kasir
    if (kasir) {
      filter.salesPerson = kasir;
    }

    // Filter kasus isVoid=true (tab dibatalkan)
    if (isVoid === "true") {
      // Hanya ambil dokumen yang punya isVoid=true
      filter.isVoid = true;
      console.log("Filter: Dibatalkan (isVoid = true)");
    }
    // Filter kasus isVoid=false (tab selesai atau tertunda)
    else if (isVoid === "false") {
      // Ambil dokumen yang punya isVoid=false ATAU yang tidak punya field isVoid sama sekali
      filter.$or = [{ isVoid: false }, { isVoid: { $exists: false } }];

      // Tab Selesai: done=true
      if (done === "true") {
        filter.done = true;
        console.log(
          "Filter: Selesai (isVoid = false atau tidak ada, done = true)"
        );
      }
      // Tab Tertunda: done=false
      else if (done === "false") {
        // Dokumen dengan done=false atau done tidak ada sama sekali
        // Kita perlu menggunakan $and karena sudah ada $or untuk isVoid
        filter.$and = [
          { $or: filter.$or }, // Tetap pertahankan $or untuk isVoid
          { $or: [{ done: false }, { done: { $exists: false } }] },
        ];
        // Hapus $or di level luar karena sudah dimasukkan ke $and
        delete filter.$or;
      }
      // Jika tidak ada done, tetap pakai filter isVoid saja
      else {
        console.log("Filter: isVoid = false atau tidak ada, tanpa nilai done");
      }
    }
    // Jika tidak ada isVoid atau done (tab semua), tidak tambahkan filter apapun

    const startDatePoint = new Date(startDate).setHours(0, 0, 0, 0);
    const endDatePoint = new Date(endDate).setHours(23, 59, 59, 999);

    // Filter berdasarkan tanggal
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: startDatePoint,
        $lte: endDatePoint,
      };
    }

    // Filter berdasarkan pencarian
    if (search) {
      filter.$or = [
        { kodeInvoice: { $regex: search?.trim(), $options: "i" } },
        { _id: { $regex: search?.trim(), $options: "i" } },
      ];
    }

    // Konfigurasi sort
    const sortConfig = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Konfigurasi pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = limit === "All" ? 0 : parseInt(limit);

    // Hitung total data
    const total = await Invoice.countDocuments(filter);

    // Query data
    const data = await Invoice.find(filter)
      .sort(sortConfig)
      .skip(skip)
      .limit(limitValue)
      .populate("futureVoucher", "judulVoucher potongan");

    return res.json({
      message: "berhasil mendapatkan data invoice",
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitValue,
        totalPages: limitValue > 0 ? Math.ceil(total / limitValue) : 1,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ message: "gagal mengambil invoice / bill billTersimpan" });
  }
});

// Endpoint untuk mendapatkan invoice berdasarkan status
router.get("/getInvoiceByStatus", async (req, res) => {
  try {
    const {
      status,
      limit = 20,
      page = 1,
      startDate,
      endDate,
      search,
      isPrintedKwitansi,
    } = req.query;
    const skip = (page - 1) * limit;

    // Filter dasar
    let filter = {};

    // Filter berdasarkan status
    if (status === "completed") {
      filter.done = { $in: [true, 1, "true"] };
      filter.isVoid = { $nin: [true, 1, "true"] };
    } else if (status === "pending") {
      filter.done = { $nin: [true, 1, "true"] };
      filter.isVoid = { $nin: [true, 1, "true"] };
    } else if (status === "void") {
      filter.isVoid = { $in: [true, 1, "true"] };
    } else if (status === "kwitansi_tertunda") {
      // Status khusus untuk kwitansi tertunda
      filter.done = { $in: [true, 1, "true"] };
      filter.isVoid = { $nin: [true, 1, "true"] };
      filter.isPrintedKwitansi = { $nin: [true, 1, "true"] };
    }

    // Filter tambahan berdasarkan isPrintedKwitansi jika ada
    if (isPrintedKwitansi !== undefined) {
      const isPrintedKwitansiValue =
        isPrintedKwitansi === "true" || isPrintedKwitansi === true;
      filter.isPrintedKwitansi = {
        $in: isPrintedKwitansiValue
          ? [true, 1, "true"]
          : [false, 0, "false", null, undefined],
      };
    }

    // Filter berdasarkan tanggal
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Filter berdasarkan pencarian
    if (search) {
      filter.$or = [
        { kodeInvoice: { $regex: search, $options: "i" } },
        { salesPerson: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Invoice.countDocuments(filter);
    const data = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      message: "berhasil mendapatkan data invoice",
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ message: "gagal mengambil invoice berdasarkan status" });
  }
});

// Endpoint untuk mendapatkan statistik invoice
router.get("/getInvoiceStats", async (req, res) => {
  try {
    console.log("masuk sini");
    const { startDate, endDate } = req.query;
    console.log(req.query);
    // Gunakan filter yang lebih sederhana yang sudah terbukti berfungsi dari debugInvoiceData
    let filter = {};

    // Tambahkan filter tanggal jika ada
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Hitung invoice berdasarkan status
    const completedCount = await Invoice.countDocuments({
      ...filter,
      done: { $in: [true, 1, "true"] },
    });

    const pendingCount = await Invoice.countDocuments({
      ...filter,
      done: { $nin: [true, 1, "true"] },
      isVoid: { $nin: [true, 1, "true"] },
    });

    const voidCount = await Invoice.countDocuments({
      ...filter,
      isVoid: { $in: [true, 1, "true"] },
    });

    // Hitung total nilai penjualan yang berhasil
    const completedInvoices = await Invoice.find({
      ...filter,
      done: { $in: [true, 1, "true"] },
    });

    let totalSales = 0;
    for (const invoice of completedInvoices) {
      const invoiceTotal = Number(invoice.total) || 0;
      totalSales += invoiceTotal;
    }

    // Top selling items - jika gagal, gunakan array kosong
    let topSellingItems = [];
    try {
      topSellingItems = await Invoice.aggregate([
        { $match: { ...filter, done: { $in: [true, 1, "true"] } } },
        {
          $unwind: { path: "$currentBill", preserveNullAndEmptyArrays: false },
        },
        {
          $group: {
            _id: "$currentBill.sku",
            description: { $first: "$currentBill.description" },
            totalQuantity: {
              $sum: { $toInt: { $ifNull: ["$currentBill.quantity", 0] } },
            },
            totalSales: {
              $sum: { $toDouble: { $ifNull: ["$currentBill.totalRp", 0] } },
            },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]);
    } catch (err) {
      console.error("Error dalam aggregasi top sales:", err);
    }

    const responseData = {
      message: "berhasil mendapatkan statistik invoice",
      data: {
        counts: {
          completed: completedCount,
          pending: pendingCount,
          void: voidCount,
          total: completedCount + pendingCount + voidCount,
        },
        totalSales,
        topSellingItems,
      },
    };
    return res.json(responseData);
  } catch (error) {
    console.error("Error dalam getInvoiceStats:", error);
    return res.status(400).json({
      message: "gagal mengambil statistik invoice",
      error: error.message,
      stack: error.stack,
    });
  }
});

// cek perubahan setelah void :
// diskon:
// .quantitytersedia 100 (101) ✅
// promo :
// .quantityBerlaku -> belum dicek
// .barang bonus Kembali -> belum dicek
// voucher :
// quantityTersedia -> belum dicek
// terjadi -> belum dicek
// inventory:
// .quantity : 60 (61) ✅
// .terjual : 32 (31)✅
// outlet:
// .pendapatan: 3999880 (3610180) ✅
// spg:
// .totalHargaPenjualan : 2594980 (2205280)  ✅
// .totalQuantityPenjualan :  6 (5)✅
// .skuTerjual : [{else},{sku: egsa, quantity : 1}] => ([{else},{sku: egsa, quantity : 0}])  ✅
// user:
// .totalHargaPenjualan : 100000 (-289700)✅
// .totalQuantityPenjualan : 1(0) ✅
// .skuTerjual ✅
//invoice:
// isVoid : true ✅
//untuk pembatalan invoice yang telah dibayar
router.post("/voidInvoice", async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const invoiceDB = await Invoice.findById(invoiceId);

    if (!invoiceDB) {
      return res.status(404).json({ message: "Invoice Tidak ditemukan" });
    }
    // Validation
    const isVoid = invoiceDB?.isVoid;
    if (isVoid) {
      return res.status(400).json({ message: "Invoice sudah pernah di void" });
    }
    await Promise.all(
      invoiceDB.currentBill.map(async (bill) => {
        const inventoryDB = await Inventory.findOne({ sku: bill.sku });

        if (inventoryDB) {
          await stackTracingSku(
            inventoryDB._id,
            req.user._id,
            "Void: pengembalian stock karena pembatalan invoice terbayar telah di batalkan",
            "increase",
            inventoryDB.quantity,
            Number(inventoryDB.quantity) + Number(bill.quantity),
            invoiceDB._id
          );

          inventoryDB.quantity += bill.quantity;
          inventoryDB.terjual -= bill.quantity;
          await inventoryDB.save();
        }
      })
    );

    // Modif diskon
    if (invoiceDB?.diskon?.length) {
      for (const diskon of invoiceDB.diskon) {
        const diskonDB = await Diskon.findById(diskon.diskonInfo.diskonId);
        if (diskonDB) {
          diskonDB.quantityTersedia++;
          await diskonDB.save();
        }
      }
    }

    // Modif promo
    if (invoiceDB?.promo?.length) {
      await Promise.all(
        invoiceDB.promo.map(async (promo) => {
          const promoDB = await Promo.findById(promo.promoInfo.promoId);
          if (!promoDB) return;

          promoDB.quantityBerlaku++;

          const inventoryDB = await Inventory.findOne({
            sku: promo.promoInfo?.skuBarangBonus,
          });

          if (inventoryDB) {
            inventoryDB.quantity += promo.promoInfo?.quantityBonus;
            await inventoryDB.save();
          }
        })
      );
    }

    //modif futureVouchers
    if (invoiceDB?.futureVoucher?.length) {
      for (const voucher of invoiceDB?.futureVoucher) {
        const voucherDB = await DaftarVoucher.findById(
          voucher.voucherInfo.voucherId
        );
        if (voucherDB) {
          voucherDB.quantityTersedia++;
          voucherDB.terjadi--;
          await voucherDB.save();
        }
      }
    }

    // Modif kasir
    const userDB = await User.findOne({ username: invoiceDB.salesPerson });
    if (userDB) {
      userDB.totalQuantityPenjualan -= invoiceDB.currentBill.length;
      userDB.totalHargaPenjualan -= invoiceDB.total;

      // Update skuTerjual untuk kasir
      if (userDB.skuTerjual && userDB.skuTerjual.length > 0) {
        for (const bill of invoiceDB.currentBill) {
          const skuIndex = userDB.skuTerjual.findIndex(
            (item) => item.sku === bill.sku
          );
          if (skuIndex !== -1) {
            userDB.skuTerjual[skuIndex].quantity -= bill.quantity;
          }
        }
      }

      await userDB.save();
    }

    // Modif spg
    if (invoiceDB.spg) {
      const spgDB = await Spg.findById(invoiceDB.spg);
      if (spgDB) {
        spgDB.totalInvoice -= 1;
        spgDB.totalHargaPenjualan -= invoiceDB.total;

        // Update skuTerjual untuk SPG
        if (spgDB.skuTerjual && spgDB.skuTerjual.length > 0) {
          for (const bill of invoiceDB.currentBill) {
            const skuIndex = spgDB.skuTerjual.findIndex(
              (item) => item.sku === bill.sku
            );
            if (skuIndex !== -1) {
              spgDB.skuTerjual[skuIndex].quantity -= bill.quantity;
            }
          }

          // Recalculate total quantity
          const totalQuantityPenjualan = spgDB.skuTerjual.reduce(
            (acc, item) => acc + item.quantity,
            0
          );

          spgDB.totalQuantityPenjualan = totalQuantityPenjualan;
        }

        await spgDB.save();
      }
    }

    // Modif outlet
    const kodeOutlet = invoiceDB.kodeInvoice.slice(0, 2);
    const outletDB = await Outlet.findOne({ kodeOutlet });
    if (outletDB) {
      outletDB.pendapatan -= invoiceDB.total;
      await outletDB.save();
    }

    // Modif invoice
    invoiceDB.isVoid = true;
    invoiceDB.confirmVoidById = req.user.userId;
    invoiceDB.tanggalVoid = new Date();
    await invoiceDB.save();

    return res.json({
      success: true,
      message: "Berhasil dibatalkan",
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Gagal membatalkan invoice", error: error.message });
  }
});

// Endpoint untuk menandai invoice sebagai sudah dicetak kwitansi
router.put("/markAsPrinted/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah invoice ada
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice tidak ditemukan" });
    }

    // Update invoice
    await Invoice.findByIdAndUpdate(id, {
      $set: { isPrintedKwitansi: true },
    });

    return res.json({
      success: true,
      message: "Status invoice berhasil diubah menjadi sudah dicetak kwitansi",
    });
  } catch (error) {
    console.error("Error saat menandai invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengubah status invoice",
      error: error.message,
    });
  }
});

export default router;
