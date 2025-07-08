import jwt from 'jsonwebtoken';


const authAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again." });
    }

    const token = authHeader.split(' ')[1]; 
    
    
    

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoded token", token_decode);
    
    if (
      token_decode.email !== process.env.ADMIN_EMAIL
    ) {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again." });
    }

    next();

  } catch (error) {
    console.log(error);
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authAdmin;
