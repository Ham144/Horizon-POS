import { Router } from "express";
import generateTokenJWT from "../utils/generateTokenJWT.js";
import generateTokenMobile from "../utils/generateTokenMobile.js";
import UserRefrensi from "../models/User.model.js";
import Outlet from "../models/Outlet.model.js";
import bcrypt from "bcryptjs";
import authorize from "../middlewares/authorize.js";

const router = Router();

//login web
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ message: "username diperlukan" });
  }
  if (!password) {
    return res.status(400).json({ message: "password diperlukan" });
  }

  try {
    const userDB = await UserRefrensi.findOne({ username });
    if (!userDB) {
      return res.status(400).json({ message: "username atau password salah" });
    }

    const isPasswordMatch = bcrypt.compareSync(password, userDB.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "username atau password salah" });
    }

    const sanitizedUser = {
      _id: userDB._id,
      username: userDB.username,
    };

    const token = await generateTokenJWT(userDB._id);

    const originFull = req.originalUrl;

    console.log(originFull);

    // Set cookie di sini
    res.cookie("token", token, {
      httpOnly: true, // agar tidak bisa diakses dari client-side JS
      secure:
        process.env.NODE_ENV === "production" &&
        !originFull.startsWith("http://192.168.169.14")
          ? true
          : false, // Ganti secure true jika production kalau prod https
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    return res.json({
      message: "Selamat datang kembali",
      data: sanitizedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: JSON.stringify(error) });
  }
});

