const transformSales = (rawSale) => {
  //console.log("paginated sales ", rawSale);

  const productDetails = rawSale.productDetails || rawSale.mobiles || rawSale.accessories || {};
  const categoryDetails = rawSale.categoryDetails || rawSale.categories || {};
  const sellerDetails = rawSale.sellerDetails || rawSale.actors || {};
  const shopDetails = rawSale.shopDetails || rawSale.shops || {};

  const base = {
    saleId: rawSale.id,
    soldprice: Number(rawSale.soldPrice),
    netprofit: rawSale.profit,
    commission: rawSale.commission,
    commissionpaid: rawSale.commissionPaid,
    commissionstatus: rawSale.commisssionStatus || "N/A",
    IMEI: productDetails.IMEI || 0,
    paymentstatus: rawSale.paymentStatus || productDetails.paymentStatus || "N/A",
    color: productDetails.color || "N/A",
    storage: productDetails.storage || "N/A",
    productcost: Number(productDetails.productCost || 0),
    supplier: Number(productDetails.supplierId || 0),
    status: rawSale.status || "completed",
    productmodel: categoryDetails.itemModel || "N/A",
    productType: categoryDetails.itemType || "N/A",
    productname: categoryDetails.itemName || "Unknown",
    productCategory: categoryDetails.category || "Uncategorized",
    totalnetprice: Number(rawSale.soldPrice),
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
    createdAt: rawSale.createdAt?.toISOString() || new Date().toISOString(),
    batchNumber: productDetails.batchNumber || "N/A",
    category: categoryDetails.category?.toLowerCase() || "Uncategorized",
    sellername: sellerDetails.name || "Unknown Seller",
    shopname: shopDetails.shopName || "Unknown Shop",
    paymentDetails: rawSale.Payment || {},
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
