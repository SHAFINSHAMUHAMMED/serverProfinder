import bcrypt from "bcrypt";
import userModel from "../models/userSchema.js";
import proModel from "../models/professionalSchema.js";
import categoryModel from "../models/categorySchema.js";
import locationModel from "../models/locationSchema.js";
import { generateToken } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import env from "dotenv";
env.config();
import cloudinary from "../confing/cloudinary.js";
import fs from "fs";
import orderModel from "../models/orderSchema.js";

export const Loginpost = async (req, res) => {
  let userSignUp = {
    Status: false,
    message: null,
    token: null,
    name: null,
    id: null,
  };
  try {
    const user = req.body;
    let status = false;
    const finduser = await userModel.findOne({ email: user.email });
    if (finduser) {
      if (finduser.password) {
        const isMatch = await bcrypt.compare(user.password, finduser.password);
        if (isMatch) {
          if (finduser.isVerified) {
            if (!finduser.isBlocked) {
              const token = generateToken(finduser);
              userSignUp.message = "You are logged";
              userSignUp.Status = true;
              userSignUp.token = token;
              userSignUp.name = finduser.name;
              userSignUp.id = finduser._id;
              res.json({ userSignUp });
            } else {
              userSignUp.Status = false;
              userSignUp.message = "Your Account is Blocked";
              res.json({ userSignUp });
            }
          } else {
            userSignUp.Status = false;
            userSignUp.message = "Please verify Your Mail";
            res.json({ userSignUp });
          }
        } else {
          userSignUp.message = " Password is wrong";
          userSignUp.Status = false;
          res.json({ userSignUp });
        }
      } else {
        userSignUp.message = " Please Register";
        userSignUp.Status = false;
        res.json({ userSignUp });
      }
    } else {
      userSignUp.message = "your Email wrong";
      userSignUp.Status = false;
      res.json({ userSignUp });
    }
  } catch (error) {
    res.status(500).json({ status: "failed", message: error.message });
  }
};
export const RegisterPost = async (req, res) => {
  try {
    let userDetails = req.body;
    let email = userDetails.email.toLowerCase();
    const user = await userModel.findOne({ email: email });
    const user2 = await userModel.findOne({ phone: userDetails.phone });
    if (!user && !user2) {
      console.log("get in");
      userDetails.password = await bcrypt.hash(userDetails.password, 10);
      const createUser = await userModel.create({
        name: userDetails.name,
        email: userDetails.email.toLowerCase(),
        phone: userDetails.phone,
        password: userDetails.password,
      });
      const emailResult = await sendVerifyMail(
        createUser.name,
        createUser.email,
        createUser._id
      );
      if (emailResult.result) {
        res.json({
          status: true,
          message: "Registration Success Please Verify Your Mail",
        });
      } else {
        await userModel.deleteOne({ email: createUser.email }); //for delete non send verification user details from db
        res.json({ status: false, message: "Email Not Send" });
      }
    } else {
      if (user.googleLogin && !user2) {
        let email = userDetails.email.toLowerCase();
        userDetails.password = await bcrypt.hash(userDetails.password, 10);
        await userModel.updateOne(
          { email: email },
          {
            $set: {
              name: userDetails.name,
              phone: userDetails.phone,
              password: userDetails.password,

            },
          }
        );
        res.json({
          status: true,
          message: "Registration Success",
        });
      } else {
        return res.json({ status: false, message: "User Already Exist" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendVerifyMail = async (username, email, user_id) => {
  try {
    const userUrl = process.env.UserUrl;
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "codershafinsha@gmail.com",
        pass: process.env.EMAILPASS,
      },
    });

    const mailOption = {
      from: "codershafinsha@gmail.com",
      to: email,
      subject: "Email verification",
      html: `<p>Hii ${username}, please click <a href="${userUrl}/VerifyMail/${user_id}">here</a> to verify your email.</p>`,
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOption, (error, info) => {
        if (error) {
          console.log(error.message);
          console.log("Email could not be sent");
          reject({ result: false });
        } else {
          resolve({ result: true });
        }
      });
    });
  } catch (error) {
    console.log(error);
    console.log("Error occurred while sending email");
    throw error;
  }
};

export const verifyMails = async (req, res) => {
  try {
    const { id } = req.body;
    const check = await userModel.findOne({ _id: id });
    if (check) {
      if (check.isVerified === false) {
        await userModel.updateOne({ _id: id }, { $set: { isVerified: true, joinedOn: new Date() } });
        res.json({ Verification: true, message: "Verification successful" });
      } else {
        res.json({ Verification: false, message: "Already Verified" });
      }
    } else {
      console.log("no user");
      res.json({ Verification: false, message: "No User Found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ Verification: false, message: "An error occurred" });
  }
};

export const googleLogin = async (req, res) => {
  let userSignUp = {
    Status: false,
    message: null,
    token: null,
    name: null,
    id: null,
  };
  const userData = req.body.payload;

  const user = await userModel.findOne({ email: userData.email });
  if (user) {
    if (!user.isBlocked) {
      if (!user.googleLogin) {
        await userModel.updateOne(
          { email: userData.email },
          {
            $set: {
              googleLogin: true,
              isVerified: true,
              joinedOn: new Date(),
            },
          }
        );
      }
      const token = generateToken(user);
      userSignUp.message = "You are logged";
      userSignUp.Status = true;
      userSignUp.token = token;
      userSignUp.name = user.name;
      userSignUp.id = user._id;
      res.json({ userSignUp });
    } else {
      userSignUp.Status = false;
      userSignUp.message = "Your Account is Blocked";
      res.json({ userSignUp });
    }
  } else {
    const create = await userModel.create({
      name: userData.name,
      email: userData.email,
      isVerified: true,
      googleLogin: true,
    });
    const token = generateToken(create);
    userSignUp.message = "You are logged";
    userSignUp.Status = true;
    userSignUp.token = token;
    userSignUp.name = create.name;
    userSignUp.id = create._id;
    res.json({ userSignUp });
  }
};

export const findByPhone = async (req, res) => {
  try {
    const phone = req.body.phone;
    const userPhone = await userModel.findOne({ phone: phone });
    if (userPhone) {
      const token = generateToken(userPhone);
      res.json({
        status: true,
        message: "User Found",
        token: token,
        name: userPhone.name,
      });
    } else {
      res
        .status(200)
        .json({ status: false, message: "User Not Found Please Register" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "An error occurred" });
  }
};

export const getDetails = async (req, res) => {
  try {
    const pro = await proModel
  .find({ status: 'Active' })
  .populate('location')
  .populate('category');

    const category = await categoryModel.find();
    res.json({ status: true, pro: pro, category: category });
  } catch (error) {
    res.status(500).json({ status: false });
  }
};

export const getCategory = async (req, res) => {
  try {
    const category = await categoryModel.find();
    res.json({ status: true, category: category });
  } catch (error) {
    res.status(500).json({ status: false });
  }
};

export const getLocation = async (req, res) => {
  try {
    const location = await locationModel.find({});
    if (location) {
      res.json({ status: true, location });
    } else {
      res.json({ staus: false });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const userDetails = async (req, res) => {
  const userId = req.query.userId;
  try {
    const userData = await userModel.findById({ _id: userId });
    if (userData) {
      res.json({ status: true, data: userData });
    }
  } catch (error) {
    res.status(500).json({ status: false });
  }
};

export const userEdit = async (req, res) => {
  const data = req.body;
  const id = req.body.id;
  const file = req.file;
  let img;
  try {
    const user = await userModel.findOne({phone:data.phone})
    if(user._id!=id){
      res.status(200).json({staus:false,message:'Phone Number Already Exist'})
    }else{
      if (file) {
        const upload = await cloudinary.uploader.upload(file?.path);
        img = upload.secure_url;
        fs.unlinkSync(file.path);
      }
      const update = await userModel.updateOne(
        { _id: data.id },
        { $set: { name: data.name, phone: data.phone, image: img } }
      );
      res.json({ status: "success", image: img });
    }

  } catch (error) {
    console.log(error.message, "immaaa");
    res.status(500).json({ status: "failed", message: error.message });
  }
};
//password forget 
export const forgotpassword = async (req,res)=>{
  const mail = req.body.Email
  const otp = req.body.otp
  const user = await userModel.findOne({email:mail})
    if(user){
      const userName = user.name
        try {
          const userUrl = process.env.UserUrl;
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: "codershafinsha@gmail.com",
              pass: process.env.EMAILPASS,
            },
          });
      
          const mailOption = {
            from: "codershafinsha@gmail.com",
            to: mail,
            subject: "Reset Password",
            html: `<p>Hii ${userName}, ${otp} is Your OTP for Reset Password .</p>`,
          };
      
          return new Promise((resolve, reject) => {
            transporter.sendMail(mailOption, (error, info) => {
              if (error) {
                console.log(error.message);
                res.status(500).json({ status: false, message:'Error sending mail' });
              } else {
                res.json({ status: true });
              }
            });
          });
        } catch (error) {
          console.log(error);
          res.status(500).json({ status:false, message: 'Error try later' });
          throw error;
        }
      }else{
        res.status(404).json({ status:false, message: "User not found" });
      }
}

export const changepassword = async (req,res) => {
  const pass = req.body.newPass
  const email = req.body.email
  try {
    const user = await userModel.findOne({email:email})
    if (!user) {
      return res.status(400).json({ status: false, message: 'User not found' });
    }
    if(user.password){
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch){
        res.status(400).json({status:false,message:'Choose a New Password'})
      }else{
        const password = await bcrypt.hash(pass,10);
        const update = await userModel.updateOne({email:email},
          {$set:{password:password}})
          res.status(200).json({status:true,message:'Password Updated'})
      }
    }else{
      const password = await bcrypt.hash(pass,10);
      const update = await userModel.updateOne({email:email},
        {$set:{password:password}})
        res.status(200).json({status:true,message:'Password Updated'})
    }
    
  } catch (error){
    res.status(500).json({message:'Error Occured'})
  }
}