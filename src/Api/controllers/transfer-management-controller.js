import { transferManagementService } from "../../services/transfer-contoller-service.js"
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";
const transferManager = new transferManagementService();

const handleBulkTransfer = async (req, res) => {
    try {
        const user = req.user;

        const { bulkDistribution, shopDetails, category } = req.body
        console.log("@@@###$$",req.body)
        if (!bulkDistribution || bulkDistribution.length === 0) {
            throw new APIError("No distribution data provided", STATUS_CODE.BAD_REQUEST, "No distribution data provided");
        }

        const mainShop = shopDetails.mainShop;
        const distributedShop = shopDetails.distributedShop;
        const shopContainingItem = shopDetails.fromShop;
        const userId = user.id;
        const processDistribution = (distributions, distributionMethod) => {
            return distributions.map((distribution) => {
                const transferId = distribution.transferId ? distribution.transferId : null;
                const quantity = distribution.quantity ? distribution.quantity : null;

                const distributionData = {
                    ...distribution,
                    mainShop: mainShop,
                    distributedShop: distributedShop,
                    fromShop: shopContainingItem,
                    userId: userId,
                    quantity: quantity,
                    transferId: transferId,
                }
                return distributionMethod.call(transferManager, distributionData)
            })
        }
        let productDistribution;
        let processProductDistribution;
        if (category === "mobiles") {
            productDistribution = bulkDistribution.filter(item => item.productId !== null);

            processProductDistribution = productDistribution.length > 0 ? processDistribution(productDistribution, transferManager.createNewMobileTransfer) : [];
        } else {
            productDistribution = bulkDistribution.filter(item => item.productId !== null);

            processProductDistribution = productDistribution.length > 0 ? processDistribution(productDistribution, transferManager.createnewAccessoryTransfer) : [];
        }
        const allPromises = [...processProductDistribution];

        if (allPromises.length > 0) {
            const results = await Promise.allSettled(allPromises);

            const successfulDistributions = results.filter((result) => result.status === "fulfilled");
            const failedDistributions = results.filter((result) => result.status === "rejected");

            if (failedDistributions.length > 0) {
                console.error("Some distributions failed:", failedDistributions);
            }
            
            return res.status(200).json({
                message: "Distribution process completed",
                successfulDistributions: successfulDistributions.length,
                failedDistributions: failedDistributions.length,
                error: failedDistributions.length > 0,
                details: failedDistributions.map((failure) => ({

                    reason: failure.reason.message || "Unknown error",
                })),
            });
        } else {
            throw new APIError("No distribution made", STATUS_CODE.BAD_REQUEST, "No distribution made");
        }

    }
    catch (err) {
        console.log("contorolloe", err)
        if (err instanceof APIError) {
            res.status(err.statusCode).json({ error: true, message: err.message })
        }
        res.status(500).json({ error: true, message: err.message })
    }

}

export { handleBulkTransfer }