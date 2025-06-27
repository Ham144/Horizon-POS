import InventoryRefrensi from "../models/InventoryRefrensi.model.js";
import DaftartDiskon from "../models/DaftarDiskon.model.js";
import DaftarPromo from "../models/DaftarPromo.model.js";
import DaftarVoucher from "../models/DaftarVoucher.model.js";
import Brand from "../models/brand.model.js";
import Outlet from "../models/Outlet.model.js";
import UserRefrensi from "../models/User.model.js";
import mongoose from "mongoose";
import { stackTracingSku } from "../utils/stackTracingSku.js";

//ini untuk buat manual inventory, jarang dipake karena biasanya sudah ada didapat dari api pihak ketiga
export const registerSingleInventori = async (req, res) => {
  //cek apakah barang sudah ada
  //simpan semuanya kedatabase
  const {
    sku,
    isDisabled = false,
    quantity,
    RpHargaDasar,
    barcodeItem,
    description,
    brand,
    promos,
    diskons,
    vouchers,
  } = req.body;

  try {
    if (!description) {
      return res.status(400).json({
        message: "gagal membuat inventory, description tidak boleh kosong",
      });
    }
    if (!brand) {
      return res.status(400).json({
        message: "gagal membuat inventory, brand tidak boleh kosong",
      });
    }

    const response = await InventoryRefrensi.create({
      _id: sku,
      sku,
      description,
      isDisabled,
      quantity: Number(quantity),
      RpHargaDasar: parseFloat(RpHargaDasar),
      barcodeItem: barcodeItem,
      brand,
    });

    await stackTracingSku(
      response._id,
      req.user.userId,
      "register single inventory: Membuat item baru dari item_library manual",
      "spawn",
      0,
      response?.quantity || 0
    );

    if (promos) {
      const addPromos = promos.map((promoId) => {
        DaftarPromo.updateOne(
          { _id: promoId },
          { $addToSet: { skuList: sku } }
        );
      });
      await Promise.all(addPromos);
    }
    if (diskons) {
      diskons.map((diskonId) => {
        DaftartDiskon.updateOne(
          { _id: diskonId },
          { $addToSet: { skuList: sku } }
        );
      });
    }

    if (!response) return res.status(400).json({ message: "gagal menyimpan" });
    return res.json({ message: "berhasil register produk ke inventori" });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "gagal menyimpan, produk sudah ada" });
    }
    console.log(error);
    return res.status(400).json({ message: "gagal menyimpan" });
  }
};

//tidak bisa hapus karena kalau dihapus dari database, akan diambil lagi dari pihak ke tiga, disable aja
export const disableSingleInventoriToggle = async (req, re) => {
  const { sku } = req.body;
  if (!sku)
    return res
      .status(400)
      .json({ message: "tidak berhasil disable, sku diperlukan" });

  try {
    const success = await InventoryRefrensi.findOneAndUpdate(
      { sku },
      { isDisabled: !this.isDisabled },
      { upsert: false, new: true }
    );
    if (!success) return res.status(400).json({ message: "gagal disbale" });
    return res.json({ message: "berhasil menghapus" });
  } catch (error) {
    return res.status(400).json({ message: "gagal menghapus" });
  }
};

