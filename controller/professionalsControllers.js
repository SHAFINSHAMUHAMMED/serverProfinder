import bcrypt from "bcrypt";
import proModel from "../models/professionalSchema.js";
import categoryModel from "../models/categorySchema.js";
import orderModel from "../models/orderSchema.js";
import locationModel from "../models/locationSchema.js";
import { generateProToken } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import env from "dotenv";
env.config();
import cloudinary from "../confing/cloudinary.js";
import fs from "fs";

export const RegisterPost = async (req, res) => {
  try {
    let proDetails = req.body;
    let email = proDetails.email.toLowerCase();
    const pro = await proModel.findOne({ email: email });
    const proPhone = await proModel.findOne({ phone: proDetails.phone });
    const location = await locationModel.findOne({
      location: proDetails.location,
    });
    console.log(location);
    let userLocation;
    if (location) {
      userLocation = location;
    } else {
      userLocation = await locationModel.create({
        location: proDetails.location,
      });
    }
    if (!pro && !proPhone) {
      console.log("get in");
      proDetails.password = await bcrypt.hash(proDetails.password, 10);
      const createpro = await proModel.create({
        name: proDetails.name,
        email: proDetails.email.toLowerCase(),
        phone: proDetails.phone,
        category: proDetails.category,
        location: userLocation._id,
        charge: {
          partime: proDetails.partTime,
          fulltime: proDetails.fullTime,
        },
        password: proDetails.password,
      });
      const emailResult = await sendVerifyMail(
        createpro.name,
        createpro.email,
        createpro._id
      );
      if (emailResult.result) {
        res.json({
          status: true,
          message: "Registration Success Please Verify Your Mail",
        });
      } else {
        console.log('Email Not Send"');
        res.json({ status: false, message: "Email Not Send" });
      }
    } else {
      if (!pro) {
        return res.json({
          status: false,
          message: "Mobile Number Already Exist",
        });
      } else if (pro.googleLogin && !proPhone) {
        let email = proDetails.email.toLowerCase();
        proDetails.password = await bcrypt.hash(proDetails.password, 10);
        await proModel.updateOne(
          { email: email },
          {
            $set: {
              name: proDetails.name,
              phone: proDetails.phone,
              password: proDetails.password,
            },
          }
        );
        res.json({
          status: true,
          message: "Registration Success",
        });
      } else {
        return res.json({
          status: false,
          message: "Email Already Exist",
        });
      }
    }
  } catch (error) {
    console.log(error, "hhhhhhhhhhh");
    res.status(500).json({ message: error.message });
  }
};

