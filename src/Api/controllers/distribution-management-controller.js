import { distributionService } from "../../services/distribution-contoller-service.js";
import { APIError, STATUS_CODE, ValidationError } from "../../Utils/app-error.js";
import { reversalDetails } from "../../Utils/joivalidation.js";
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

const handleReversal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { error, value } = reversalDetails(req.body)
    if (error) {
      throw new ValidationError(error.details.map((detail) => detail.message).join(", "));
    }
    const updatedDistributionDetails = { ...value, userId };
    console.log("updatedDistributionDetails", updatedDistributionDetails)
    const reverseDistributionDetails = await distributionManager.createReverseDistribution(updatedDistributionDetails);
    return res.status(200).json({
      message: reverseDistributionDetails,
      error: false
    })

  } catch (err) {
    next(err)
  }
}

export { handleBulkDistibution, handleReversal };