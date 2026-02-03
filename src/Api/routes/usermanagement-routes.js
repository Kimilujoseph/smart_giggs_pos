import express from "express";
import verifyUser from "../../middleware/verification.js";
import {
  findAllUsers,
  createSeller,
  UserLogin,
  userUpdateStatus,
  userUpdateRole,
  userProfileUpdate,
  addprofilepicture,
  addIdImagefront,
  addIdImagebackward,
  getUserProfile,
} from "../controllers/usermanagement-controller.js";
import { Authorization } from "../../middleware/Authorization.js";
import upload from "../../Utils/multer.js";
const router = express.Router();
router.get("/all", verifyUser, findAllUsers);
router.get("/profile/:email", verifyUser, getUserProfile);
router.put("/update/profile", verifyUser, userProfileUpdate);
router.put("/update/role", verifyUser, userUpdateRole);
router.put("/update/status", verifyUser, userUpdateStatus);
router.put(
  "/update/identificationbackward",
  verifyUser,
  upload.array("images"),
  addIdImagebackward
);
router.put(
  "/update/identificationfront",
  verifyUser,
  upload.array("images"),
  addIdImagefront
);
router.put(
  "/update/profilepicture",
  verifyUser,
  upload.array("images"),
  addprofilepicture
);
router.post("/user/signin", UserLogin);
router.post("/seller/signup", verifyUser, Authorization, createSeller);
//router.post("/superuser/signup", createmainUser);

export default router;