export const sendVerifyMail = async (proname, email, pro_id) => {
  try {
    const proUrl = process.env.ProUrl;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "codershafinsha@gmail.com",
        pass: process.env.EMAILPASS,
      },
    });
    console.log(process.env.EMAILPASS);
    const mailOption = {
      from: "codershafinsha@gmail.com",
      to: email,
      subject: "Email verification",
      html: `<p>Hii ${proname}, please click <a href="${proUrl}/VerifyMail/${pro_id}">here</a> to verify your email.</p>`,
    };

    const deleteData = async () => {
      const res = await proModel.deleteOne({ email });
      console.log(res);
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOption, (error, info) => {
        if (error) {
          console.log(error.message);
          console.log("Email could not be sent");
          deleteData();
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
    console.log(id, 11111111111111);
    const check = await proModel.findOne({ _id: id });
    if (check) {
      if (check.isVerified === false) {
        await proModel.updateOne({ _id: id }, { $set: { isVerified: true } });
        res.json({ Verification: true, message: "Verification successful" });
      } else {
        res.json({ Verification: false, message: "Already Verified" });
      }
    } else {
      console.log("no pro");
      res.json({ Verification: false, message: "No pro Found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ Verification: false, message: "An error occurred" });
  }
};

export const LoginPost = async (req, res) => {
  let proSignUp = {
    Status: false,
    message: null,
    token: null,
    name: null,
    id: null,
  };
  try {
    const pro = req.body;
    const findpro = await proModel.findOne({ email: pro.email });
    if (findpro) {
      const isMatch = await bcrypt.compare(pro.password, findpro.password);
      if (isMatch) {
        if (findpro.isVerified) {
          const token = generateProToken(findpro);
          proSignUp.message = "You are logged";
          proSignUp.Status = true;
          proSignUp.token = token;
          proSignUp.name = findpro.name;
          proSignUp.id = findpro._id;
          res.json({ proSignUp });
        } else {
          proSignUp.Status = false;
          proSignUp.message = "Please verify Your Mail";
          res.json({ proSignUp });
        }
      } else {
        proSignUp.message = " Password is wrong";
        proSignUp.Status = false;
        res.json({ proSignUp });
      }
    } else {
      proSignUp.message = "your Email wrong";
      proSignUp.Status = false;
      res.json({ proSignUp });
    }
  } catch (error) {
    res.json({ status: "failed", message: error.message });
  }
};

export const findByPhone = async (req, res) => {
  try {
    const phone = req.body.phone;
    const proPhone = await proModel.findOne({ phone: phone });
    if (proPhone) {
      const token = generateProToken(proPhone);
      res.json({
        status: true,
        message: "User Found",
        token: token,
        name: proPhone.name,
      });
    } else {
      res.json({ status: false, message: "Number Not Found Please Register" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "An error occurred" });
  }
};

export const googleLogin = async (req, res) => {
  let proSignUp = {
    Status: false,
    message: null,
    token: null,
    name: null,
    id: null,
  };
  const proData = req.body.payload;
  const pro = await proModel.findOne({ email: proData.email });
  if (pro) {
    console.log(pro);
    if (!pro.googleLogin) {
      await proModel.updateOne(
        { email: proData.email },
        {
          $set: {
            googleLogin: true,
            isVerified: true,
          },
        }
      );
    }
    const token = generateProToken(pro);
    proSignUp.message = "You are logged";
    proSignUp.Status = true;
    proSignUp.token = token;
    proSignUp.name = pro.name;
    proSignUp.id = pro._id;
    res.json({ proSignUp });
  } else {
    const create = await proModel.create({
      name: proData.name,
      email: proData.email,
      isVerified: true,
      googleLogin: true,
    });
    const token = generateProToken(create);
    proSignUp.message = "You are logged";
    proSignUp.Status = true;
    proSignUp.token = token;
    proSignUp.name = create.name;
    proSignUp.id = create._id;
    res.json({ proSignUp });
  }
};

export const findCat = async (req, res) => {
  try {
    const category = await categoryModel.find();
    if (category) {
      res.json({ status: true, category: category });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

/////////EditProfile//////////
export const proEdit = async (req, res) => {
  const data = req.body;
  const id = req.body.id;
  const file = req.file;
  let img;
  console.log(req.body);
  try {
    const pro = await proModel.findOne({phone:data.phone})
    if(pro._id!=id){
      res.status(200).json({staus:false,message:'Phone Number Already Exist'})
    }else{
      if (file) {
        const upload = await cloudinary.uploader.upload(file?.path);
        img = upload.secure_url;
        fs.unlinkSync(file.path);
      }
      const update = await proModel.updateOne(
        { _id: data.id },
        {
          $set: {
            name: data.name,
            phone: data.phone,
            image: img,
            charge: { partime: data.partTime, fulltime: data.fullTime },
            description: data.description,
          },
          $addToSet: {
            skills: {
              $each: data.skills && data.skills.length > 0
                ? data.skills.filter(skill => !pro.skills.includes(skill))
                : [],
            },
          },
        }
      );
      res.json({ status: "success", image: img });
    }

  } catch (error) {
    console.log(error.message, "immaaa");
    res.status(500).json({ status: "failed", message: error.message });
  }
};

export const proDetails = async (req, res) => {
  const proId = req.query.proId;
  try {
    const proData = await proModel
      .findById({ _id: proId })
      .populate("category")
      .populate("location");
    if (proData) {
      const bookings = await orderModel
        .find({ proId: proId })
        .populate("userID")
        .populate("proId");
      res.json({ status: true, data: proData, bookings: bookings });
    }
  } catch (error) {
    res.status(500).json({ status: false });
  }
};
