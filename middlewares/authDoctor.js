import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authDoctor = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing or incorrect format",
      });
    }

    const dtoken = authHeader.split(" ")[1];

    if (!dtoken || dtoken.split(".").length !== 3) {
      return res.status(401).json({
        success: false,
        message: "Invalid or malformed token",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET environment variable is not set",
      });
    }

    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Token payload does not contain doctor ID",
      });
    }

    req.docId =  decoded.id

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token is invalid or could not be verified",
      error: error.message,
    });
  }
};

export default authDoctor;
