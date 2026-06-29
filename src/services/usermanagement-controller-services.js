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
    const passwordMatch = await validatePassword(
      password,
      userFound.password
    );
    if (!passwordMatch) {
      throw new AuthenticationError("invalid password")
    }

    const payload = {
      id: userFound.id,
      role: userFound.role,
      email: userFound.email,
      name: userFound.name,
      phonenumber: userFound.phonenumber,
      workingstatus: userFound.workingstatus,
    };
    const token = await GenerateSignature(payload);
    return { token, userAvailable };

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
    const user = await this.repository.SearchUsers(userItem);
    if (!user.length) {
      throw new NotFoundError("user not found")
    }
    return user;
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
