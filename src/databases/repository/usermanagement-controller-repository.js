import { PrismaClient } from "@prisma/client";
import { DuplicationError } from "../../Utils/app-error.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";
const prisma = new PrismaClient();
class usermanagemenRepository {
  async createMainAdmin({
    name,
    email,
    hashedpassword,
    phonenumber,
    nextofkinname,
    nextofkinphonenumber,
    imgUrls,
  }) {
    try {
      const newUser = await prisma.actors.create({
        data: {
          name,
          email,
          password: hashedpassword,
          phone: phonenumber,
          nextofkinname: nextofkinname,
          nextofkinphonenumber: nextofkinphonenumber,
          profileimage: imgUrls,
          role: "superuser",
        },
      });
      return newUser;
    } catch (err) {
      //console.log("error", err);
      if (err.code === "P2002") {
        // Prisma error code for unique constraint violation
        const duplicateField = err.meta.target[0]
        throw new DuplicationError(
          `${email} is already in use.`
        );
      } else {
        throw new APIError(
          "API error",
          STATUS_CODE.INTERNAL_ERROR,
          "Unable to create the super user"
        );
      }
    }
  }

  async createSeller({
    name,
    email,
    hashedpassword,
    phonenumber,
    nextofkinname,
    nextofkinphonenumber,
  }) {
    try {
      const newseller = await prisma.actors.create({
        data: {
          name: name,
          email: email,
          password: hashedpassword,
          nextofkinname: nextofkinname,
          nextofkinphonenumber: nextofkinphonenumber,
          phone: phonenumber,
          role: "seller",
        },
      });

      return newseller;
    } catch (err) {

      if (err.code === "P2002") {

        const duplicatedField = err.meta.target;
        let duplicatedValue;
        if (duplicatedField === "actors_email_key") {
          duplicatedValue = email
        } else {
          duplicatedValue = phonenumber
        }
        throw new DuplicationError(
          `${duplicatedValue} is already in use.`
        );
      } else {
        throw new APIError(
          "API error",
          STATUS_CODE.INTERNAL_ERROR,
          "Unable to create the super user"
        );
      }
    }
  }

