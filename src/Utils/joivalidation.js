import { Expense_category, ExpensePaymentMethod } from "@prisma/client";
import Joi from "joi";
const userinputvalidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phonenumber: Joi.string().required(),
    nextofkinname: Joi.string(),
    nextofkinphonenumber: Joi.string(),
  });
  return schema.validate(data);
};
// Schema for phone details
const phoneDetailsSchema = Joi.object({
  CategoryId: Joi.string().required().label("CategoryId"),
  IMEI: Joi.string()
    .pattern(/^\d{1,20}$/)
    .required()
    .label("IMEI")
    .messages({
      "string.pattern.base": "IMEI must be numeric and a maximum of 20 digits.",
    }),
  productType: Joi.string().label("productType"),
  storage: Joi.string().label("storage"),
  supplierName: Joi.string().required().label("supplierName"),
  productcost: Joi.number()
    .max(30000)
    .required()
    .label("productcost")
    .messages({
      "number.max": "Product cost must not exceed 30000.",
    }),
  color: Joi.string().required().label("color"),
  commission: Joi.number().required().label("commission"),
  batchNumber: Joi.string().required().label("batchNumber"),
  discount: Joi.number().required().label("discount"),
});
const financeDetailsSchema = Joi.object({
  financer: Joi.string().default("Captech limited").label("financer"),
  financeAmount: Joi.number().default(0).label("financeAmount"),
  financeStatus: Joi.string().default("paid").label("financeStatus"),
});
const salesPayloadSchema = Joi.object({
  phoneDetails: phoneDetailsSchema.required(),
  financeDetails: financeDetailsSchema.required(),
});

function validateSalesPayload(req, res, next) {
  const { error, value } = salesPayloadSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      error: error.details.map((detail) => detail.message),
    });
  }
  req.body = value;
  next();
}


const reversalDetails = (data) => {
  const schema = Joi.object({
    productItemId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    productType: Joi.string().valid('mobile', 'accessory').required(),
    fromShop: Joi.string().trim().min(1).required(),
  });
  return schema.validate(data);
}

const expenseInput = (data) => {
  const schema = Joi.object({
    shopId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().valid(...Object.values(Expense_category)).required(),
    subcategory: Joi.string().trim().max(100).optional(),
    description: Joi.string().trim().min(1).required(),
    paymentMethod: Joi.string().valid(...Object.values(ExpensePaymentMethod)).optional(),
    vendor: Joi.string().trim().max(255).optional(),
    taxAmount: Joi.number().positive().optional(),
    reference: Joi.string().trim().max(255).optional(),
    expenseDate: Joi.date().optional(),
  });
  return schema.validate(data);
}

const expenseUpdateInput = (data) => {
  const schema = Joi.object({
    amount: Joi.number().positive().optional(),
    category: Joi.string().valid(...Object.values(Expense_category)).optional(),
    subcategory: Joi.string().trim().max(100).optional(),
    description: Joi.string().trim().min(1).optional(),
    paymentMethod: Joi.string().valid(...Object.values(ExpensePaymentMethod)).optional(),
    vendor: Joi.string().trim().max(255).optional(),
    taxAmount: Joi.number().positive().optional(),
    reference: Joi.string().trim().max(255).optional(),
    expenseDate: Joi.date().optional(),
  }).min(1);
  return schema.validate(data);
}

const rejectionReasonInput = (data) => {
  const schema = Joi.object({
    reason: Joi.string().trim().min(5).max(500).required(),
  });
  return schema.validate(data);
}

const analyticsQuery = (data) => {
  const schema = Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    groupBy: Joi.string().valid('category', 'subcategory', 'paymentMethod', 'shop').default('category'),
    shopId: Joi.number().integer().positive().optional(),
  });
  return schema.validate(data);
}

export {
  userinputvalidation,
  validateSalesPayload,
  reversalDetails,
  expenseInput,
  expenseUpdateInput,
  rejectionReasonInput,
  analyticsQuery,
};