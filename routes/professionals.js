import express from "express";
import {
  RegisterPost,
  verifyMails,
  LoginPost,
  findByPhone,
  googleLogin,
  findCat,
  proDetails,
  proEdit,
  getGallery,
  galleryUpload,
  deleteImage,
  changeAvailability
} from "../controller/professionalsControllers.js";
import {
  cancellJob,
  acceptJob,
  workCompleted,
  transactions,
  withdrawReq
} from "../controller/orderControllers.js";
import {
  loadChat,
  listChat,
} from "../controller/chatController.js"
import { verifyProToken } from "../middleware/auth.js";
import  creatmullter from "../confing/multer.js";
const upload = creatmullter();

const router = express.Router();
router.post("/registerPro", RegisterPost);
router.post("/verifyMail", verifyMails);
router.post("/login", LoginPost);
router.post("/proPhone", findByPhone);
router.post("/loginGoogle", googleLogin);
router.get("/listCat", findCat);
router.post("/proEdit", upload.single('file'), verifyProToken, proEdit);
router.get("/proDetails",verifyProToken,proDetails)
router.post("/cancellJob", verifyProToken, cancellJob);
router.post("/acceptJob", verifyProToken,acceptJob)
router.patch("/workCompleted",verifyProToken,workCompleted)
router.get("/loadChat",verifyProToken,loadChat)
router.get("/listChat",verifyProToken,listChat)
router.get("/transactions", verifyProToken,transactions)
router.post("/withdrawReq",verifyProToken,withdrawReq)
router.get("/getGallery",verifyProToken,getGallery)
router.post("/galleryUpload",upload.array('file'),verifyProToken,galleryUpload)
router.patch("/deleteImage", verifyProToken,deleteImage)
router.patch("/changeAvailability",verifyProToken,changeAvailability)


export default router;
