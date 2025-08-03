import { Router } from "express";
import { runManualEmailJob } from "../cronjobs/index.js";
import { verifyEmailConnection } from "../cronjobs/emailKwitansi.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const router = Router();

// Route untuk menjalankan job pengiriman email kwitansi secara manual
router.post("/run-email-kwitansi-job", async (req, res) => {
  try {
    console.log("Menjalankan job pengiriman email kwitansi secara manual");

    // Verifikasi koneksi email terlebih dahulu
    const isEmailConfigValid = await verifyEmailConnection();
    if (!isEmailConfigValid) {
      return res.status(500).json({
        success: false,
        message:
          "Konfigurasi email tidak valid. Periksa pengaturan SMTP di .env",
      });
    }

    // Jalankan job
    const result = await runManualEmailJob();

    if (result === false) {
      return res.status(500).json({
        success: false,
        message:
          "Gagal menjalankan job pengiriman email. Lihat log server untuk detail.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job pengiriman email kwitansi telah dijalankan secara manual",
    });
  } catch (error) {
    console.error("Error saat menjalankan job:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menjalankan job",
      error: error.message,
    });
  }
});

// Route untuk verifikasi koneksi email
router.get("/verify-email-connection", async (req, res) => {
  try {
    const isValid = await verifyEmailConnection();
    return res.status(200).json({
      success: isValid,
      message: isValid
        ? "Koneksi email berhasil terverifikasi"
        : "Koneksi email gagal terverifikasi. Periksa pengaturan SMTP di .env",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat verifikasi koneksi email",
      error: error.message,
    });
  }
});

// Route untuk testing koneksi email dengan parameter kustom
router.post("/test-email-connection", async (req, res) => {
  const { host, port, secure, user, pass, to } = req.body;

  if (!host || !port || !user || !pass || !to) {
    return res.status(400).json({
      success: false,
      message: "Semua parameter (host, port, user, pass, to) diperlukan",
    });
  }

  try {
    console.log("Menguji koneksi email dengan parameter kustom:");
    console.log({ host, port, secure, user, pass: "***" });

    // Buat transporter untuk testing
    const testTransporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: secure === true || secure === "true",
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
        ciphers: "SSLv3",
      },
      debug: true,
    });

    // Verifikasi koneksi
    const isConnected = await testTransporter.verify();

    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: "Gagal terhubung ke server SMTP",
      });
    }

    // Kirim email test
    const info = await testTransporter.sendMail({
      from: `"Test Email" <${user}>`,
      to,
      subject: "Test Email dari POS System",
      text: "Ini adalah email test untuk memverifikasi koneksi SMTP",
      html: "<h1>Test Email</h1><p>Jika Anda menerima email ini, berarti konfigurasi SMTP Anda berhasil!</p>",
    });

    return res.status(200).json({
      success: true,
      message: "Koneksi email berhasil dan email test telah dikirim",
      details: {
        messageId: info.messageId,
        previewURL: nodemailer.getTestMessageUrl(info),
      },
    });
  } catch (error) {
    console.error("Error saat testing koneksi email:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat testing koneksi email",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Route untuk testing koneksi Outlook365 (menggunakan kredensial dari .env)
router.post("/test-outlook-connection", async (req, res) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({
      success: false,
      message: "Parameter 'to' (alamat email tujuan) diperlukan",
    });
  }

  try {
    // Buat transporter untuk Outlook365
    const outlookTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: "SSLv3",
      },
      debug: true,
    });

    console.log("Verifikasi koneksi Outlook365...");
    console.log({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      user: process.env.EMAIL_USER,
    });

    // Verifikasi koneksi
    const isConnected = await outlookTransporter.verify();
    console.log("Hasil verifikasi:", isConnected);

    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: "Gagal terhubung ke server SMTP Outlook",
      });
    }

    // Kirim email test
    const info = await outlookTransporter.sendMail({
      from: `"Test CATUR POS" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Test Email dari CATUR POS",
      text: "Ini adalah email test menggunakan Outlook",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h1>Test Email CATUR POS</h1>
          <p>Jika Anda menerima email ini, berarti konfigurasi SMTP Outlook365 di server CATUR POS Anda berhasil!</p>
          <p>Detail konfigurasi:</p>
          <ul>
            <li>Host: ${process.env.EMAIL_HOST}</li>
            <li>Port: ${process.env.EMAIL_PORT}</li>
            <li>Service: ${process.env.EMAIL_SERVICE}</li>
            <li>User: ${process.env.EMAIL_USER}</li>
          </ul>
          <p style="color: #777; font-size: 12px; margin-top: 30px; text-align: center;">
            Email ini dikirim secara otomatis melalui sistem POS. ${new Date().toLocaleString(
              "id-ID"
            )}
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Koneksi Outlook berhasil dan email test telah dikirim",
      details: {
        messageId: info.messageId,
        to: to,
        from: process.env.EMAIL_USER,
      },
    });
  } catch (error) {
    console.error("Error saat testing koneksi Outlook:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat testing koneksi Outlook",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Route untuk menyimpan konfigurasi email ke file .env
router.post("/save-email-config", async (req, res) => {
  const { host, port, secure, service, user, pass } = req.body;

  if (!host || !port || !user || !pass) {
    return res.status(400).json({
      success: false,
      message: "Semua parameter (host, port, user, pass) diperlukan",
    });
  }

  try {
    // Baca file .env
    const envPath = path.resolve(process.cwd(), ".env");
    const envContent = fs.readFileSync(envPath, "utf-8");

    // Ambil semua variabel yang ada dari file .env
    const envConfig = dotenv.parse(envContent);

    // Update konfigurasi email
    envConfig.EMAIL_HOST = host;
    envConfig.EMAIL_PORT = port;
    envConfig.EMAIL_SECURE = secure ? "true" : "false";
    envConfig.EMAIL_USER = user;
    envConfig.EMAIL_PASS = pass;

    if (service) {
      envConfig.EMAIL_SERVICE = service;
    }

    // Format ulang file .env
    const newEnvContent = Object.entries(envConfig)
      .map(([key, val]) => `${key}="${val}"`)
      .join("\n");

    // Simpan perubahan ke file .env
    fs.writeFileSync(envPath, newEnvContent);

    // Perbarui variabel lingkungan yang sedang berjalan
    process.env.EMAIL_HOST = host;
    process.env.EMAIL_PORT = port;
    process.env.EMAIL_SECURE = secure ? "true" : "false";
    process.env.EMAIL_USER = user;
    process.env.EMAIL_PASS = pass;
    if (service) {
      process.env.EMAIL_SERVICE = service;
    }

    return res.status(200).json({
      success: true,
      message: "Konfigurasi email berhasil disimpan",
      config: {
        host,
        port,
        secure,
        service: service || undefined,
        user,
      },
    });
  } catch (error) {
    console.error("Error saat menyimpan konfigurasi email:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menyimpan konfigurasi email",
      error: error.message,
    });
  }
});

// Route untuk mendapatkan konfigurasi email saat ini (tanpa password)
router.get("/current-email-config", async (req, res) => {
  try {
    const config = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      service: process.env.EMAIL_SERVICE,
      user: process.env.EMAIL_USER,
    };

    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error saat mengambil konfigurasi email:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil konfigurasi email",
      error: error.message,
    });
  }
});

export default router;