// Add a function to generate a unique kodeKasir
const generateUniqueKodeKasir = async (username) => {
  // Extract first 2 characters from username and capitalize them
  let baseCode = username.substring(0, 2).toUpperCase();

  // Add a random digit or letter to make it 3 characters
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let isUnique = false;
  let kodeKasir = "";
  let attempts = 0;

  while (!isUnique && attempts < 50) {
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    kodeKasir = baseCode + randomChar;

    // Check if this code already exists
    const existingUser = await UserRefrensi.findOne({ kodeKasir });
    if (!existingUser) {
      isUnique = true;
    } else {
      attempts++;
      // If we've tried many times with the first 2 chars, try with different base
      if (attempts > 20) {
        baseCode =
          username.substring(0, 1).toUpperCase() +
          chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
  }

  // If we couldn't find a unique code after many attempts, generate a completely random one
  if (!isUnique) {
    while (!isUnique) {
      kodeKasir = "";
      for (let i = 0; i < 3; i++) {
        kodeKasir += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existingUser = await UserRefrensi.findOne({ kodeKasir });
      if (!existingUser) {
        isUnique = true;
      }
    }
  }

  return kodeKasir;
};

// Update the createNewUser endpoint
router.post("/createNewUser", async (req, res) => {
  const {
    username,
    password,
    email,
    telepon,
    targetHargaPenjualan,
    targetQuantityPenjualan,
    roleName,
    blockedAccess,
    kodeKasir: customKodeKasir,
    outletId,
  } = req.body;

  // Validasi field wajib
  if (!username) {
    return res.status(400).json({ message: "Username diperlukan" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password diperlukan" });
  }
  if (!email) {
    return res.status(400).json({ message: "Email diperlukan" });
  }
  if (!roleName) {
    return res.status(400).json({ message: "Role name diperlukan" });
  }

  try {
    // Periksa kodeKasir custom jika disediakan
    let kodeKasir;
    if (customKodeKasir && customKodeKasir.length > 0) {
      // Validasi format kodeKasir (harus 3 karakter)
      if (customKodeKasir.length !== 3) {
        return res.status(400).json({ message: "Kode kasir harus 3 karakter" });
      }

      // Periksa apakah kodeKasir sudah digunakan
      const existingKasir = await UserRefrensi.findOne({
        kodeKasir: customKodeKasir,
      });
      if (existingKasir) {
        return res.status(400).json({
          message: "Kode kasir sudah digunakan, silakan gunakan kode lain",
        });
      }

      kodeKasir = customKodeKasir;
    } else {
      // Generate kodeKasir otomatis jika tidak disediakan
      kodeKasir = await generateUniqueKodeKasir(username);
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Buat user baru
    const newUser = new UserRefrensi();
    newUser.username = username;
    newUser.password = hashedPassword;
    newUser.email = email;
    newUser.roleName = roleName;
    newUser.kodeKasir = kodeKasir;

    // Field opsional
    if (telepon) {
      newUser.telepon = telepon;
    }
    if (targetHargaPenjualan !== undefined) {
      newUser.targetHargaPenjualan = Number(targetHargaPenjualan) || 0;
    }
    if (targetQuantityPenjualan !== undefined) {
      newUser.targetQuantityPenjualan = Number(targetQuantityPenjualan) || 0;
    }
    if (blockedAccess && Array.isArray(blockedAccess)) {
      newUser.blockedAccess = blockedAccess;
    }

    // Simpan user baru terlebih dahulu
    await newUser.save();

    // Jika terdapat outletId, maka tambahkan user ini ke outlet tersebut
    if (outletId && outletId.trim() !== "") {
      try {
        const outletDB = await Outlet.findById(outletId);
        if (outletDB) {
          // Pastikan user belum ada di kasirList outlet
          if (!outletDB.kasirList.includes(newUser._id)) {
            outletDB.kasirList.push(newUser._id);
            await outletDB.save();
          }
        } else {
          console.error(`Outlet dengan ID ${outletId} tidak ditemukan`);
        }
      } catch (error) {
        console.error("Error saat menambahkan user ke outlet:", error);
        // Jangan return error di sini, lanjutkan respons sukses untuk pembuatan user
      }
    }

    return res.json({
      message: "Telah berhasil inisialisasi user data",
      kodeKasir: kodeKasir,
      userId: newUser._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username atau email sudah digunakan",
        errors: error,
      });
    }
    return res.status(400).json({ message: error.message });
  }
});

router.put("/updateUser", async (req, res) => {
  const {
    _id,
    password,
    email,
    telepon,
    targetHargaPenjualan,
    targetQuantityPenjualan,
    roleName,
    blockedAccess,
    kodeKasir,
  } = req.body;

  // Validasi field wajib
  if (!_id) {
    return res.status(400).json({ message: "ID user diperlukan" });
  }
  if (!email) {
    return res.status(400).json({ message: "Email diperlukan" });
  }
  if (!roleName) {
    return res.status(400).json({ message: "Role name diperlukan" });
  }

  try {
    // Cari user berdasarkan ID
    const user = await UserRefrensi.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Validasi kodeKasir jika diubah
    if (kodeKasir && kodeKasir !== user.kodeKasir) {
      // Validasi format (harus 3 karakter)
      if (kodeKasir.length !== 3) {
        return res.status(400).json({ message: "Kode kasir harus 3 karakter" });
      }

      // Periksa apakah kodeKasir sudah digunakan oleh user lain
      const existingKasir = await UserRefrensi.findOne({
        kodeKasir,
        _id: { $ne: _id }, // Exclude current user
      });

      if (existingKasir) {
        return res.status(400).json({
          message: "Kode kasir sudah digunakan, silakan gunakan kode lain",
        });
      }

      // Update kodeKasir jika valid
      user.kodeKasir = kodeKasir;
    }

    // Update field wajib
    user.email = email;
    user.roleName = roleName;

    // Update field opsional
    if (password && password !== "") {
      const hashedPassword = bcrypt.hashSync(password, 10);
      user.password = hashedPassword;
    }
    if (telepon !== undefined) {
      user.telepon = telepon || ""; // Jika kosong, set ke string kosong
    }
    if (targetHargaPenjualan !== undefined) {
      user.targetHargaPenjualan = Number(targetHargaPenjualan) || 0;
    }
    if (targetQuantityPenjualan !== undefined) {
      user.targetQuantityPenjualan = Number(targetQuantityPenjualan) || 0;
    }

    if (blockedAccess && Array.isArray(blockedAccess)) {
      user.blockedAccess = blockedAccess;
    }

    // Simpan perubahan
    await user.save();
    return res.json({ message: "User berhasil diperbarui" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username atau email sudah digunakan",
        errors: error,
      });
    }
    return res.status(500).json({ message: error.message });
  }
});

router.get("/getUserInfo", async (req, res) => {
  try {
    if (req.userId) {
      const userDB = await UserRefrensi.findById(req.userId).select(
        "_id username blockedAccess roleName totalHargaPenjualan totalQuantityPenjualan targetHargaPenjualan targetQuantityPenjualan kodeKasir"
      );
      if (!userDB) {
        return res.status(404).json({ message: "akun tidak ditemukan" });
      }
      if (userDB?.isDisabled == true) {
        return res
          .status(403)
          .json({ message: "Akun anda telah dinonaktifkan" });
      } else {
        return res.json({ userInfo: userDB });
      }
    } else {
      return res.status(401).json({ message: "Tidak ditemukan data" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Tidak ditemukan data" });
  }
});

router.get("/getUserInfoComplete", async (req, res) => {
  try {
    const userDB = await UserRefrensi.findById(req.userId).select("-password");
    return res.json({ message: "sukses", data: userDB });
  } catch (error) {
    return res.status(400).json({ message: "gagal mendapatkan data" });
  }
});

router.get("/getAllAccount", authorize, async (req, res) => {
  try {
    const userDBs = await UserRefrensi.find().select(
      "-password -otp -otpExpiredAt"
    );
    return res.json({ message: "suzzess", data: userDBs });
  } catch (error) {
    return res.status(500).json({ message: JSON.stringify(error) });
  }
});

router.post("/loginMobile", authorize, async (req, res) => {
  const { username, password } = req.body;
  const userDB = await UserRefrensi.findOne({ username });
  if (!userDB) {
    return res.status(400).json({ message: "username atau password salah" });
  }
  const isPasswordMatch = bcrypt.compareSync(password, userDB.password);
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "username atau password salah" });
  }

  const sanitized = {
    _id: userDB._id,
    username: userDB.username,
  };
  const token = await generateTokenMobile(userDB._id);
  if (!token) {
    return res
      .status(400)
      .json({ message: "Terjadi kesalahan sementara, coba lagi" });
  }
  return res.json({ message: "sukses", data: { token, data: sanitized } });
});

router.get("/getUserById/:id", async (req, res) => {
  const { id } = req.params;
  const userDB = await UserRefrensi.findById(id).select(
    "username otp otpExpiredAt email telepon roleName kodeKasir"
  );
  if (!userDB) {
    return res.status(404).json({ message: "akun tidak ditemukan" });
  }
  return res.json({ message: "sukses", data: userDB });
});

//web
router.delete("/logout", async (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Berhasil logout" });
});

//mobile

export default router;
