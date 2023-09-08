import express from "express";

import {
  Loginpost,
  RegisterPost,
  verifyMails,
  googleLogin,
  findByPhone,
  getDetails,
  getCategory,
  getLocation,
  userDetails,
  userEdit,
  forgotpassword,
  changepassword
} from "../controller/userControllers.js";

import {
  getBookings,
  razorpay,
  verifyrzpay,
  cancellJob,
  addReview,
  transactions,
  withdrawReq
} from "../controller/orderControllers.js";

import {
  loadChat,
  listChat
} from "../controller/chatController.js"

import { verifyToken } from "../middleware/auth.js";
import  creatmullter from "../confing/multer.js";
const upload = creatmullter();
const router = express.Router();

router.post("/login", Loginpost);
router.post("/register", RegisterPost);
router.post("/verifyMail", verifyMails);
router.post("/loginGoogle", googleLogin);
router.post("/userPhone", findByPhone);
router.get("/getPros", verifyToken, getDetails);
router.get("/getCategory", getCategory);
router.get("/getLocation", getLocation);
router.get("/getBookings", verifyToken, getBookings);
router.get("/userDetails", verifyToken, userDetails);
router.post("/userEdit", upload.single('file'), verifyToken, userEdit);
router.post("/razorpay", verifyToken, razorpay);
router.post("/verifyRazorpay", verifyrzpay);
router.post("/cancellJob", verifyToken, cancellJob);
router.post("/forgotpassword",forgotpassword)
router.patch("/changepassword",changepassword)
router.patch("/addReview",verifyToken, addReview)
router.get("/loadChat",verifyToken,loadChat)
router.get("/listChat",verifyToken,listChat)
router.get("/transactions", verifyToken,transactions)
router.post("/withdrawReq",verifyToken,withdrawReq)


export default router;
