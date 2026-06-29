import express from "express";
import verifyUser from "../../middleware/verification.js";
import {
  findAllUsers,
  createSeller,
  UserLogin,
  userUpdateStatus,
  userUpdateRole,
  userProfileUpdate,
  getUserProfile,
} from "../controllers/usermanagement-controller.js";

import { Authorization } from "../../middleware/Authorization.js";
import upload from "../../Utils/multer.js";
const router = express.Router();
router.get("/all", verifyUser, Authorization, findAllUsers);
router.get("/profile/:email", verifyUser, getUserProfile);
router.put("/update/profile", verifyUser, userProfileUpdate);
router.put("/update/role", verifyUser, Authorization, userUpdateRole);
router.put("/update/status", verifyUser, Authorization, userUpdateStatus);
router.post("/user/signin", UserLogin);
router.post("/seller/signup", verifyUser, Authorization, createSeller);
//router.post("/superuser/signup", createmainUser);

export default router;
