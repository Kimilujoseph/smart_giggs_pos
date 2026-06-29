import { usermanagemenRepository } from "../databases/repository/usermanagement-controller-repository.js";
import { APIError, STATUS_CODE, NotFoundError, AuthenticationError, BadRequestError } from "../Utils/app-error.js";
import {
  GenerateSalt,
  Generatepassword,
  GenerateSignature,
  validatePassword,
} from "../Utils/bcryptservicesgeneratetoken.js";
class userManagmentService {
  constructor() {
    this.repository = new usermanagemenRepository();
  }
  async createSeller(sellerdetails) {
    const {
      password
    } = sellerdetails;
    const newUser = { ...sellerdetails }
    //delete newUser["password"]
    const salt = await GenerateSalt();
    const hashedpassword = await Generatepassword(salt, password);
    newUser.hashedpassword = hashedpassword
    ///console.log(newUser)
    const userCreated = await this.repository.createSeller(newUser);

  }
  async findAllUser(page, limit) {
    const { users, totalPages } = await this.repository.fetchAllUsers(
      page,
      limit
    );
    if (users.length === 0) {
      throw new NotFoundError("user list not found")
    }

    const verfiedUser = users.filter((user) => user !== null);
    return { allUsers: verfiedUser, totalPages }
  }

  //get specic user for profile display

  async findSpecificUser(useremail) {

    const userFound = await this.repository.findUser(useremail);
    if (!userFound) {
      throw new NotFoundError("SPECIFIED USER NOT FOUND")
    }
    const shopAssigned = userFound.assignment.filter(
      (assignment) => assignment.status === "assigned"
    );
    const userAvailable = {
      ...userFound,
      assignedShop: shopAssigned[0]?.shops,
    };
    return userAvailable;

  }

  async UserLogin(userlogindetails) {

    const { email, password } = userlogindetails;
    const userFound = await this.repository.findUser(email);

    if (!userFound) {
      throw new NotFoundError("SPECIFIED USER NOT FOUND");
    }
    const userId = userFound.id;
    ///const userAssignedShop = await this.repository.findAssignedShop(userId);

    const shopAssigned = userFound.assignment.filter(
      (assignment) => assignment.status === "assigned"
    );

    const userAvailable = {
      ...userFound,
      assignedShop: shopAssigned[0]?.shops.shopName,
    };
    // const { accessorySales, mobileSales } = await Promise.all([
    //   this.repository.findUserAccesorySales(userId),
    //   this.repository.findUserMobilesSales(userId),
    // ]);

    const passwordMatch = await validatePassword(
      password,
      userFound.password
    );

    ////console.log("password match", passwordMatch);

    if (!passwordMatch) {
      throw new AuthenticationError("invalid password")
    }

    const payload = {
      id: userFound.id,
      role: userFound.role,
      email: userFound.email,
      name: userFound.name,
      // accesssorySales: accessorySales,
      // mobilesSales: mobileSales,
      phonenumber: userFound.phonenumber,
      workingstatus: userFound.workingstatus,
    };
    const token = await GenerateSignature(payload);
    return { token, userAvailable };

  }

  async createSuperUser(superuserdetails) {
    try {
      const {
        name,
        email,
        password,
        phonenumber,
        nextofkinname,
        nextofkinphonenumber,
      } = superuserdetails;
      console.log(superuserdetails);
      const salt = await GenerateSalt();
      const hashedpassword = await Generatepassword(salt, password);
      console.log("hashed", hashedpassword);
      const newUser = await this.repository.createMainAdmin({
        name,
        email,
        hashedpassword,
        phonenumber,
        nextofkinname,
        nextofkinphonenumber,
      });
      return newUser;
    } catch (err) {
      throw err;
    }
  }

  async addprofilepicture(userdetails) {
    try {
      const { email, imgUrls } = userdetails;
      const findUser = await this.findSpecificUser(email);
      let id = findUser.id;
      if (
        !findUser ||
        findUser.workingstatus === "suspended" ||
        findUser.workingstatus === "inactive"
      ) {
        throw new APIError(
          "unathorised",
          STATUS_CODE.UNAUTHORIZED,
          "not allowed to update profile picture"
        );
      }

      const updatedUser = await this.repository.addprofilepicture({
        imgUrls,
        id,
      });
      return updatedUser;
    } catch (err) {
      console.log("service", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "service error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async addIDpicture(userdetails) {
    try {
      const { email, imgUrls } = userdetails;
      const findUser = await this.findSpecificUser(email);
      let id = findUser.id;
      if (
        !findUser ||
        findUser.workingstatus === "suspended" ||
        findUser.workingstatus === "inactive"
      ) {
        throw new APIError(
          "unathorised",
          STATUS_CODE.UNAUTHORIZED,
          "not allowed to update profile picture"
        );
      }

      const updatedUser = await this.repository.addIDpicture({ imgUrls, id });
      return updatedUser;
    } catch (err) {
      console.log("service", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "service error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async addIDpicturebackward(userdetails) {
    try {
      const { email, imgUrls } = userdetails;
      const findUser = await this.findSpecificUser(email);
      let id = findUser.id;
      if (
        !findUser ||
        findUser.workingstatus === "suspended" ||
        findUser.workingstatus === "inactive"
      ) {
        throw new APIError(
          "unathorised",
          STATUS_CODE.UNAUTHORIZED,
          "not allowed to update profile picture"
        );
      }

      const updatedUser = await this.repository.addIDpicturebackward({
        imgUrls,
        id,
      });
      return updatedUser;
    } catch (err) {
      console.log("service", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "service error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async updateUserStatus(userdetails) {

    const { status, userId } = userdetails;
    const parsedUserId = parseInt(userId);
    await this.__findUserByID(parsedUserId)
    const updatedUser = await this.repository.updateUser({ status, userId: parsedUserId });
    return updatedUser;
  }

  async updateUserRole(userdetails) {
    const { role, id } = userdetails;
    const parsedId = parseInt(id)
    await this.__findUserByID(parsedId)
    const updatedUser = await this.repository.updateUserRole({ role, id: parsedId });
    return updatedUser;
  }

  async updateUserProfile(userdetails) {
    const {
      password,
      userID
    } = userdetails;

    let updatedFields = { ...userdetails };
    const userFound = await this.__findUserByID(userID)
    if (password) {
      const salt = await GenerateSalt();
      const hashedPassword = await Generatepassword(salt, password);
      updatedFields.password = hashedPassword;
    }
    updatedFields.email = userFound.email;
    delete updatedFields["userID"]
    const updatedUser = await this.repository.updateUserProfile(
      updatedFields
    );
    return updatedUser;
  }

  async findUserBySearch(userItem) {
    try {
      const user = await this.repository.SearchUsers(userItem);
      if (!user.length) {
        throw new APIError(
          "not found",
          STATUS_CODE.NOT_FOUND,
          "user not found"
        );
      }
      return user;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "service error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async __findUserByID(id) {
    const parsedUserId = parseInt(id);
    if (isNaN(parsedUserId)) {
      throw new BadRequestError("Bad input passed");
    }
    const foundUser = await this.repository.findUserById({ id: parsedUserId })
    if (!foundUser) {
      throw new NotFoundError("The specified user is not found");
    }
    return foundUser
  }
}
export { userManagmentService };
