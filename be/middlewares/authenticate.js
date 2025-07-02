import jwt from "jsonwebtoken";

export const noAuthOriginalUrl = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  /^\/api\/v1\/auth\/verify\/[a-zA-Z0-9]+$/, // Ini akan cocok dengan '/verify/token'
  "/api/v1/auth/loginMobile",
  "/api/v1/report",
  "/api/v1/ping",
  "/api/v1/document",
  "/api/v1/printer/printTest",
];
const authenticate = (req, res, next) => {
  const shouldSkip = noAuthOriginalUrl.some(pattern => {
    if (typeof pattern === 'string') {
      return pattern === req.originalUrl;
    } else if (pattern instanceof RegExp) {
      return pattern.test(req.originalUrl);
    }
    return false;
  });

  if (shouldSkip) {
    console.log("authentication skipped : ", req.originalUrl);
    req.skip = true
    return next();
  }
  const token =
    req?.cookies?.token || req.headers.authorization?.split(" ")[1] || null; // Web token
  const mobileToken = req.headers.mobile?.split(" ")[1] || null; // Mobile token


  // If neither token is provided, return Unauthorized
  if (!token && !mobileToken) {
    console.log("authentication failed : ", req.originalUrl);
    return res.status(401).json({ message: "No Authentication" });
  }

  try {
    let decoded;
    if (token) {
      // Verify web token
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId || req?.userId;
      req.user = decoded;
      console.log("authentication success : ", req.originalUrl);
      next();
    } else if (mobileToken) {
      // Verify mobile token
      decoded = jwt.verify(mobileToken, process.env.JWT_SECRET_MOBILE);
      req.user = decoded;
      req.userId = decoded.userId || req?.userId;
      console.log("authentication success : ", req.originalUrl);
      next();
    }
  } catch (error) {
    console.log("authentication failed : ", req.originalUrl);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authenticate;
