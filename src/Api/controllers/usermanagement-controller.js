import { userinputvalidation } from "../../Utils/joivalidation.js";
import { userManagmentService } from "../../services/usermanagement-controller-services.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";
import uploads from "../../Utils/cloudinary.js";
import fs from "fs";
let usermanagement = new userManagmentService();

//gettting to the landing page
const createSeller = async (req, res, next) => {
  try {
    const newUser = await usermanagement.createSeller(req.body);
    return res.status(201).json({
      status: 201,
      message: "successfully created",
      newuser: newUser,
    });
  } catch (err) {
    next(err);
  }
};
const findAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { allUsers, totalPages } = await usermanagement.findAllUser(
      page,
      limit
    );
    return res
      .status(200)
      .json({ status: 200, data: allUsers, totalPages: totalPages });
  } catch (err) {
    next(err)
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    const requestedEmail = req.params.email;
    if (user.email != requestedEmail && user.role !== "superuser" && user.role !== "manager") {
      return res.status(401).json({ message: "unauthorised" });
    }
    const userAvailable = await usermanagement.findSpecificUser(requestedEmail);

    return res
      .status(200)
      .json({ title: user.role, user: userAvailable, isLoggedIn: true });
  } catch (err) {
    next(err)
  }
};

const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const attemptinglogger = await usermanagement.UserLogin({
      email,
      password,
    });
    const { token, userAvailable } = attemptinglogger;
    res.cookie("usertoken", token, {
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    });

    return res.status(200).json({
      status: 200,
      message: "successfully loggedIn",
      data: userAvailable,
      token,
    });
  } catch (err) {
    next(err)
  }
};
const userUpdateStatus = async (req, res, next) => {
  try {
    const { status, id } = req.body;
    const userId = id;
    const updatedUser = await usermanagement.updateUserStatus({
      status,
      userId,
    });

    return res.status(200).json({
      message: "Successfully updated status",
      data: updatedUser,
    });
  } catch (err) {
    next(err)
  }
};

const userUpdateRole = async (req, res, next) => {
  try {
    const { role, id } = req.body;
    const updatedUser = await usermanagement.updateUserRole({
      role,
      id: parseInt(id, 10),
    });
    return res.status(200).json({
      message: "Successfully updated role",
      data: updatedUser,
    });
  } catch (err) {
    next(err)
  }
};
const userProfileUpdate = async (req, res, next) => {
  try {
    const userData = { ...req.body }
    const { password, name, phone, nextofkinname, nextofkinphonenumber } = req.body;
    const userID = req.user.id;
    userData.userID = userID
    const updatedUserProfile = await usermanagement.updateUserProfile(userData);
    return res.status(200).json({
      message: "successfully updated your profile",
      data: updatedUserProfile,
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

export {
  findAllUsers,
  getUserProfile,
  UserLogin,
  createSeller,
  userUpdateStatus,
  userUpdateRole,
  userProfileUpdate,
  addprofilepicture,
  addIdImagefront,
  addIdImagebackward,
};
