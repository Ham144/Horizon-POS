import DaftarPromo from "../models/DaftarPromo.model.js";

export const getAllPromo = async (req, res) => {
  const promos = await DaftarPromo.find({});
  return res.json({ message: "berhasil", data: promos, length: promos.length });
};

export const registerPromo = async (req, res) => {
  const {
    judulPromo,
    skuList,
    quantityBerlaku,
    berlakuDari,
    berlakuHingga,
    syaratQuantity,
    syaratTotalRp,
    skuBarangBonus,
    quantityBonus,
    authorizedOutlets,
    mode,
  } = req.body;

  try {
    // Validate required fields
    if (!judulPromo) {
      return res.status(400).json({ message: "judulPromo is required" });
    }
    if (!quantityBerlaku) {
      return res.status(400).json({ message: "quantityBerlaku is required" });
    }
    if (!berlakuHingga) {
      return res.status(400).json({ message: "berlakuHingga is required" });
    }
    if (!skuBarangBonus) {
      return res.status(400).json({ message: "skuBarangBonus is required" });
    }

    const promoData = {
      judulPromo,
      skuList: skuList || [],
      quantityBerlaku: parseInt(quantityBerlaku),
      berlakuDari: berlakuDari ? new Date(berlakuDari) : new Date(),
      berlakuHingga: new Date(berlakuHingga),
      syaratQuantity: syaratQuantity || null,
      syaratTotalRp: syaratTotalRp || null,
      skuBarangBonus,
      quantityBonus: parseInt(quantityBonus) || 1,
      authorizedOutlets,
      mode,
    };

    const response = await DaftarPromo.create(promoData);

    return res.json({
      message: "berhasil register promo baru",
      data: response,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(500).json({
        message: "gagal register promo, duplikat judulPromo",
        error: error,
      });
    }
    console.log("Error creating promo:", error);
    return res
      .status(400)
      .json({ message: "terjadi kesalahan", error: error.message });
  }
};

export const updatePromo = async (req, res) => {
  const {
    _id,
    judulPromo,
    skuList,
    quantityBerlaku,
    berlakuDari,
    berlakuHingga,
    syaratQuantity,
    syaratTotalRp,
    skuBarangBonus,
    quantityBonus,
    authorizedOutlets,
    mode,
  } = req.body;

  if (!mode) return res.status(400).json({ message: "ga ada mode" });

  await DaftarPromo.findByIdAndUpdate(
    _id,
    {
      judulPromo: judulPromo,
      skuList,
      quantityBerlaku,
      berlakuDari,
      berlakuHingga,
      syaratQuantity,
      syaratTotalRp,
      skuBarangBonus,
      quantityBonus,
      authorizedOutlets,
      mode: mode,
    },
    { new: true }
  );

  return res.json({ message: "berhasil update" });
};

export const getAllPromoByProduct = async (req, res) => {
  const { sku } = req.params;

  const promos = await DaftarPromo.find({ skuList: { $in: [sku] } });
  return res.json({ message: "berhasil", data: promos, length: promos.length });
};

export const deletePromo = async (req, res) => {
  const { id } = req.params;
  await DaftarPromo.findByIdAndDelete(id);
  return res.json({ message: "berhasil menghapus promo" });
};