export const updateSingleInventori = async (req, res) => {
  const {
    sku,
    isDisabled,
    quantity,
    RpHargaDasar,
    barcodeItem,
    description,
    brand,
    promosToAdd,
    promosToDelete,
    diskonsToAdd,
    diskonsToDelete,
    voucherToBlock,
    voucherToOpenBlock,
  } = req.body;

  if (!sku)
    return res
      .status(400)
      .json({ message: "tidak berhasil memperbarui, sku diperlukan" });
  try {
    const item = await InventoryRefrensi.findOne({
      sku: sku.trim(),
    });

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "SKU tidak ditemukan." });
    }

    const numericQuantity =
      typeof quantity === "string" ? parseInt(quantity) : quantity;

    if (numericQuantity !== undefined && numericQuantity !== item.quantity) {
      const category =
        numericQuantity > item.quantity ? "increase" : "decrease";

      await stackTracingSku(
        item._id,
        req.user.userId,
        "update single inventory: update single inventory",
        category,
        item.quantity,
        numericQuantity
      );
    }

    // Update fields
    item.quantity =
      numericQuantity !== undefined ? numericQuantity : item.quantity;
    item.RpHargaDasar = RpHargaDasar ?? item.RpHargaDasar;
    item.isDisabled = isDisabled ?? item.isDisabled;
    item.barcodeItem = barcodeItem ?? item.barcodeItem;
    item.description = description ?? item.description;
    item.brand = brand ?? item.brand;

    await item.save();

    if (promosToDelete) {
      await Promise.all(
        promosToDelete.map((promoId) =>
          DaftarPromo.updateOne(
            { _id: promoId }, // Filter berdasarkan ID promo
            { $pull: { skuList: sku } } // Hapus sku dari skuList jika ada
          )
        )
      );
    }

    if (promosToAdd) {
      await Promise.all(
        promosToAdd.map((promoId) =>
          DaftarPromo.updateOne(
            { _id: promoId }, // Filter berdasarkan ID promo
            { $addToSet: { skuList: sku } } // Tambahkan sku ke skuList jika belum ada
          )
        )
      );
    }

    if (diskonsToAdd) {
      await Promise.all(
        diskonsToAdd.map((diskonId) =>
          DaftartDiskon.updateOne(
            { _id: diskonId },
            { $addToSet: { skuTanpaSyarat: sku } }
          )
        )
      );
    }

    if (diskonsToDelete) {
      await Promise.all(
        diskonsToDelete.map((diskonId) =>
          DaftartDiskon.updateOne(
            { _id: diskonId },
            { $pull: { skuTanpaSyarat: sku } }
          )
        )
      );
    }

    if (voucherToBlock) {
      await Promise.all(
        voucherToBlock.map((voucherId) =>
          DaftarVoucher.updateOne(
            { _id: voucherId },
            { $addToSet: { skuPengecualian: sku } }
          )
        )
      );
    }

    if (voucherToOpenBlock) {
      await Promise.all(
        voucherToOpenBlock.map((voucherId) =>
          DaftarVoucher.updateOne(
            { _id: voucherId },
            { $pull: { skuPengecualian: sku } }
          )
        )
      );
    }

    return res.json({ message: "berhasil memperbarui" });
  } catch (error) {
    console.log(error);
    return res.json({ message: "gagal memperbarui" });
  }
};

