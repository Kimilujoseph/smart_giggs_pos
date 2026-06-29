import { PrismaClient } from "@prisma/client";
////import { DuplicationError } from "../../Utils/app-error.js";
import { APIError, STATUS_CODE, InternalServerError, DuplicationError } from "../../Utils/app-error.js";
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
      console.log("error", err)
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
        throw new InternalServerError();


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

      const totalPages = Math.ceil(totalUsers / limit)

      return {
        users,
        totalUsers,
        totalPages,
        currentPage: page,
      };
    } catch (err) {

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
              id: true
            },
          },

        },
      });

      return assignedShop;
    } catch (err) {
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }
  async findUser(email) {
    try {
      ///console.log("email", email);
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
      return user;
    } catch (err) {

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
      return user;
    } catch (err) {
      throw new InternalServerError()
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
      throw new InternalServerError("Internal server error")
    }
  }
  async updateUserProfile(updatedFields) {
    try {
      const {
        email
      } = updatedFields;

      const updatedUser = await prisma.actors.update({
        where: {
          email: email,
        },
        data: updatedFields,
      });

      return updatedUser;
    } catch (err) {
      throw new InternalServerError()
    }
  }


  //update user and seller status

  async updateUser({ status, userId }) {
    try {

      const updatedUser = await prisma.actors.update({
        where: {
          id: userId,
        },
        data: { workingstatus: status },
      });
      return updatedUser;
    } catch (err) {
      throw new InternalServerError()
    }
  }

  async updateUserRole({ role, id }) {
    try {
      const updatedUser = await prisma.actors.update({
        where: {
          id: id,
        },
        data: { role: role },
      });
      return updatedUser;
    } catch (err) {
      throw new InternalServerError()
    }
  }

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
