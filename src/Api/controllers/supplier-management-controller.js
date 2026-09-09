import { SupplierService } from "../../services/supplier-service.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const supplierService = new SupplierService();

const createSupplier = async (req, res, next) => {
  try {
    const user = req.user;
    
    const { name, contactName, phone, email, address } = req.body;
    const newSupplier = await supplierService.createSupplier({
      name,
      contactName,
      phone,
      email,
      address,
    });
    res.status(201).json({ message: "Supplier created successfully", data: newSupplier });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById(id);
    res.status(200).json({ data: supplier });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const getAllSuppliers = async (req, res, next) => {
  try {
    const user = req.user;
   
   
    const suppliers = await supplierService.getAllSuppliers();
    res.status(200).json({ data: suppliers });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const user = req.user;
   
    const { id } = req.params;
    const updates = req.body;
    const updatedSupplier = await supplierService.updateSupplier(id, updates);
    res.status(200).json({ message: "Supplier updated successfully", data: updatedSupplier });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const result = await supplierService.deleteSupplier(id);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

export {
  createSupplier,
  getSupplierById,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
};
