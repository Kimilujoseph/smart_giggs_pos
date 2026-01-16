import { userinputvalidation } from "../../Utils/joivalidation.js";
import { userManagmentService } from "../../services/usermanagement-controller-services.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";
import uploads from "../../Utils/cloudinary.js";
import fs from "fs";
let usermanagement = new userManagmentService();

//gettting to the landing page
const createSeller = async (req, res, next) => {
  try {
    const {
      name,
      password,
      email,
      phonenumber,
      nextofkinphonenumber,
      nextofkinname,
    } = req.body;
    const newUser = await usermanagement.createSeller({
      name,
      password,
      email,
      nextofkinphonenumber,
      nextofkinname,
      phonenumber,
      phone: phonenumber,
    });
    //console.log(newUser);
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
    const user = req.user;

    if (user.role !== "superuser" && user.role !== "manager") {
      throw new APIError(
        "Not authorised",
        STATUS_CODE.UNAUTHORIZED,
        "not authorised to view the page"
      );
    }
    const { page = 1, limit = 20 } = req.query;
    const { allUsers, totalPages } = await usermanagement.findAllUser(
      page,
      limit
    );
    return res
      .status(200)
      .json({ status: 200, data: allUsers, totalPages: totalPages });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    console.log("user", user);
    const requestedEmail = req.params.email;
    if (user.email != requestedEmail && user.role !== "superuser" && user.role !== "manager") {
      console.log(user, requestedEmail);
      return res.status(401).json({ message: "unauthorised" });
    }
    const userAvailable = await usermanagement.findSpecificUser(requestedEmail);
    // console.log(userAvailable)
    return res
      .status(200)
      .json({ title: user.role, user: userAvailable, isLoggedIn: true });
  } catch (err) {
    console.log(err);
    return res.status(err.statusCode).json({ message: err.message });
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
    console.log(err);
    if (err instanceof APIError) {
      return res
        .status(err.statusCode)
        .json({ message: err.message, error: true });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};




const addprofilepicture = async (req, res) => {
  try {
    const user = req.user;
    console.log("user", user)
    const email = user.email;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded", error: true });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploads(file.path, "images");
        fs.unlinkSync(file.path);
        return result.url;
      } catch (uploadError) {
        // console.error(`Error uploading file ${file.path}:`, uploadError);
        throw new Error(`Failed to upload file ${file.path}`);
      }
    });
    const imgUrls = await Promise.all(uploadPromises);

    const addedUserprofile = await usermanagement.addprofilepicture({
      email,
      imgUrls,
    });
    return res.status(201).json({
      status: 201,
      message: "profile image successfully added",
    });
  } catch (err) {
    console.log(err);
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({
        message: err.message,
        statuscode: err.statusCode,
        error: true,
      });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const addIdImagefront = async (req, res) => {
  try {
    const user = req.user;
    const email = user.email;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploads(file.path, "images");
        fs.unlinkSync(file.path);
        return result.url;
      } catch (uploadError) {
        console.error(`Error uploading file ${file.path}:`, uploadError);
        throw new Error(`Failed to upload file ${file.path}`);
      }
    });
    const imgReceived = await Promise.all(uploadPromises);
    const imgUrls = imgReceived[0];

    const addedUserprofile = await usermanagement.addIDpicture({
      email,
      imgUrls,
    });
    return res.status(201).json({
      status: 201,
      message: "successfully uploaded image",
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
//update user status

const addIdImagebackward = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);
    const email = user.email;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploads(file.path, "images");
        console.log(file.path);
        fs.unlinkSync(file.path);
        return result.url;
      } catch (uploadError) {
        console.error(`Error uploading file ${file.path}:`, uploadError);
        throw new Error(`Failed to upload file ${file.path}`);
      }
    });
    const imgReceived = await Promise.all(uploadPromises);
    console.log(imgReceived);
    const imgUrls = imgReceived[0];
    const addedUserprofile = await usermanagement.addIDpicturebackward({
      email,
      imgUrls,
    });
    return res.status(201).json({
      status: 201,
      message: "successfully updated backward id image",
    });
  } catch (err) {
    console.log(err);
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const userUpdateStatus = async (req, res, next) => {
  try {
    const { status, id } = req.body;
    const userId = id;
    const user = req.user
    if (!["superuser", "manager"].includes(user.role)) {
      return res.status(403).json({ message: "unauthorised to update status" });
    }

    const updatedUser = await usermanagement.updateUserStatus({
      status,
      userId,
    });

    return res.status(200).json({
      message: "Successfully updated status",
      data: updatedUser,
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const userUpdateRole = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role !== "superuser") {
      return res.status(403).json({ message: "unauthorised to update role" });
    }
    const { role, id } = req.body;
    //const userId = id;
    const updatedUser = await usermanagement.updateUserRole({
      role,
      id: parseInt(id, 10),
    });

    return res.status(200).json({
      message: "Successfully updated role",
      data: updatedUser,
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
const userProfileUpdate = async (req, res, next) => {
  try {
    const { password, name, phone, nextofkinname, nextofkinphonenumber } = req.body;
    const user = req.user;
    const email = user.email
    const updatedUserProfile = await usermanagement.updateUserProfile({
      password,
      name,
      phone,
      email,
      nextofkinname,
      nextofkinphonenumber,
    });

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
