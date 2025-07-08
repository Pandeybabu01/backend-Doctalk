import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, 
});


const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    // console.log("File is uploaded on Cloudinary ", response.url);



    return response;
  } catch (error) {
    // Log or handle the error appropriately
    console.error("Upload to Cloudinary failed:", error);

    return null;
  }
};

export {uploadOnCloudinary};