//(UNTUK WEB) Jangan gunakan ini untuk mobile lagi, rawan rusak karena filter complex
export const getAllinventories = async (req, res) => {
  const {
    startDate,
    endDate,
    page = 1,
    limit = 100,
    asc = false,
    searchKey,
    brandIds, //untuk mengambil brand tertentu saja (jika tidak ada outletid/brandId maka ambil semua inventory)
    //filter untuk menampilkan data item dengan field memiliki nilai saja
    requiredQuantity = false,
    requiredRpHargaDasar = false,
    requiredBarcodeItem = false,
  } = req.query;

  const complex = {};
  if (brandIds) {
    const arrayBrandIds = brandIds?.split(",");
    const brandList = await Brand.find({
      _id: { $in: arrayBrandIds },
    });
    const brandName = brandList.map((brand) => brand.name);
    complex.brand = { $in: brandName };
  }

  if (searchKey) {
    complex.$or = [
      { sku: { $regex: searchKey, $options: "i" } },
      { description: { $regex: searchKey, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    complex.updatedAt = {};
    if (startDate) {
      complex.updatedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      complex.updatedAt.$lte = new Date(endDate);
    }
  }
  if (requiredQuantity) {
    complex.quantity = { $gte: 1 };
  }
  if (requiredRpHargaDasar) {
    complex.RpHargaDasar = { $gt: mongoose.Types.Decimal128.fromString("0") };
  }
  if (requiredBarcodeItem) {
    complex.barcodeItem = { $ne: null };
  }

  const totalItems = await InventoryRefrensi.countDocuments(complex);
  const totalPages = Math.ceil(totalItems / Number(limit));
  const data = await InventoryRefrensi.find(complex)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ updatedAt: asc ? -1 : 1 });

  return res.json({ message: "berhasil", data, totalItems, totalPages });
};

//ini untuk mengupdate harga dengan csv beserta
//create item baru jika tidak ditemukan di DB
export const updateBulkPrices = async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Format tidak valid. Harap masukkan array yang tidak kosong.",
    });
  }

  let traceSummary = {
    spawn: 0,
    increase: 0,
    decrease: 0,
    other: 0,
  };

  try {
    // 1. Persiapkan list SKU
    const skuList = updates.map((u) => u.sku.trim().toUpperCase());

    // 2. Ambil data lama
    const existingInventories = await InventoryRefrensi.find({
      sku: { $in: skuList },
    });
    const existingMap = new Map();
    existingInventories.forEach((inv) => existingMap.set(inv.sku, inv));

    // 3. Buat bulk operation
    const updateOperations = updates.map((update) => {
      const sku = update.sku.trim().toUpperCase();

      return {
        updateOne: {
          filter: { sku },
          update: {
            $set: {
              _id: sku,
              RpHargaDasar: update?.RpHargaDasar,
              description: update?.description,
              brand: update?.brand?.trim().toUpperCase(),
              barcodeItem: update?.barcodeItem,
            },
          },
          upsert: true,
        },
      };
    });

    // 4. Jalankan bulkWrite
    const result = await InventoryRefrensi.bulkWrite(updateOperations);

    // 5. Loop lagi dan simpan StackTrace
    for (const update of updates) {
      const sku = update.sku.trim().toUpperCase();
      const existing = existingMap.get(sku);
      const isSpawned = !existing;

      const prevQuantity = existing?.quantity || 0;
      const receivedQuantity = update.quantity ?? 0;

      const category = isSpawned
        ? "spawn"
        : receivedQuantity > prevQuantity
        ? "increase"
        : receivedQuantity < prevQuantity
        ? "decrease"
        : "other";

      // Optional: skip if quantity tidak berubah
      if (!isSpawned && prevQuantity === receivedQuantity) continue;

      traceSummary[category]++;
      await stackTracingSku(
        sku, // pakai sku karena _id juga = sku
        req.user.userId,
        "Update Bulk Price - Bulk Import",
        category,
        prevQuantity,
        receivedQuantity
      );
    }

    return res.json({
      success: true,
      message: `Berhasil memperbarui ${result.modifiedCount} item & membuat ${
        result.upsertedCount || 0
      } item baru.`,
      updatedCount: result.modifiedCount,
      insertedCount: result.upsertedCount || 0,
      traceSummary,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui harga",
      error: error.message,
    });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const { skuId } = req.params;

    const inventory = await InventoryRefrensi.findOne({
      sku: skuId,
    });

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved inventory",
      data: inventory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve inventory",
      error: error.message,
    });
  }
};

//mobile: get Initial Inventory
export const getAllinventoriesMobile = async (req, res) => {
  const {
    startDate,
    endDate,
    page = 1,
    limit = 50,
    asc = true,
    searchKey,
  } = req.query;

  //default mendapatkan inventory dengan hanya brand terhubung ke outlet userInfo saja, ini khusus mobile, jika ingin bebas pakai getAllinventories(untuk web)
  //kalau Your outlet tidak ada brand, maka akan mendapatkan semua inventory
  const userDB = await UserRefrensi.findById(req.userId);
  const myOutlet = await Outlet.findOne({
    kasirList: { $in: [userDB._id] },
  });
  const brandIds = myOutlet?.brandIds;
  const brandList = await Brand.find({
    _id: { $in: brandIds },
  });
  const brandName = brandList.map((brand) => brand.name);

  const complex = {};
  if (brandName.length > 0) {
    complex.brand = { $in: brandName };
  }
  if (searchKey) {
    complex.$or = [
      { sku: { $regex: searchKey, $options: "i" } },
      { description: { $regex: searchKey, $options: "i" } },
    ];
  }
  if (startDate || endDate) {
    complex.updatedAt = {};
    if (startDate) {
      complex.updatedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      complex.updatedAt.$lte = new Date(endDate);
    }
  }

  const totalItems = await InventoryRefrensi.countDocuments(complex);
  const data = await InventoryRefrensi.find(complex)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ updatedAt: -1 });
  return res.json({ message: "berhasil", data, totalItems });
};
