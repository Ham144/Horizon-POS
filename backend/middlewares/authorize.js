import UserRefrensi from "../models/User.model.js";
import { noAuthOriginalUrl } from "./authenticate.js";

const normalizeUrl = (url) =>
  url.split("?")[0].replace(/\/$/, "").toLowerCase();

const authorize = async (req, res, next) => {
  try {
    if (req.skip) return next()
    let userDB;
    // req.userId harus sudah ada dari middleware 'authenticate' sebelumnya
    if (!req.userId) {
      // Ini seharusnya tidak terjadi jika authenticate berfungsi benar
      return res.status(403).json({ message: "Pengguna tidak terautentikasi." });
    }


    if (!userDB) {
      return res.status(403).json({
        message: "Pengguna tidak ditemukan di database, coba login ulang.",
      });
    }
    req.userDB = userDB; // Simpan objek user lengkap di req

    const normalizedRequestUrl = normalizeUrl(req.originalUrl);
    console.error(
      "Endpoint array yang ditolak: ",
      userDB.blockedAccess.map(normalizeUrl)
    );
    console.warn("Endpoint yang diperiksa: ", normalizedRequestUrl);

    // Check if any blocked path is a prefix of the current request URL
    const isBlocked = userDB.blockedAccess.some((blockedPath) =>
      normalizedRequestUrl.startsWith(normalizeUrl(blockedPath))
    );

    if (isBlocked) {
      console.error("Authorized endpoint ditolak: ", req.originalUrl);
      return res
        .status(403)
        .json({ message: "Maaf, Anda tidak memiliki akses fitur ini." });
    } else {
      console.log("Authorized endpoint success: ", req.originalUrl);
      next(); // Lanjutkan ke route handler
    }
  } catch (error) {
    console.error("Authorization failed for:", req.originalUrl, error);
    return res
      .status(500)
      .json({ message: "Autorisasi gagal karena kesalahan server.", error: error.message });
  }
};


export default authorize;
