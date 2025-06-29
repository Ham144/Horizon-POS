import { Router } from "express";
import generateTokenJWT from "../utils/generateTokenJWT.js";
import generateTokenMobile from "../utils/generateTokenMobile.js";
import UserRefrensi from "../models/User.model.js";
import Outlet from "../models/Outlet.model.js";
import bcrypt from "bcryptjs";
import authorize from "../middlewares/authorize.js";
import generateUniqueKodeKasir from "../utils/generateUniqueKodeKasir.js"
import Organization from "../models/Organization.model.js";
import sendEmailService from "../services/SendEmail.service.js";
import crypto from "crypto"

const router = Router();

//register new USER (ini fitur baru buat SAAS doang, di CSI ga ada)
router.post("/register", async (req, res) => {
  const { username, password, email, telepon, organizationName, coutryCode } = req.body;

  if (!organizationName) {
    return res.status(400).json({ message: "nama organisasi diperlukan" })
  }
  if (!username) {
    return res.status(400).json({ message: "username diperlukan" });
  }
  if (!password) {
    return res.status(400).json({ message: "password diperlukan" });
  }
  if (!telepon) {
    return res.status(400).json({ message: "nomor telepon diperlukan" })
  }
  //justify nomor telepon
  if (telepon.toString().startsWith("+")) {
    return res.status(400).json({ message: "format nomor telepon salah, tidak perlu country code" })
  }

  try {
    const userDB = await UserRefrensi.findOne({ username });
    if (userDB) {
      return res.status(400).json({ message: "Anda sudah memiliki account, coba login langsung" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const userNew = new UserRefrensi()
    userNew.username = username
    userNew.password = hashedPassword
    userNew.email = email

    userNew.telepon = coutryCode || "+62" + telepon
    userNew.roleName = "owner"
    userNew.blockedAccess = []

    const duplicateOrganization = await Organization.findOne({
      name: organizationName
    })

    if (duplicateOrganization) {
      return res.status(400).json({ message: "Nama Orgaisasi telah ada, mohon buat yang berbeda" })
    }

    const organizationNew = new Organization()
    organizationNew.name = organtizationName
    organizationNew.subscriptionPlan = "trial"
    organizationNew.subscriptionExpiredAt = new Date().getDate() + process.env.EXPIRES_TOKEN_DAY
    organizationNew.owner = userNew.username

    await userNew.save()
    await organizationNew.save()

    const generatedCrypto = crypto.randomBytes(101)
    const subject = "Selamat Siang Bapak/Ibu. Berikut adalah tombol KONFIRMASI pendaftaran akun HORIZON POS";

    //masukkan ke user
    userNew.registerCrypto = generatedCrypto
    userNew.registerCrytoExpiresIn = new Date(new Date().getHours() + 24);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #7F00FF; /* Warna dasar ungu tua */
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            padding: 30px;
            text-align: center;
            color: #333333;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 20px;
            font-size: 16px;
        }
        .button-container {
            padding: 0 30px 30px 30px;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #7F00FF; /* Warna tombol ungu tua */
            color: #ffffff;
            padding: 15px 30px;
            border-radius: 5px;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #6a00d8; /* Sedikit lebih gelap saat hover */
        }
        .footer {
            background-color: #eeeeee;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777777;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>HORIZON POS</h1>
            <p>Konfirmasi Pendaftaran Akun</p>
        </div>
        <div class="content">
            <p>Selamat Siang Bapak/Ibu,</p>
            <p>Kami menerima permintaan pembuatan akun di layanan Horizon POS. Jika benar Anda yang melakukan permintaan ini, silakan klik tombol di bawah untuk mengonfirmasi email Anda dan mengaktifkan akun.</p>
            <p>Jika Anda tidak pernah mencoba mendaftar, mohon abaikan email ini. link akan mati dalam waktu 24 jam dan email anda akan dihapus dari sistem kami</p>
        </div>
        <div class="button-container">
            <a href="${process.env.FRONTEND_BASE}/verify/${generatedCrypto}" target="_blank" class="button">Konfirmasi Pendaftaran</a>
        </div>

        <div class="footer">
            <p>&copy; 2025 Horizon POS. Semua hak cipta dilindungi.</p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
        </div>
    </div>
</body>
</html>
`;

    await sendEmailService({ toEmail: email, htmlContent, subject });

    return res.json({ message: "berhasil mengirim konfirmasi pendaftaran ke email anda, konfirmasi email anda" })

  } catch (error) {
    return res.status(500).json({ message: JSON.stringify(error) });
  }
});

router.get("/verify/:registerCrypto", async (req, res) => {
  const { registerCrypto } = req.params
  if (!registerCrypto) return res.status(500).json({ message: "gagal, tidak ada data terkirim" })
  else {
    try {
      const userDB = await UserRefrensi.findOne({
        registerCrypto
      })
      if (!userDB) return res.status(404).json({ message: "tampaknya link telah kadaluarsa atau rusak" })
      if (new Date() > new Date(userDB.registerCrytoExpiresIn)) {
        return res.status(400).json({ message: 'tampaknya link telah kadaluarsa, coba meminta link baru' })
      }
      userDB.isEmailVerified = true
      await userDB.save()

      return res.json({ message: "Berhasil mengkonfirmasi email anda, cobalah untuk login" })
    } catch (error) {
      return res.status(500).json({ message: "internal server error", error })
    }
  }
})

//login diganti pakai magic link aja ya  
router.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    const userDB = await UserRefrensi.findOne({ email });
    if (userDB.emailVerified) {
      return res.status(400).json({ message: "email mendaftar belum terkonfirmasi. konfirmasi terlebih dahulu, lihat inbox" })
    }
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

    // Set cookie di sini
    res.cookie("token", token, {
      httpOnly: true, // agar tidak bisa diakses dari client-side JS
      secure: process.env.NODE_ENV,
      sameSite: "lax",
      maxAge: process.env.EXPIRES_TOKEN_DAY * 24 * 60 * 60 * 1000, // 7 hari
    });

    return res.json({
      message: "Selamat datang kembali",
      data: sanitizedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: JSON.stringify(error) });
  }
});


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
        organizationId: req.user.organizationId
      });
      if (existingKasir) {
        return res.status(400).json({
          message: "Kode kasir sudah digunakan di organization anda, silakan gunakan kode lain",
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
    newUser.oorganizationId = req.user.organizationId

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
