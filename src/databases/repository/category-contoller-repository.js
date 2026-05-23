import { APIError, STATUS_CODE, ValidationError, InternalServerError, DuplicationError, NotFoundError } from "../../Utils/app-error.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
class CategoryManagementRepository {
  async AddNewProduct(itemDetails) {
    try {
      const {
        itemName,
        itemModel,
        itemType,
        brand,
        minPrice,
        maxPrice,
        category,
      } = itemDetails;

      const productItem = await prisma.categories.create({
        data: {
          itemName,
          itemModel,
          itemType,
          brand,
          minPrice,
          maxPrice,
          category,
        },
      });

      return productItem;
    } catch (err) {
      console.error(err);

      if (err.code === "P2002") {
        throw new APIError(
          "Duplicate Key Error",
          STATUS_CODE.BAD_REQUEST,
          `A product with the same ${err.meta.target} already exists.`
        );
      } else {
        throw new APIError(
          "API Error",
          STATUS_CODE.INTERNAL_ERROR,
          err.message || "Unable to create new goods"
        );
      }
    }
  }

  async updateCategory(categoryId, updatedDetails) {
    try {
      const updatedCategory = await prisma.categories.update({
        where: {
          id: categoryId,
        },
        data: updatedDetails,
      });

      return updatedCategory;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  // async AddItemInProduct({ id, itemId }) {
  //     try {
  //         const UpdatedProduct = await Product.findByIdAndUpdate(
  //             id,
  //             {
  //                 $push: { Items: itemId },
  //             },
  //             { new: true }
  //         );
  //         console.log("i have been approached")
  //     }
  //     catch (err) {
  //         throw new APIError(
  //             "API Error",
  //             STATUS_CODE.INTERNAL_ERROR,
  //             err.message || "Unable to create new goods"
  //         );
  //     }
  // }
  // async updateSalesOfProduct({ id, salesId }) {
  //     try {
  //         const updatedProduct
  //             = await Product.findByIdAndUpdate(
  //                 id,
  //                 {
  //                     $push: { sales: salesId },
  //                 },
  //                 { new: true }
  //             );
  //         return updatedProduct;
  //     } catch (err) {
  //         throw new APIError(
  //             "service error",
  //             STATUS_CODE.INTERNAL_ERROR,
  //             err.message || "Unable to update sales"
  //         );
  //     }
  // }
  //fetch all categories id
  async getAllCategories(userRole, page = 1, limit = 10) {
    try {

      let whereClause = {};
      if (userRole !== 'superuser') {
        whereClause = {
          status: {
            not: 'DELETED',
          },
        };
      }

      const skip = (page - 1) * limit;
      const take = limit;

      const [categories, totalItems] = await prisma.$transaction([
        prisma.categories.findMany({
          where: whereClause,
          skip,
          take,
        }),
        prisma.categories.count({ where: whereClause })
      ]);

      if (!categories || categories.length === 0) {
        throw new APIError(
          "Not Found",
          STATUS_CODE.NOT_FOUND,
          "No categories found"
        );
      }

      const categoryIds = categories.map(c => c.id);
      // console.log("categoryIds", categoryIds);
      //Just go through the accessories table, group them by their CategoryId, and give me the sum of availableStock for each group.
      //and do the same for the mobiles
      const accessoryStock = await prisma.accessories.groupBy({
        by: ['CategoryId'],
        _sum: {
          availableStock: true,
        },
        where: {
          CategoryId: { in: categoryIds }
        }
      });
      //it will result to an array of objects
      const mobileStock = await prisma.mobiles.groupBy({
        by: ['CategoryId'],
        _sum: {
          availableStock: true,
        },
        where: {
          CategoryId: { in: categoryIds }
        }
      });
      console.log("mobile stock", mobileStock)
      const accessoryStockMap = new Map(accessoryStock.map(item => [item.CategoryId, item._sum.availableStock || 0]));
      //console.log("accessoryStockMap", accessoryStockMap);
      const mobileStockMap = new Map(mobileStock.map(item => [item.CategoryId, item._sum.availableStock || 0]));
      //console.log("mobileStockMap", mobileStockMap);
      const categoriesWithStock = categories.map(category => ({
        ...category,
        availableStock: (accessoryStockMap.get(category.id) || 0) + (mobileStockMap.get(category.id) || 0)
      }));
      //console.log("categoriesWithStock", categoriesWithStock);
      return { categoriesWithStock, totalItems };
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        err.message || "Internal server error"
      );
    }
  }

  async deleteCategory(categoryId) {
    try {
      const updatedCategory = await prisma.categories.update({
        where: {
          id: categoryId,
        },
        data: {
          status: 'DELETED',
        },
      });

      return updatedCategory;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async getAllMobilesCategory() {
    try {
      const allCategories = await prisma.categories.findMany({
        include: {
          accessories: {
            select: {
              id: true,
              discount: true,
              commission: true,
              availableStock: true,
              createdAt: true,
              batchNumber: true,
              stockStatus: true,
              faultyItems: true,
              color: true,
            },
          },
          mobiles: {
            select: {
              id: true,
              discount: true,
              commission: true,
              availableStock: true,
              createdAt: true,
              batchNumber: true,
              stockStatus: true,
              color: true,
              IMEI: true,
            },
          },
        },
      });

      if (!allCategories || allCategories.length === 0) {
        throw new APIError(
          "Not Found",
          STATUS_CODE.NOT_FOUND,
          "No categories found"
        );
      }

      return allCategories;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        err.message || "Internal server error"
      );
    }
  }
  async getCategoryById(categoryId, tx) {
    try {
      const category = await (tx || prisma).categories.findUnique({
        where: {
          id: categoryId,
        },
        include: {
          accessories: {
            select: {
              id: true,
              discount: true,
              commission: true,
              availableStock: true,
              createdAt: true,
              batchNumber: true,
              stockStatus: true,
              faultyItems: true,
              color: true,
              accessoryItems: {
                select: {
                  shops: {
                    select: {
                      shopName: true,
                      address: true,
                    },
                  },
                  quantity: true,
                  status: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          mobiles: {
            select: {
              id: true,
              discount: true,
              commission: true,
              availableStock: true,
              updatedAt: true,
              createdAt: true,
              batchNumber: true,
              stockStatus: true,
              color: true,
              IMEI: true,
              mobileItems: {
                select: {
                  shops: {
                    select: {
                      shopName: true,
                      address: true,
                    },
                  },
                  status: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });

      //console.log("category", category);

      if (!category) {
        throw new NotFoundError(
          "Category not found"
        );
      }

      return category;
    } catch (err) {
      // console.log("erer", err);
      if (err instanceof NotFoundError) {
        throw err
      }
      throw new InternalServerError("Internal server error")

    }
  }
  async getCategoryByShop(categoryId, shopName) {
    try {
      const category = await prisma.categories.findFirst({
        where: {
          id: categoryId,
          mobiles: {
            some: {
              mobileItems: {
                some: {
                  shops: {
                    shopName: shopName,
                  },
                  status: {
                    in: ["pending", "confirmed"],
                  },
                },
              },
            },
          },
        },
        include: {
          mobiles: {
            where: {
              mobileItems: {
                some: {
                  shops: {
                    shopName: shopName,
                  },
                  status: {
                    in: ["pending", "confirmed"],
                  },
                },
              },
            },
            select: {
              id: true,
              discount: true,
              commission: true,
              availableStock: true,
              updatedAt: true,
              createdAt: true,
              batchNumber: true,
              stockStatus: true,
              color: true,
              IMEI: true,
              mobileItems: {
                where: {
                  shops: {
                    shopName: shopName,
                  },
                  status: {
                    in: ["pending", "confirmed"],
                  },
                },
                select: {
                  shops: {
                    select: {
                      shopName: true,
                      address: true,
                    },
                  },
                  status: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });
      if (!category) {
        throw new APIError(
          "Not Found",
          STATUS_CODE.NOT_FOUND,
          "Category not found in this shop"
        );
      }
      //console.log("Filtered Category:", category);
      return category;
    } catch (err) {
      console.log("erer", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  async searchForCategory(searchItem) {

    try {

      const categories = await prisma.categories.findMany({

        where: {

          OR: [

            {

              itemName: {

                contains: searchItem,

              },

            },

            {

              itemModel: {

                contains: searchItem,

              },

            },

            {

              brand: {

                contains: searchItem,

              },

            },

          ],

        },

      });



      if (!categories || categories.length === 0) {

        return [];

      }



      const categoryIds = categories.map(c => c.id);



      const accessoryStock = await prisma.accessories.groupBy({

        by: ['CategoryId'],

        _sum: {

          availableStock: true,

        },

        where: {

          CategoryId: { in: categoryIds }

        }

      });



      const mobileStock = await prisma.mobiles.groupBy({

        by: ['CategoryId'],

        _sum: {

          availableStock: true,

        },

        where: {

          CategoryId: { in: categoryIds }

        }

      });



      const accessoryStockMap = new Map(accessoryStock.map(item => [item.CategoryId, item._sum.availableStock || 0]));

      const mobileStockMap = new Map(mobileStock.map(item => [item.CategoryId, item._sum.availableStock || 0]));



      const categoriesWithStock = categories.map(category => ({

        ...category,

        availableStock: (accessoryStockMap.get(category.id) || 0) + (mobileStockMap.get(category.id) || 0)

      }));



      return categoriesWithStock;

    } catch (err) {

      console.log(err);

      throw new APIError(

        "Service Error",

        STATUS_CODE.INTERNAL_ERROR,

        "Internal server error"

      );

    }

  }
}

export { CategoryManagementRepository };
