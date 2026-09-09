import { AccessorySalesService } from "../../services/accessorysales-service.js";
import { MobileSalesService } from "../../services/mobileSales-services.js";
import customerService from "../../services/customer-service.js";
import paymentService from "../../services/payment-service.js";
import {
  handleError,
  handleSalesResponse,
} from "../../helpers/responseUtils.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const mobileSales = new MobileSalesService();
const accessorySalesService = new AccessorySalesService();

const makesales = async (req, res) => {
  try {
    const { bulksales, customerdetails, shopName } = req.body;
    const user = req.user;

    console.log("shopName", shopName);

    // Step 1: Find or create the customer
    const customer = await customerService.findOrCreateCustomer(customerdetails);

    // Step 2: Create a single payment record for the entire transaction
    const totalAmount = bulksales.reduce((acc, sale) => {
      return acc + sale.items.reduce((itemAcc, item) => itemAcc + (item.soldprice * item.soldUnits), 0);
    }, 0);
    console.log("payment made")
    const payment = await paymentService.createPayment({
      amount: totalAmount,
      paymentMethod: bulksales[0].paymentmethod,
      customerId: customer.id,
    });
    console.log("payment",payment)

    // Step 3: Process each sale with the new customer and payment IDs
    const processSales = (sales, salesMethod) => {
      return sales.flatMap((sale) => {
        const { items, ...salesDetail } = sale;
        return items.map((item) => {
          const salesDetails = {
            ...salesDetail,
            ...item,
            shopname: shopName,
            seller: user.id,
            customerId: customer.id,
            paymentId: payment.id,
          };
          return salesMethod(salesDetails);
        });
      });
    };

    const phonesales = bulksales.filter((sale) => sale.itemType === "mobiles");
    const processphonesales =
      phonesales.length > 0
        ? processSales(
          phonesales,
          mobileSales.processMobileSale.bind(mobileSales)
        )
        : [];

    const accessoriesSales = bulksales.filter(
      (sales) => sales.itemType == "accessories"
    );
    const processaccessoriesales =
      accessoriesSales.length > 0
        ? processSales(
          accessoriesSales,
          accessorySalesService.processAccessorySale.bind(
            accessorySalesService
          )
        )
        : [];

    const allPromises = [...processphonesales, ...processaccessoriesales];
    if (allPromises.length > 0) {
      const results = await Promise.allSettled(allPromises);
      const successfulSales = results.filter(
        (result) => result.status === "fulfilled"
      );
      const failedSales = results.filter(
        (result) => result.status === "rejected"
      );
      handleSalesResponse({
        res,
        message: "Sales process completed",
        successfulSales: successfulSales,
        failedSales: failedSales,
      });
    } else {
      throw new APIError(
        "No sales processed",
        STATUS_CODE.BAD_REQUEST,
        "No sales were processed from the request."
      );
    }
  } catch (err) {
    handleError(res, err);
  }
};

export { makesales };
