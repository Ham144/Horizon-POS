import UserRefrensi from "../models/User.model.js";
import { noAuthOriginalUrl } from "./authenticate.js";

const normalizeUrl = (url) =>
  url.split("?")[0].replace(/\/$/, "").toLowerCase();

const authorize = async (req, res, next) => {
  //pass without authorization
  if (noAuthOriginalUrl?.includes(req?.originalUrl)) {
    console.log("authorization skipped : ", req?.originalUrl);
    return next();
  }

  try {
    let userDB;
    if (req?.userId) {
      userDB = await UserRefrensi.findById(req?.userId);
    }
    if (!userDB) {
      return res.status(403).json({
        message: "Anda Tidak ditemukan di Database, coba login ulang",
      });
    }
    req.userDB = userDB;

    const normalizedRequestUrl = normalizeUrl(req.originalUrl);
    console.error(
      "endpoint array yang ditolak: ",
      userDB.blockedAccess.map(normalizeUrl)
    );
    console.warn("endpoint yang diperiksa: ", normalizedRequestUrl);

    // Check if any blocked path is a prefix of the current request URL
    const isBlocked = userDB.blockedAccess.some((blockedPath) =>
      normalizedRequestUrl.startsWith(normalizeUrl(blockedPath))
    );

    if (isBlocked) {
      console.error("authorized endpoint ditolak : ", req.originalUrl);
      return res
        .status(403)
        .json({ message: "Maaf, Anda tidak memiliki akses Fitur ini" });
    } else {
      console.log("authorized endpoint success : ", req.originalUrl);
      next();
    }
  } catch (error) {
    console.log("authorized endpoint failed : ", req.originalUrl);
    return res
      .status(500)
      .json({ message: "authorized endpoint failed ", error });
  }
};

export default authorize;
