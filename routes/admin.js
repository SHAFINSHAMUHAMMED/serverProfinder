import express from "express";
import {
  adminLogin,
  findPros,
  blockpro,
  findUser,
  blockuser,
  category,
  addCategory,
  editCategory,
  deleteCategory,
  getPayOutReq,
  upateTransReq,
  getDetails,
  getTransactions,
  kycRequests,
  kycVerify,
  rejectkyc
} from "../controller/admin.js";
import { verifyAdminToken } from "../middleware/auth.js";

const router = express.Router();
router.post("/login", adminLogin);
router.get("/findPros", verifyAdminToken, findPros);
router.get("/findUser", verifyAdminToken, findUser);
router.post("/blockuser", verifyAdminToken, blockuser);
router.post("/blockpro", verifyAdminToken, blockpro);
router.get("/listTypes", verifyAdminToken, category);
router.post("/listTypes", verifyAdminToken, addCategory);
router.patch("/editType", verifyAdminToken, editCategory);
router.delete("/deleteType", verifyAdminToken, deleteCategory);
router.get("/getRequests",verifyAdminToken,getPayOutReq)
router.patch("/upateTransReq",verifyAdminToken,upateTransReq)
router.get("/getDetails",verifyAdminToken,getDetails)
router.get("/getTransactions",verifyAdminToken,getTransactions)
router.get("/kycRequests",verifyAdminToken,kycRequests)
router.patch("/kycVerify",verifyAdminToken,kycVerify)
router.patch("/rejectkyc",verifyAdminToken,rejectkyc)

export default router;
