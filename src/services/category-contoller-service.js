import { CategoryManagementRepository } from '../databases/repository/category-contoller-repository.js';
import { APIError, NotFoundError, BadRequestError, STATUS_CODE } from "../Utils/app-error.js";
class CategoryManagementService {
    constructor() {
        this.repository = new CategoryManagementRepository();
    }
    async createProduct(itemDetails) {
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
            throw new BadRequestError("Invalid item sunbmitted");
        }

        const allowedItemTypes = ['accessories', 'mobiles', 'smartphones', 'smallphones', 'simcards'];
        if (!allowedItemTypes.includes(itemDetails.itemType)) {
            throw new BadRequestError(
                `itemType is required and must be one of: ${allowedItemTypes.join(', ')}`
            );
        }
        const addedProduct = await this.repository.AddNewProduct(itemDetails);
        return addedProduct
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

        const id = parseInt(categoryId, 10);
        const category = await this.repository.getCategoryById(id);
        if (!category) {
            throw new NotFoundError("category currently not available")
        }
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
        return newCategory;
    }
    async searchForCategory(searchItem) {
        try {
            console.log("I have been hit for finding stock per category")
            const results = await this.repository.searchForCategory(searchItem);
            return results;
        } catch (err) {
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