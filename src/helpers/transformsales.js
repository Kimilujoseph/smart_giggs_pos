const transformSales = (rawSale, userRole) => {
  // console.log("paginated sales ", rawSale);

  ////console.log("#$#$#$", rawSale.Payment)
  const productDetails = rawSale.productDetails || rawSale.mobiles || rawSale.accessories || {};
  const categoryDetails = rawSale.categoryDetails || rawSale.categories || {};
  const sellerDetails = rawSale.sellerDetails || rawSale.actors || {};
  //console.log('seller d@@@@@@@@etails', sellerDetails)
  const shopDetails = rawSale.shopDetails || rawSale.shops || {};

  const requestingRole = String(userRole || sellerDetails.role || "").toLowerCase();
  const canViewProfit = ["superuser", "manager"].includes(requestingRole);
  const sellerRole = String(sellerDetails.role || "").toLowerCase();
  const isSellerAuthorized = ["manager", "superuser"].includes(sellerRole);

  const base = {
    saleId: rawSale.id,
    soldprice: (rawSale.salesType !== "direct" && categoryDetails.category === 'mobiles' && !isSellerAuthorized) ? 0 : Number(rawSale.soldPrice),
    netprofit: canViewProfit ? Number(rawSale?.profit || 0) : 0,
    commission: Number(rawSale?.commission || 0),
    commissionpaid: Number(rawSale?.commissionPaid || 0),
    commissionstatus: rawSale.commisssionStatus || "N/A",
    IMEI: productDetails.IMEI || 0,
    paymentstatus: rawSale.paymentStatus || productDetails.paymentStatus || "N/A",
    color: productDetails.color || "N/A",
    storage: productDetails.storage || "N/A",
    productcost: canViewProfit ? Number(productDetails.productCost || 0) : 0,
    supplier: Number(productDetails.supplierId || 0),
    status: rawSale.status || "completed",
    productmodel: categoryDetails.itemModel || "N/A",
    productType: categoryDetails.itemType || "N/A",
    productname: categoryDetails.itemName || "Unknown",
    productCategory: categoryDetails.category || "Uncategorized",
    totalnetprice: (rawSale.salesType !== "direct" && categoryDetails.category === 'mobiles' && !isSellerAuthorized) ? 0 : Number(rawSale.soldPrice),
    totalsoldunits: rawSale.quantity || 1,
    totaltransaction: 1,
    _id: {
      productId: rawSale.productID || null,
      sellerId: rawSale.sellerId || null,
      shopId: rawSale.shopID || null,
    },
    financeDetails: {
      financeStatus: rawSale.financeDetails?.financeStatus || rawSale.financeStatus || "N/A",
      financeAmount: Number(rawSale.financeDetails?.financeAmount || rawSale.financeAmount) || 0,
      financer: rawSale.financeDetails?.financer || rawSale.Financer?.name || "",
    },
    CategoryId: rawSale.categoryId || null,
    createdAt: typeof rawSale.createdAt?.toISOString === 'function' ? rawSale.createdAt.toISOString() : (rawSale.createdAt || new Date().toISOString()),
    batchNumber: productDetails.batchNumber || "N/A",
    category: categoryDetails.category?.toLowerCase() || "Uncategorized",
    sellername: sellerDetails.name || "Unknown Seller",
    shopname: shopDetails.shopName || "Unknown Shop",
    paymentDetails: rawSale.Payment || {},
    customerName: rawSale.Customer?.name || "walk-in-customer",
    customerphonenumber: rawSale.Customer?.phoneNumber || "N/A",
  };

  if (rawSale.mobiles || categoryDetails.itemType?.toLowerCase() === 'mobiles') {
    base.productmodel = productDetails.phoneType || base.productmodel;
    base.category = "mobiles";
  }

  if (rawSale.accessories || categoryDetails.itemType?.toLowerCase() === 'accessories') {
    base.category = "accessories";
  }

  return base;
};

export { transformSales };
