// import jwt from 'jsonwebtoken';

// const authUser = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     // Check if token is provided in the Authorization header
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ success: false, message: 'Not authorized, token missing or incorrect format' });
//     }

//     // Extract the token from the Authorization header
//     const token = authHeader.split(' ')[1];

//     // Ensure token exists and is not empty
//     if (!token) {
//       return res.status(401).json({ success: false, message: 'Token is missing or empty' });
//     }

//     // Verify the token using the secret from the environment variables
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Attach the decoded payload (user data) to the request object
//     req.user = decoded;

//     // Proceed to the next middleware or route handler
//     next();

//   } catch (error) {
//     console.error('Error during token verification:', error.message);

//     // Specific error handling for expired token
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ success: false, message: 'Token has expired' });
//     }

//     // General invalid token error
//     return res.status(401).json({ success: false, message: 'Token is invalid' });
//   }
// };

// export default authUser;

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables from a .env file (if you're not already doing this)
dotenv.config();

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is missing or doesn't start with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token missing or incorrect format',
      });
    }

    // Extract token from the Authorization header
    const token = authHeader.split(' ')[1];

    // Validate token structure (should consist of 3 parts separated by '.')
    if (token.split('.').length !== 3) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure',
      });
    }

    // Ensure token exists and is not empty
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is missing or empty',
      });
    }

    // Ensure JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET environment variable is not set',
      });
    }

    // Verify the token using the secret from the environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload (user data) to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error during token verification:', error);

    // Specific error handling for expired token
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    // General invalid token error
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or not properly signed',
    });
  }
};

export default authUser;

