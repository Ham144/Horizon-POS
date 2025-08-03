import { Router } from "express";
import SpgRefrensi from "../models/SpgRefrensi.model.js";
import Outlet from "../models/Outlet.model.js";

const router = Router();
router.post("/register", async (req, res) => {
  const {
    name,
    telepon,
    email,
    targetHargaPenjualan,
    targetQuantityPenjualan,
  } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Nama spg harus diisi" });
  }
  try {
    await SpgRefrensi.create({
      name: name,
      telepon: telepon,
      email: email,
      targetHargaPenjualan: targetHargaPenjualan
        ? parseFloat(targetHargaPenjualan)
        : 0,
      targetQuantityPenjualan: targetQuantityPenjualan
        ? parseInt(targetQuantityPenjualan)
        : 0,
    });
    return res.json({ message: "Berhasil membuat spg baru" });
  } catch (error) {
    return res.status(400).json({ message: "gagal membuat spg", error });
  }
});

router.put("/edit", async (req, res) => {
  const { id } = req.body;
  try {
    await SpgRefrensi.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: req?.body?.name,
          telepon: req?.body?.telepon,
          email: req?.body?.email,
          targetHargaPenjualan: req?.body?.targetHargaPenjualan
            ? parseFloat(req?.body?.targetHargaPenjualan)
            : 0,
          targetQuantityPenjualan: req?.body?.targetQuantityPenjualan
            ? parseInt(req?.body?.targetQuantityPenjualan)
            : 0,
        },
      }
    );
    return res.json({ message: "berhasil memperbarui spg" });
  } catch (error) {
    return res.status(400).json({ message: "gagal memperbarui spg", error });
  }
});

router.get("/spgList", async (req, res) => {
  try {
    const response = await SpgRefrensi.find();
    return res.json({ message: "berhasil mendapatkan spg", data: response });
  } catch (error) {
    return res.status(400).json({ message: "gagal mendapatkan spg", error });
  }
});

router.get("/spgList/mobile", async (req, res) => {
  try {
    const userId = req.user.userId;
    const myOutlet = await Outlet.findOne({
      kasirList: {
        $in: [userId],
      },
    }).populate(
      "spgList",
      "name email totalHargaPenjualan totalQuantityPenjualan targetHargaPenjualan targetQuantityPenjualan telepon"
    );
    if (!myOutlet) {
      return res
        .status(400)
        .json({ message: "outlet tidak ditemukan untuk akun anda" });
    }
    const response = await SpgRefrensi.find({
      _id: {
        $in: myOutlet.spgList,
      },
    });
    return res.json({ message: "berhasil mendapatkan spg", data: response });
  } catch (error) {
    return res.status(400).json({ message: "gagal mendapatkan spg", error });
  }
});

router.delete("/delete/:spgId", async (req, res) => {
  const { spgId } = req.params;
  if (!spgId) {
    return res.status(400).json({ message: "diperlukan spgId" });
  }
  const spgDB = await SpgRefrensi.findById(spgId);
  if (!spgDB) {
    return res.status(400).json({ message: "spg tidak ditemukan" });
  }
  try {
    // Remove the SPG from any outlet's kasirList
    await Outlet.updateMany(
      { kasirList: spgId },
      { $pull: { kasirList: spgId } }
    );

    await SpgRefrensi.findByIdAndDelete(spgId);
    return res.json({ message: "berhasil menghapus spg" });
  } catch (error) {
    return res.status(400).json({ message: "gagal menghapus spg", error });
  }
});

router.post("/getSpgById", async (req, res) => {
  const { id } = req.body;
  try {
    const spg = await SpgRefrensi.findById(id);
    return res.json({ message: "berhasil mendapatkan spg", data: spg });
  } catch (error) {
    return res.status(400).json({ message: "gagal mendapatkan spg", error });
  }
});

export default router;
