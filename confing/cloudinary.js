import {v2 as cloudinary} from 'cloudinary';
import env from "dotenv";
env.config();

cloudinary.config({ 
  cloud_name: 'dtmpqjymw', 
  api_key: process.env.cloudinary_api, 
  api_secret: process.env.cloudinary_secret 
});

export default cloudinary