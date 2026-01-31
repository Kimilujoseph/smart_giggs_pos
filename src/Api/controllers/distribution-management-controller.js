import { distributionService } from "../../services/distribution-contoller-service.js";
import { APIError, STATUS_CODE, ValidationError } from "../../Utils/app-error.js";
const distributionManager = new distributionService();

const handleBulkDistibution = async (req, res, next) => {
  try {
    const user = req.user
    const { bulkDistribution, shopDetails, category } = req.body;


    if (!bulkDistribution || bulkDistribution.length === 0) {
      throw new ValidationError("Bulk distribution data is required and cannot be empty.");
    }

    if (category === "mobiles") {
      const successfulDistributions = await distributionManager.createBulkMobileDistribution({
        bulkDistribution,
        mainShop: shopDetails.mainShop,
        distributedShop: shopDetails.distributedShop,
        userId: parseInt(user.id, 10),
      });

      return res.status(200).json({
        message: "Distribution process completed successfully.",
        successfulDistributions: successfulDistributions.length,
        error: false,
      });

    } else {
      const successfulDistributions = await distributionManager.createBulkAccessoryDistribution({
        bulkDistribution,
        mainShop: shopDetails.mainShop,
        distributedShop: shopDetails.distributedShop,
        userId: parseInt(user.id, 10),
      });

      return res.status(200).json({
        message: "Accessory distribution process completed successfully.",
        successfulDistributions: successfulDistributions.length,
        error: false,
      });
    }
  } catch (err) {
    next(err);
  }
};

export { handleBulkDistibution };