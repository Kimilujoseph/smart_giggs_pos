import { InvetorymanagementService } from "../../services/invetory-controller-services.js";
import { MobilemanagementService } from "../../services/mobile-controller-service.js";
import { userManagmentService } from "../../services/usermanagement-controller-services.js";
import { ShopmanagementService } from "../../services/shop-services.js";
import { CategoryManagementService } from "../../services/category-contoller-service.js";
import { APIError } from "../../Utils/app-error.js";

const inventoryService = new InvetorymanagementService();
const mobileService = new MobilemanagementService();
const userService = new userManagmentService();
const shopService = new ShopmanagementService();
const categoryService = new CategoryManagementService();


const getUrl = (category, id) => {
  switch (category) {
    case "accessory":
      return `/api/profile/accessory/${id}`;
    case "mobile":
      return `/api/profile/mobile/${id}`;
    case "person":
      return `/api/profile/user/${id}`;
    default:
      return "#";
  }
};

const searchProduct = async (req, res) => {
  const { category, searchItem } = req.body;
  console.log(req.body)
  let searchResult = [];

  try {
    switch (category) {
      case "accessory":
        searchResult = await inventoryService.searchForAccessory(searchItem);
        break;
      case "mobile":
        searchResult = await mobileService.searchForMobile(searchItem);
        break;
      case "user":
        searchResult = await userService.findUserBySearch(searchItem);
        break;
      case "shop":
        searchResult = await shopService.findproductbysearch(searchItem, req.query.name);
        break;
      case "category":
        searchResult = await categoryService.searchForCategory(searchItem);
        break;

      default:
        throw new APIError("Invalid category provided", 400);
    }

    // res.json(searchResult);

    // const formattedResponse = searchResult.map((item) => ({
    //   ...item,
    //   profileUrl: getUrl(category, item._id),
    // }));

    return res.status(200).json({
      status: 200,
      data: searchResult,
      error: false,
    });
  } catch (err) {
    console.log("@@@", err);
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default searchProduct;
