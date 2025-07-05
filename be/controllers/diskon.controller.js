import DaftartDiskon from "../models/DaftarDiskon.model";

export const registerDiskon = async (req, res) => {
  const {
    judulDiskon,
    description,
    berlakuHingga,
    RpPotonganHarga,
    percentPotonganHarga,
    skuTanpaSyarat,
    berlakuDari,
    quantityTersedia,
  } = req.body;
  console.log(req.body);

  if (!judulDiskon) {
    return res.status(400).json({
      message: "gagal membuat diskon, judulDiskon tidak boleh kosong",
    });
  }
  if (!description) {
    return res.status(400).json({
      message: "gagal membuat diskon, description tidak boleh kosong",
    });
  }
  if (!berlakuHingga) {
    return res.status(400).json({
      message: "gagal membuat diskon, berlakuHingga tidak boleh kosong",
    });
  }
  if (!RpPotonganHarga && !percentPotonganHarga) {
    return res.status(400).json({
      message:
        "gagal membuat diskon, RpPotonganHarga atau percentPotonganHarga tidak boleh kosong",
    });
  }

  try {
    const response = await DaftartDiskon.create({
      judulDiskon: judulDiskon,
      description: description,
      berlakuDari: berlakuDari ? new Date(berlakuDari) : new Date(),
      berlakuHingga: berlakuHingga ? new Date(berlakuHingga) : new Date(),
      RpPotonganHarga: RpPotonganHarga,
      percentPotonganHarga: percentPotonganHarga,
      skuTanpaSyarat: skuTanpaSyarat || [],
      quantityTersedia: quantityTersedia,
    });

    return res.json({ message: "berhasil register diskon" });
  } catch (error) {
    if (error.code) {
      return res
        .status(400)
        .json({ message: "Gagal register diskon, terjadi duplikasi data" });
    }
    return res.status(400).json({ message: "terjadi kesalahan", error: error });
  }
};  

export const deleteDiskon = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "ID diskon diperlukan" });
  }

  try {
    const diskon = await DaftartDiskon.findById(id);
    if (!diskon) {
      return res.status(404).json({ message: "Diskon tidak ditemukan" });
    }

    await DaftartDiskon.findByIdAndDelete(id);
    return res.json({
      message: "Berhasil menghapus diskon",
      data: diskon,
    });
  } catch (error) {
    console.log("Delete error:", error);
    return res.status(400).json({
      message: "Gagal menghapus diskon",
      error: error.message,
    });
  }
};

export const updateDiskon = async (req, res) => {
  const {
    _id,
    judulDiskon,
    description,
    berlakuDari,
    berlakuHingga,
    RpPotonganHarga,
    percentPotonganHarga,
    skuTanpaSyarat,
    quantityTersedia,
  } = req.body;
  try {
    if (RpPotonganHarga && percentPotonganHarga) {
      return res.status(400).json({
        message:
          "hanya boleh salah satu RpPotonganHarga atau percentPotonganHarga",
      });
    }

    const response = await DaftartDiskon.findOneAndUpdate(
      { _id },
      {
        $set: {
          judulDiskon,
          description,
          berlakuHingga: new Date(berlakuHingga).toISOString(),
          berlakuDari,
          RpPotonganHarga: RpPotonganHarga?.$numberDecimal,
          percentPotonganHarga: percentPotonganHarga?.$numberDecimal,
          skuTanpaSyarat: skuTanpaSyarat || [],
          quantityTersedia,
        },
      }
    );

    if (!response) {
      return res
        .status(400)
        .json({ message: "gagal memperbarui diskon", error: response });
    }
    return res.json({ message: "berhasil memperbarui diskon" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Terjadi kesalahan", error: error });
  }
};

export const getAllDiskon = async (req, res) => {
  try {
    const rawData = await DaftartDiskon.find({});
    return res.json({
      message: "Berhasil mengambil data diskon",
      data: rawData,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Gagal mendapatkan data diskon", error: error });
  }
};

//import csv fitur

export const registerMultiDiskon = async (req, res) => {
  return res.send("belum di buat");
};

export const deleteMultiDiskon = async (req, res) => {
  const { skus } = req.body;
  if (!skus)
    return res
      .status(400)
      .json({ message: "tidak berhasil menghapus, multi sku diperlukan" });

  try {
    const success = await InventoryRefrensi.deleteMany({ sku: { $in: skus } });
    if (!success) return res.status(400).json({ message: "gagal menghapus" });
    return res.json({ message: "berhasil menghapus" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "terjadi kesalahan" });
  }
};

export const getAllDiskonByProduct = async (req, res) => {
  const { sku } = req.params;

  const diskon = await DaftartDiskon.find({ skuTanpaSyarat: { $in: [sku] } });
  return res.json({ message: "berhasil", data: diskon, length: diskon.length });
};
