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

  async fetchStockForCategories(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
      return new Map();
    }

    const [accessoryIDs, mobileIDs] = await Promise.all([
      prisma.accessories.groupBy({
        by: ['CategoryId', 'id'],
        _sum: {
          availableStock: true
        },
        where: {
          CategoryId: { in: categoryIds }
        }
      }),
      prisma.mobiles.groupBy({
        by: ['CategoryId', 'id'],
        _sum: {
          availableStock: true
        },
        where: {
          CategoryId: { in: categoryIds }
        }
      })
    ]);

    const accessoryIDsMap = accessoryIDs.map(c => c.id);
    const mobileIDsMap = mobileIDs.map(c => c.id);

    const [accessoryStock, mobileStock] = await Promise.all([
      accessoryIDsMap.length > 0
        ? prisma.accessoryItems.groupBy({
          by: ['accessoryID'],
          _sum: {
            quantity: true,
          },
          where: {
            accessoryID: { in: accessoryIDsMap }
          }
        })
        : [],
      mobileIDsMap.length > 0
        ? prisma.mobileItems.groupBy({
          by: ['mobileID'],
          _sum: {
            quantity: true,
          },
          where: {
            mobileID: { in: mobileIDsMap }
          }
        })
        : []
    ]);

    const accessoryMap = new Map();
    accessoryIDs.forEach(item => {
      const stock = item._sum.availableStock || 0;
      accessoryMap.set(item.CategoryId, (accessoryMap.get(item.CategoryId) || 0) + stock);
    });

    const mobileMap = new Map();
    mobileIDs.forEach(item => {
      const stock = item._sum.availableStock || 0;
      mobileMap.set(item.CategoryId, (mobileMap.get(item.CategoryId) || 0) + stock);
    });

    const accessoryStockMap = new Map(accessoryStock.map(item => [item.accessoryID, item._sum.quantity || 0]));
    const mobileStockMap = new Map(mobileStock.map(item => [item.mobileID, item._sum.quantity || 0]));

    const mobileTotalStock = new Map();
    mobileIDs.forEach(mobile => {
      const stock = mobileStockMap.get(mobile.id) || 0;
      mobileTotalStock.set(mobile.CategoryId, (mobileTotalStock.get(mobile.CategoryId) || 0) + stock);
    });

    const accessoriesTotalStock = new Map();
    accessoryIDs.forEach(accessory => {
      const stock = accessoryStockMap.get(accessory.id) || 0;
      accessoriesTotalStock.set(accessory.CategoryId, (accessoriesTotalStock.get(accessory.CategoryId) || 0) + stock);
    });

    const totalStockMap = new Map();
    categoryIds.forEach(id => {
      const total = (accessoriesTotalStock.get(id) || 0) +
        (mobileTotalStock.get(id) || 0) +
        (accessoryMap.get(id) || 0) +
        (mobileMap.get(id) || 0);
      totalStockMap.set(id, total);
    });

    return totalStockMap;
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
      const totalStockMap = await this.fetchStockForCategories(categoryIds);

      const categoriesWithStock = categories.map(category => ({
        ...category,
        availableStock: totalStockMap.get(category.id) || 0
      }));

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
              ModelName: true,
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
    const normalizeBigInt = (rows) =>
      rows.map(row =>
        Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
        )
      );

    try {
      const rawWords = searchItem.trim().split(/\s+/).filter(w => w.length > 0);
      if (rawWords.length === 0) {
        return [];
      }
      // console.log("raw words||", rawWords)
      // Step 2: Expand hyphenated/dotted tokens into sub-tokens
      // e.g. "POWER-3.0-ADAPTER" → ["POWER", "3.0", "ADAPTER"] → ["POWER", "3", "0", "ADAPTER"]
      const allTokens = [];
      for (const word of rawWords) {
        // Split on hyphens and dots to handle tokens like POWER-3.0-ADAPTER
        const subTokens = word.split(/[-.]/).filter(t => t.length > 0);
        if (subTokens.length > 1) {
          // Push both the original word and sub-tokens so we can LIKE on original too
          allTokens.push({ original: word, subTokens });
        } else {
          allTokens.push({ original: word, subTokens: [word] });
        }
      }
      const fulltextWords = [];
      const likePatterns = []; // These will be searched as LIKE '%token%' on all name columns

      for (const { original, subTokens } of allTokens) {
        const hasSpecialChars = /[-.]/.test(original);

        if (hasSpecialChars) {
          // For hyphenated/dotted words: use LIKE on the original word for exact sub-string match
          // AND add long sub-tokens to fulltext for broader recall
          likePatterns.push(original); // e.g. "POWER-3.0-ADAPTER"
          for (const sub of subTokens) {
            if (sub.length >= 3) {
              fulltextWords.push(sub); // e.g. "POWER", "ADAPTER"
            } else {
              likePatterns.push(sub); // e.g. "3", "0"
            }
          }
        } else if (original.length < 3) {
          // Short words that MySQL FULLTEXT ignores — use LIKE
          likePatterns.push(original);
        } else {
          // Normal long word — use FULLTEXT
          fulltextWords.push(original);
        }
      }

      // Step 4: Build the FULLTEXT query string (boolean mode with prefix wildcard)
      // Each word is required (+) and prefix-matched (*)
      const fulltextQuery = fulltextWords.map(w => `+${w}*`).join(" ");

      let categories;

      if (fulltextWords.length === 0 && likePatterns.length === 0) {
        return [];
      }

      // Step 5: Build SQL dynamically depending on what kind of tokens we have
      if (fulltextWords.length > 0 && likePatterns.length === 0) {
        // Pure FULLTEXT search — the fast path (original behaviour, but corrected)
        categories = await prisma.$queryRaw`
          SELECT c._id as id,
            c.itemName,
            c.itemModel,
            c.minPrice,
            c.itemType,
            c.brand,
            c.maxPrice,
            c.category,
            c.status,
            MATCH(c.itemName, c.itemModel, c.brand, c.category)
              AGAINST(${fulltextQuery} IN BOOLEAN MODE) AS relevance
          FROM categories c
          WHERE
            MATCH(c.itemName, c.itemModel, c.brand, c.category)
              AGAINST(${fulltextQuery} IN BOOLEAN MODE)
          ORDER BY relevance DESC
        `;
        categories = normalizeBigInt(categories);
      } else {
        const sanitizedLikePatterns = likePatterns.map(p =>
          p.replace(/[^a-zA-Z0-9\-\.]/g, "")
        );
        const likeConditions = sanitizedLikePatterns
          .map(p => `(c.itemName LIKE '%${p}%' OR c.itemModel LIKE '%${p}%' OR c.brand LIKE '%${p}%' OR c.category LIKE '%${p}%')`)
          .join(" AND ");

        let whereClause;
        let selectRelevance;

        if (fulltextWords.length > 0) {

          selectRelevance = `MATCH(c.itemName, c.itemModel, c.brand, c.category) AGAINST('${fulltextQuery.replace(/'/g, "\\'")}' IN BOOLEAN MODE) AS relevance`;
          whereClause = `MATCH(c.itemName, c.itemModel, c.brand, c.category) AGAINST('${fulltextQuery.replace(/'/g, "\\'")}' IN BOOLEAN MODE) AND ${likeConditions}`;
        } else {
          selectRelevance = `1 AS relevance`;
          whereClause = likeConditions;
        }

        const sql = `
          SELECT c._id as id,
            c.itemName,
            c.itemModel,
            c.minPrice,
            c.itemType,
            c.brand,
            c.maxPrice,
            c.category,
            c.status,
            ${selectRelevance}
          FROM categories c
          WHERE ${whereClause}
          ORDER BY relevance DESC
        `;

        categories = await prisma.$queryRawUnsafe(sql);
        categories = normalizeBigInt(categories);
      }


      if (!categories || categories.length === 0) {

        return [];

      }



      const categoryIds = categories.map(c => c.id);
      const totalStockMap = await this.fetchStockForCategories(categoryIds);

      const categoriesWithStock = categories.map(category => ({
        ...category,
        availableStock: totalStockMap.get(category.id) || 0
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
