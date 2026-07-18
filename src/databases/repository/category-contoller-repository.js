import { APIError, STATUS_CODE, ValidationError, InternalServerError, DuplicationError, NotFoundError } from "../../Utils/app-error.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
class CategoryManagementRepository {
  async AddNewProduct(itemDetails) {
    try {
      const productItem = await prisma.categories.create({
        data: itemDetails
      });

      return productItem;
    } catch (err) {
      if (err.code === "P2002") {
        if (err.meta.target === 'itemModel_UNIQUE') {
          throw new DuplicationError(`product with the same ${itemDetails.itemModel} model already exist`)
        }
      } else {
        throw new InternalServerError()
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
      const [accessoryIDs, mobileIDs] = await Promise.all([
        prisma.accessories.groupBy({
          by: ['CategoryId', 'id'],
          select: {
            CategoryId: true,
            id: true
          },
          where: {
            CategoryId: { in: categoryIds }
          }
        }),
        prisma.mobiles.groupBy({
          by: ['CategoryId', 'id'],
          select: {
            id: true
          },
          where: {
            CategoryId: { in: categoryIds }
          }
        })
      ])
      // console.log("@@@@@accessoryIDs", accessoryIDs)
      //console.log("@@@@@mobileID2323s", mobileIDs)
      const accessoryIDsMap = accessoryIDs.map(c => c.id);
      // console.log("accessoryIDsMap@@@@@@", accessoryIDsMap);
      const mobileIDsMap = mobileIDs.map(c => c.id);
      //console.log("@@@@mobileId$%$$%%", mobileIDsMap)
      const accessoryStock = await prisma.accessoryItems.groupBy({
        by: ['accessoryID'],
        _sum: {
          quantity: true,
        },
        where: {
          accessoryID: { in: accessoryIDsMap }
        }
      });
      // console.log("@@@@@AccessoryItems", accessoryStock)
      const mobileStock = await prisma.mobileItems.groupBy({
        by: ['mobileID'],
        _sum: {
          quantity: true,
        },
        where: {
          mobileID: { in: mobileIDsMap }
        }
      });
      // console.log("@@@@@MobileItems", mobileStock)

      const accessoryStockMap = new Map(accessoryStock.map(item => [item.accessoryID, item._sum.quantity || 0]));
      /// console.log("accessoryStockMap@@@@@@", accessoryStockMap);
      const mobileStockMap = new Map(mobileStock.map(item => [item.mobileID, item._sum.quantity || 0]));
      //console.log("mobileStockMap@@@@@@", mobileStockMap);
      const mobileTotalStock = new Map();
      mobileIDs.forEach(mobile => {
        const stock = mobileStockMap.get(mobile.id)
        mobileTotalStock.set(mobile.CategoryId, (mobileTotalStock.get(mobile.CategoryId) || 0) + stock)
      })
      const accessoriesTotalStock = new Map();
      accessoryIDs.forEach(accessory => {
        const stock = accessoryStockMap.get(accessory.id)
        accessoriesTotalStock.set(accessory.CategoryId, (accessoriesTotalStock.get(accessory.CategoryId) || 0) + stock)
      })
      // console.log("mobileStockTOTALMap@@@@@@", accessoriesTotalStock);
      const categoriesWithStock = categories.map(category => ({
        ...category,
        availableStock: (accessoriesTotalStock.get(category.id) || 0) + (mobileTotalStock.get(category.id) || 0)
      }));
      //console.log("categoriesWithStock", categoriesWithStock);
      return { categoriesWithStock, totalItems };
    } catch (err) {
      ///console.log("err", err);
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
              margin: true,
              productCost: true,
              isConsignment: true,
              Financer: {
                select: {
                  name: true
                }
              },
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
      return category;
    } catch (err) {
      throw new InternalServerError("Internal server error")

    }
  }


  async searchForCategory(searchItem) {

    try {
      const words = searchItem.trim().split(" ").filter(w => w.length > 0);
      if (words.length === 0) {
        return [];
      }

      const searchQuery = words.map(w => `+${w}%`).join(" ");
      // console.log("search query created|", searchQuery)
      const categories = await prisma.$queryRaw`
      SELECT c._id as id,
      c.itemName,
  c.itemModel,
  c.minPrice,
  c.itemType,
  c.brand,
  c.maxPrice,
  c.category,
  c.status,
      MATCH(c.itemName, c.itemModel, c.brand,c.category)
      AGAINST(${searchQuery} IN BOOLEAN MODE) AS relevance
      FROM categories c
      WHERE
      MATCH(c.itemName, c.itemModel, c.brand,c.category)
      AGAINST(${searchQuery} IN BOOLEAN MODE)
      ORDER BY relevance DESC;
      `
      //console.log("categories", categories);


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
