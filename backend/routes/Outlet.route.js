import { Router } from "express";
import Outlet from "../models/Outlet.model.js";
import sharp from "sharp";

const router = Router();

// Helper function to process logo
const processLogo = async (logoBase64) => {
  if (!logoBase64) return null;

  try {
    // Remove data URL prefix if exists
    const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Process image with sharp
    const processedBuffer = await sharp(imageBuffer)
      .resize(300, 100, {
        // 300px width (sesuai lebar kertas thermal 80mm)
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png({
        quality: 100, // Kualitas maksimal untuk logo
        compressionLevel: 9, // Kompresi maksimal untuk ukuran file
      })
      .toBuffer();

    // Convert back to base64
    return `data:image/png;base64,${processedBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error processing logo:", error);
    return null;
  }
};

router.post("/registerOutlet", async (req, res) => {
  const { namaOutlet, description, logo } = req.body;
  const undefineds = [];
  if (!namaOutlet) {
    undefineds.push("namaOutlet");
  }
  if (undefineds?.length) {
    return res.status(400).json({
      message: `Gagal, required field tidak diisi [${undefineds.join(", ")}]`,
      undefineds,
    });
  }

  try {
    const { namaOutlet, periodeSettlement, jamSettlement } = req.body;
    const outletListDB = await Outlet.find({});
    const isExisted = outletListDB.some(
      (item) => item.namaOutlet === namaOutlet
    );
    if (isExisted) {
      return res.status(500).json({ message: "outlet sudah ada" });
    }

    // Process logo if exists
    const processedLogo = await processLogo(logo);

    // Check if any of the users are already assigned to other outlets
    const usersInOtherOutlets = [];

    if (usersInOtherOutlets.length > 0) {
      return res.status(400).json({
        message:
          "Beberapa kasir sudah terdaftar di outlet lain. Satu kasir hanya dapat ditugaskan ke satu outlet.",
        usersInOtherOutlets,
      });
    }

    const lastKey = outletListDB[outletListDB.length - 1]?.kodeOutlet;
    let newKey = Number(lastKey) + 1 || "01";

    // Create the new outlet with processed logo
    await Outlet.create({
      kodeOutlet: newKey?.toString()?.padStart(2, "0"),
      namaOutlet: namaOutlet,
      description: description,
      logo: processedLogo,
      namaPerusahaan: req?.body?.namaPerusahaan,
      alamat: req?.body?.alamat,
      npwp: req?.body?.npwp,
      brandIds: req?.body?.brandIds,
      periodeSettlement: periodeSettlement || 1,
      jamSettlement: jamSettlement || "00:00",
    });

    return res.json({ message: "berhasil" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "gagal register outlet" });
  }
});

router.get("/getAllOutlet", async (req, res) => {
  try {
    const data = await Outlet.find({});
    return res.json({ data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "gagal mendapatkan outlet list" });
  }
});

router.put("/edit", async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.status(500).json({ message: "no _id" });
    }

    // Get current outlet data
    const currentOutlet = await Outlet.findById(_id);
    if (!currentOutlet) {
      return res.status(404).json({ message: "Outlet not found" });
    }

    // Process logo if exists and different from current
    const processedLogo =
      req.body.logo !== currentOutlet.logo
        ? await processLogo(req.body.logo)
        : currentOutlet.logo;

    // Filter valid kasir IDs
    const kasirListModified = req.body?.kasirList
      ? req.body?.kasirList?.filter(
          (item) => item !== "" && item !== undefined && item != null
        )
      : [];

    // Check if any of the new users are already assigned to other outlets
    const usersInOtherOutlets = [];
    for (const userId of kasirListModified) {
      if (userId) {
        const existingOutlet = await Outlet.findOne({
          _id: { $ne: _id }, // Exclude the current outlet
          kasirList: userId,
        });
        if (existingOutlet) {
          usersInOtherOutlets.push(userId);
        }
      }
    }

    if (usersInOtherOutlets.length > 0) {
      return res.status(400).json({
        message:
          "Beberapa kasir sudah terdaftar di outlet lain. gunakan AssignKasirToOutlet saja",
        usersInOtherOutlets,
      });
    }

    // Update outlet with processed logo
    await Outlet.findByIdAndUpdate(_id, {
      $set: {
        namaOutlet: req.body.namaOutlet,
        description: req.body.description,
        kasirList: kasirListModified,
        logo: processedLogo,
        namaPerusahaan: req?.body?.namaPerusahaan,
        alamat: req?.body?.alamat,
        npwp: req?.body?.npwp,
        periodeSettlement: req?.body?.periodeSettlement,
        jamSettlement: req?.body?.jamSettlement,
      },
    });

    return res.json({ message: "success" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "failed" });
  }
});

router.delete("/delete/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    if (!_id) {
      return res.status(500).json({ message: "no _id" });
    }

    // Simply delete the outlet without updating any users
    await Outlet.findByIdAndDelete(_id);

    return res.json({ message: "success" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "failed" });
  }
});

//getoutletbyuserid
router.get("/getOutlet/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(500).json({
      message: "gagal mendapatkan outlet, karena user id tidak diberikan",
    });
  }
  try {
    const outletDB = await Outlet.findOne({ kasirList: userId }).select(
      "-logo" //jangan bawa logo, buat api baru spesial aja, endpoint ini banyak dipakai biar ga berat
    );
    if (!outletDB) {
      return res
        .status(404)
        .json({ message: "akun ini belum terhubung ke outlet manapun" });
    }
    return res.json({ data: outletDB });
  } catch (error) {
    return res.status(500).json({ message: "Terjadi kesalahan" });
  }
});

//menerima satu user id bukan array
router.post("/assignUserToOutlet", async (req, res) => {
  const { userId, outletId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Remove user from any existing outlet's kasirList first
    await Outlet.updateMany(
      { kasirList: userId },
      { $pull: { kasirList: userId } }
    );

    // If a new outlet is specified, add the user to that outlet's kasirList
    if (outletId) {
      const outletToUpdate = await Outlet.findById(outletId);
      if (!outletToUpdate) {
        return res.status(404).json({ message: "Outlet not found" });
      }

      // Add user to the new outlet's kasirList if not already there
      if (!outletToUpdate.kasirList.includes(userId)) {
        outletToUpdate.kasirList.push(userId);
        await outletToUpdate.save();
      }
    }

    return res.json({ message: "User outlet assignment updated successfully" });
  } catch (error) {
    console.error("Error assigning user to outlet:", error);
    return res
      .status(500)
      .json({ message: "Failed to update user outlet assignment" });
  }
});

router.post("/linkBrandToOutlet", async (req, res) => {
  const { outletId, brandId } = req.body;
  if (!outletId || !brandId) {
    return res
      .status(400)
      .json({ message: "Outlet ID and Brand ID are required" });
  }

  try {
    const outletDB = await Outlet.findById(outletId);
    if (!outletDB) {
      return res.status(404).json({ message: "Outlet not found" });
    }

    // Cek apakah brandId sudah ada di array
    const brandExists = outletDB.brandIds.includes(brandId);

    if (brandExists) {
      // Hapus brandId dari array
      const newBrandIds = outletDB?.brandIds?.filter(
        (id) => id.toString() !== brandId
      );
      outletDB.brandIds = newBrandIds;
      await outletDB.save();
      return res.json({
        message: "Brand berhasil dihapus",
        data: newBrandIds,
      });
    } else {
      // Tambah brandId ke array
      outletDB.brandIds.push(brandId);
    }

    // Simpan perubahan
    await outletDB.save();

    // Kirim response dengan data terbaru
    return res.json({
      message: brandExists
        ? "Brand berhasil dihapus"
        : "Brand berhasil ditambahkan",
      data: outletDB.brandIds,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "failed" });
  }
});

//menerima array spgId
router.post("/assignSpgToOutlet", async (req, res) => {
  const { spgIds, outletId } = req.body;

  try {
    // If a new outlet is specified, add the user to that outlet's kasirList
    if (outletId) {
      const outletToUpdate = await Outlet.findById(outletId);
      if (!outletToUpdate) {
        return res.status(404).json({ message: "Outlet not found" });
      }

      //unique spgIds
      const uniqueSpgIds = [...new Set(spgIds)];
      outletToUpdate.spgList = uniqueSpgIds;
      await outletToUpdate.save();
    }

    return res.json({ message: "Berhasil menambahkan spg ke outlet" });
  } catch (error) {
    console.error("Error assigning spg to outlet:", error);
    return res.status(500).json({ message: "Gagal menambahkan spg ke outlet" });
  }
});

export default router;
