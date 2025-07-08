import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary} from 'cloudinary' 
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
//import razorpay from 'razorpay'
import fakeRazorpayInstance from '../controllers/fakeRazorpay.js'

import Razorpay from 'razorpay';


// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !password || !email) {
      return res.json({ success: false, message: "Messing Details" });
    }

    // validing email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "enter a valid email" });
    }

    // validing storng password
    if (password.length < 8) {
      return res.json({ success: false, message: "enter a strong password" });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashesPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashesPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const { id: userId } = req.user; // get from middleware

    const userData = await userModel.findById(userId).select("-password");
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
    try {
      const { userId, name, phone, address, dob, gender } = req.body;
      const imageFile = req.file;
  
      // Validate required fields
      if (!userId || !name || !phone || !dob || !gender) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }
  
      let parsedAddress = {};
  
      try {
        parsedAddress = address ? JSON.parse(address) : {};
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid address format" });
      }
  
      // Update user basic info
      await userModel.findByIdAndUpdate(userId, {
        name,
        phone,
        address: parsedAddress,
        dob,
        gender,
      });
  
      // Handle image upload if provided
      if (imageFile) {
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
        const imageURL = imageUpload.secure_url;
  
        await userModel.findByIdAndUpdate(userId, { image: imageURL });
      }
  
      res.json({ success: true, message: "Profile Updated" });
  
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  

  //API to book appointment
  const bookAppointment = async (req,res) => {

    try {

      const {userId, docId, slotDate, slotTime} = req.body

      const docData = await doctorModel.findById(docId).select('-password')

      if (!docData.available) {
        return res.json({success:false,message:'Doctor not available'})

      }

      let slots_booked = docData.slots_booked

      //Checking for slot availability
      if (slots_booked[slotDate]) {
        if (slots_booked[slotDate].includes(slotTime)) {
          return res.json({success:false,message:'Slot not available'})
        }else{
          slots_booked[slotDate].push(slotTime)
        }
      }else{
        slots_booked[slotDate] = []
        slots_booked[slotDate].push(slotTime)
      }

      const userData = await userModel.findById(userId).select('-password')

      delete docData.slots_booked

      const appointmentData = {
        userId,
        docId,
        userData,
        docData,
        amount:docData.fees,
        slotTime,
        slotDate,
        date: Date.now(),
      }

      const newAppointment = new appointmentModel(appointmentData)
      await newAppointment.save()


      // save new slots data in doctor
      await doctorModel.findByIdAndUpdate(docId,{slots_booked})

      res.json({success:true,message:'Appointment Booked'})

      
    } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message})
      
    }
  }

  
  // API to get user appointments for frontend my-appointments page
 
  const listAppointment = async (req, res) => {
  try {
    const userId = req.body?.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is missing' });
    }

    const appointments = await appointmentModel.find({ userId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cencelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    if (!userId || !appointmentId) {
      return res.status(400).json({ success: false, message: "userId and appointmentId are required" });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (!appointmentData.userId) {
      return res.status(403).json({ success: false, message: "Appointment user ID is missing or corrupted" });
    }

    // Compare ObjectId to string safely
    if (appointmentData.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized action" });
    }

    // Cancel the appointment
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // Release doctor's slot
    const { docId, slotDate, slotTime } = appointmentData;

    const doctorData = await doctorModel.findById(docId);
    if (!doctorData) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const slots_booked = doctorData.slots_booked || {};

    if (Array.isArray(slots_booked[slotDate])) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(time => time !== slotTime);
    }

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    return res.json({ success: true, message: "Appointment cancelled" });

  } catch (error) {
    console.error("Cancel appointment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



// Create an instance of Razorpay with your credentials
// ✅ Conditional Razorpay Instance Setup
let razorpayInstance;
if (process.env.USE_FAKE_RAZORPAY === "true") {
  razorpayInstance = fakeRazorpayInstance;
  console.log("🧪 Using Fake Razorpay");
} else {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("🔐 Using Real Razorpay");
}


// const razorpayInstance = new razorpay({
//   key_id:process.env.RAZORPAY_KEY_ID,
//   key_secret:process.env.RAZORPAY_KEY_SECRET
// })

// API to make payment of appointment using razorpay
//not working do ont using currect API Key and secrect key
// const paymentRazorpay = async (req, res) => {
//   try {
//     const { appointmentId } = req.body;
//     console.log("Received appointmentId:", appointmentId);

//     const appointmentData = await appointmentModel.findById(appointmentId);
//     console.log("Fetched appointmentData:", appointmentData);

//     if (!appointmentData || appointmentData.cancelled) {
//       return res.json({ success: false, message: "Appointment Cancelled or not found" });
//     }

//     const options = {
//       amount: appointmentData.amount * 100,
//       currency: process.env.CURRENCY || "INR",
//       receipt: appointmentId
//     };

//     console.log("Razorpay options:", options);

//     const order = await razorpayInstance.orders.create(options);
//     console.log("Created Razorpay order:", order);

//     res.json({ success: true, order });

//   } catch (error) {
//     console.error("paymentRazorpay error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };




// // API verify payment
// const verifyRazorpay = async (req, res) => {
//   try {

//     const {razorpay_order_id} = req.body
//     const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

//     //console.log(orderInfo)
//     if (orderInfo.status === 'paid') {
//       await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
//       res.json({success:true,message:"Payment Successfull"})
//     }else{
//        res.json({success:false,message:"Payment Failed"})
//     }
//   } catch (error) {
//     console.error("Cancel appointment error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// }




// API to create payment order
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    console.log("Received appointmentId:", appointmentId);

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: "Appointment Cancelled or not found" });
    }

    const options = {
      amount: appointmentData.amount * 100, // Convert amount to paise
      currency: "INR", // Currency
      receipt: appointmentId.toString(),
      payment_capture: 1,
      // Use the appointment ID as the receipt ID
    };

    const order = await razorpayInstance.orders.create(options);
    console.log("Created Razorpay order:", order);

    res.json({ success: true, order });
  } catch (error) {
    console.error("paymentRazorpay error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to verify Razorpay payment
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    // Verify the payment signature
    const isSignatureValid = razorpayInstance.utility.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      return res.json({ success: false, message: "Invalid payment signature" });
    }

    if (orderInfo.status === "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
      return res.json({ success: true, message: "Payment Successful" });
    } else {
      return res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.error("verifyRazorpay error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




  

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cencelAppointment, paymentRazorpay, verifyRazorpay, fakeRazorpayInstance };