  async fetchAllUsers(page, limit) {
    try {
      const skip = (page - 1) * limit;

      const users = await prisma.actors.findMany({
        skip: skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          workingstatus: true,
        },
      });

      const totalUsers = await prisma.actors.count();

      const totalPages = Math.ceil(totalUsers / limit);

      if (!users || users.length === 0) {
        throw new APIError(
          "Users not found",
          STATUS_CODE.NOT_FOUND,
          "Users are currently not available"
        );
      }

      return {
        users,
        totalUsers,
        totalPages,
        currentPage: page,
      };
    } catch (err) {
      console.log("Repository Error:", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  async findAssignedShop(id) {
    try {
      const assignedShop = await prisma.assignment.findMany({
        where: {
          userID: id,
        },
        include: {
          shops: {
            select: {
              shopName: true,
              address: true,
            },
          },

        },
      });

      return assignedShop;
    } catch (err) {
      console.log("error", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }
  async findUser(email) {
    try {
      console.log("email", email);
      const user = await prisma.actors.findUnique({
        where: {
          email: email,
        },
        include: {
          assignment: {
            select: {
              id: true,
              shopID: true,
              fromDate: true,
              toDate: true,
              status: true,
              shops: {
                select: {
                  shopName: true,
                  address: true,
                },
              },
            },
          }
        }
      });
      if (!user) {
        throw new APIError(
          "User not found",
          STATUS_CODE.NOT_FOUND,
          "The specified user does not exist"
        );
      }
      return user;
    } catch (err) {
      console.log("err", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  //remember to move this part of the code to sales modue
  async findUserAccesorySales(sellerId) {
    try {
      const accessorySales = await prisma.accessorysales.findMany({
        where: {
          sellerId: sellerId,
        },
        select: {
          id: true,
          commission: true,
          soldPrice: true,
          quantity: true,
          createdAt: true,
          shops: {
            select: {
              shopName: true,
            },
          },
          accessories: {
            select: {
              batchNumber: true,
              productCost: true,
              categories: {
                select: {
                  itemName: true,
                  itemModel: true,
                  brand: true,
                  minPrice: true,
                },
              },
            },
          },
        },
      });

      return accessorySales;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async findUserMobilesSales(sellerId) {
    try {
      const accessorySales = await prisma.mobilesales.findMany({
        where: {
          sellerId: sellerId,
        },
        select: {
          id: true,
          commission: true,
          soldPrice: true,
          quantity: true,
          createdAt: true,
          shops: {
            select: {
              shopName: true,
            },
          },
          mobiles: {
            select: {
              batchNumber: true,
              productCost: true,
              categories: {
                select: {
                  itemName: true,
                  itemModel: true,
                  brand: true,
                  minPrice: true,
                },
              },
            },
          },
        },
      });

      return accessorySales;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async findUserByname({ name }) {
    try {
      const user = await prisma.actors.findFirst({
        where: {
          name: name,
        },
        select: {
          email: true,
          id: true,
        },
      });
      if (!user) {
        throw new APIError(
          "User not found",
          STATUS_CODE.NOT_FOUND,
          "The specified user does not exist"
        );
      }
      return user;
    } catch (err) {
      console.log("err", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async findUserById({ id }) {
    try {
      const userFound = await prisma.actors.findUnique({
        where: {
          id: id,
        },
      });
      return userFound;
    } catch (err) {
      console.log("findusererror", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async updateUserProfile(updatedFields) {
    try {
      const {
        name,
        email,
        password,
        phone,
        nextofkinname,
        nextofkinphonenumber,
      } = updatedFields;
      console.log("useremail", email);
      const userFound = await prisma.actors.findUnique({
        where: {
          email: email,
        },
      });

      if (!userFound) {
        throw new APIError(
          "User not found",
          STATUS_CODE.NOT_FOUND,
          "The specified user does not exist"
        );
      }

      const updateFields = {
        name,
        phone,
        email,
        nextofkinname,
        nextofkinphonenumber,
      };
      if (password) {
        updateFields.password = password;
      }
      // Update the user
      const updatedUser = await prisma.actors.update({
        where: {
          email: email,
        },
        data: updateFields,
      });

      console.log("updatedUser", updatedUser);
      return updatedUser;
    } catch (err) {
      console.log("Repository Error:", err);
      throw new APIError(
        "Internal server error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }
  async addprofilepicture({ id, imgUrls }) {
    try {
      const updatedUser = await prisma.actors.update({
        where: {
          id: id,
        },
        data: { profileimage: imgUrls[0] },
      });
      return updatedUser;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "DatabasError",
        STATUS_CODE.INTERNAL_ERROR,
        "failed to update user profile picture"
      );
    }
  }
  async addIDpicture({ id, imgUrls }) {
    try {
      console.log("img", imgUrls);
      const updatedUser = await prisma.actors.update({
        where: {
          id: id,
        },
        data: { Idimagefront: imgUrls },
      });
      return updatedUser;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "DatabasError",
        STATUS_CODE.INTERNAL_ERROR,
        "failed to update user profile picture"
      );
    }
  }

  async addIDpicturebackward({ id, imgUrls }) {
    try {
      const updatedUser = await prisma.actors.update({
        where: {
          id: id,
        },
        data: { Idimagebackward: imgUrls },
      });

      return updatedUser;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "DatabasError",
        STATUS_CODE.INTERNAL_ERROR,
        "failed to update user profile picture"
      );
    }
  }

  //update user and seller status

  async updateUser({ status, userId }) {
    try {
      const id = parseInt(userId, 10);
      if (isNaN(id)) {
        throw new APIError(
          "bad request",
          STATUS_CODE.BAD_REQUEST,
          "Invalid ID format"
        );
      }
      const UserFound = await this.findUserById({ id });
      if (!UserFound) {
        throw new APIError(
          "User not found",
          STATUS_CODE.NOT_FOUND,
          "The specified user does not exist"
        );
      }
      const updatedUser = await prisma.actors.update({
        where: {
          id: id,
        },
        data: { workingstatus: status },
      });
      return updatedUser;
    } catch (err) {
      console.log("err", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "DatabasError",
        STATUS_CODE.BAD_REQUEST,
        "failed to update user status"
      );
    }
  }

  async updateUserRole({ role, id }) {
    try {
      const UserFound = await this.findUserById({ id });
      if (!UserFound) {
        throw new APIError(
          "User not found",
          STATUS_CODE.NOT_FOUND,
          "The specified user does not exist"
        );
      }
      const updatedUser = await prisma.actors.update({
        where: {
          id: id,
        },
        data: { role: role },
      });
      return updatedUser;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "DatabasError",
        STATUS_CODE.BAD_REQUEST,
        "failed to update user status"
      );
    }
  }

  //on review
  // async deleteUser({ id }) {
  //   try {
  //     const deletedUser = await userSchema.findByIdAndDelete({ id: id });
  //     return deletedUser;
  //   } catch (err) {
  //     throw new APIError(
  //       "internal server error",
  //       STATUS_CODE.INTERNAL_ERROR,
  //       "internal server error"
  //     );
  //   }
  // }
  //update user assignment
  async updateUserAssignment({ sellerId, shopId, fromDate, toDate, type }) {
    try {
      if (!sellerId) {
        throw new APIError(
          "not found",
          STATUS_CODE.NOT_FOUND,
          "SELLER ID NOT FOUND"
        );
      }

      const formattedFromDate = fromDate
        ? new Date(fromDate).toISOString()
        : null;
      const formattedToDate = toDate ? new Date(toDate).toISOString() : null;

      // Create a new assignment record in the `assignment` table
      const assignment = await prisma.assignment.create({
        data: {
          userID: sellerId,
          shopID: shopId,
          fromDate: formattedFromDate || null,
          toDate: formattedToDate || null,
          status: type || "unknown",
        },
      });

      return assignment;
    } catch (err) {
      console.error("Error updating user assignment:", err);
      throw err;
    }
  }

  async removeUserAssignment(id) {
    try {
      const updateAssignment = await prisma.assignment.update({
        where: {
          id: id,
        },
        data: {
          status: "removed",
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      throw new APIError("server error", 500, "internal server error");
    }
  }

  async SearchUsers(userItem) {
    try {
      // Perform a case-insensitive search for users matching the name or email
      const foundUser = await prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: userItem,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: userItem,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return foundUser;
    } catch (err) {
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
}

export { usermanagemenRepository };
