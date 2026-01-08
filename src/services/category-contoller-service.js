import { CategoryManagementRepository } from '../databases/repository/category-contoller-repository.js';
import { APIError, STATUS_CODE } from "../Utils/app-error.js";
class CategoryManagementService {
    constructor() {
        this.repository = new CategoryManagementRepository();
    }
    async createProduct(itemDetails) {
        try {
            //verify item needed
            const verifiedItem = [
                "itemName",
                "itemModel",
                "itemType",
                "brand",
                "minPrice",
                "maxPrice",
                "category",
            ]
            const verifiedProperties = Object.keys(itemDetails).filter((key) =>
                verifiedItem.includes(key)
            )
            if (!verifiedProperties) {
                throw new APIError("not found", STATUS_CODE.BAD_REQUEST, "not item found");
            }

            const allowedItemTypes = ['accessories', 'mobiles', 'smartphones', 'smallphones', 'simcards'];
            if (!itemDetails.itemType || !allowedItemTypes.includes(itemDetails.itemType)) {
                throw new APIError(
                    "Invalid itemType",
                    STATUS_CODE.BAD_REQUEST,
                    `itemType is required and must be one of: ${allowedItemTypes.join(', ')}`
                );
            }
            const addedProduct = await this.repository.AddNewProduct(itemDetails);
            return addedProduct
        }
        catch (err) {
            if (err instanceof APIError) {
                throw err
            }
            throw new APIError(
                "service error",
                STATUS_CODE.INTERNAL_ERROR,
                "internal server error"
            )
        }
    }

    //fetch all categories available
    async getAllCategories(userRole, page, limit) {
        try {
            const { categoriesWithStock, totalItems } = await this.repository.getAllCategories(userRole, page, limit);

            const result = {
                categories: categoriesWithStock.map(c => ({
                    id: c.id,
                    itemName: c.itemName,
                    itemModel: c.itemModel,
                    minPrice: c.minPrice,
                    maxPrice: c.maxPrice,
                    brand: c.brand,
                    category: c.category,
                    availableStock: c.availableStock,
                    status: c.status
                })),
                totalItems
            };

            return result;
        }
        catch (err) {
            console.log(err);
            if (err instanceof APIError) {
                throw err
            }
            throw new APIError(
                "service error",
                STATUS_CODE.INTERNAL_ERROR,
                "internal server error"
            )
        }
    }

    async deleteCategory(categoryId) {
        try {
            const id = parseInt(categoryId, 10);
            await this.repository.deleteCategory(id);
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

    async updateCategory(categoryId, updatedDetails) {
        try {
            const updatingDetails = { ...updatedDetails, status: updatedDetails.status ? updatedDetails.status : "MODIFIED" }
            const updatedCategory = await this.repository.updateCategory(categoryId, updatingDetails);
            return updatedCategory;
        }
        catch (err) {
            if (err instanceof APIError) {
                throw err
            }
            throw new APIError(
                "service error",
                STATUS_CODE.INTERNAL_ERROR,
                "internal server error"
            )
        }
    }

    async getCategoryById(categoryId) {
        try {
            const id = parseInt(categoryId, 10);
            const category = await this.repository.getCategoryById(id);
            const item = category.mobiles.length > 0 ? category.mobiles : category.accessories;
            // console.log("item", item);  /
            const newCategory = {
                id: category.id,
                itemName: category.itemName,
                itemType: category.itemType,
                itemModel: category.itemModel,
                brand: category.brand,
                minPrice: category.minPrice,
                maxPrice: category.maxPrice,
                Items: item
            }

            console.log("Items", newCategory);

            // console.log(category);
            return newCategory;
        }
        catch (err) {
            if (err instanceof APIError) {
                throw err
            }
            throw new APIError(
                "service error",
                STATUS_CODE.INTERNAL_ERROR,
                "internal server error"
            )
        }
    }
    async getCategoryByShop(shopName, categoryId) {
        try {
            const id = parseInt(categoryId, 10);
            const category = await this.repository.getCategoryByShop(id, shopName);
            const item = category.mobiles.length > 0 ? category.mobiles : category.accessories;
            // console.log("item", item);  /
            const newCategory = {
                id: category.id,
                itemName: category.itemName,
                itemType: category.itemType,
                itemModel: category.itemModel,
                brand: category.brand,
                minPrice: category.minPrice,
                maxPrice: category.maxPrice,
                Items: item
            }

            //console.log("Items", newCategory);

            // console.log(category);
            return newCategory;
        }
        catch (err) {
            if (err instanceof APIError) {
                throw err
            }
            throw new APIError(
                "service error",
                STATUS_CODE.INTERNAL_ERROR,
                "internal server error"
            )
        }
    }
}

export {
    CategoryManagementService
}