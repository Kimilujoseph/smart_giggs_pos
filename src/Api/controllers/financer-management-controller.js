import { FinancerService } from "../../services/financer-service.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const financerService = new FinancerService();

const createFinancer = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, contactName, phone, email, address } = req.body;
    const newFinancer = await financerService.createFinancer({
      name,
      contactName,
      phone,
      email,
      address,
    });
    res.status(201).json({ message: "Financer created successfully", data: newFinancer });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const getFinancerById = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const financer = await financerService.getFinancerById(id);
    res.status(200).json({ data: financer });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const getAllFinancers = async (req, res, next) => {
  try {
    const user = req.user;
    const financers = await financerService.getAllFinancers();
    res.status(200).json({ data: financers });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const updateFinancer = async (req, res, next) => {
  try {
    const user = req.user;
    if (!["superuser", "manager"].includes(user.role)) {
      throw new APIError(
        "Unauthorized",
        STATUS_CODE.UNAUTHORIZED,
        "Not authorized to update financers"
      );
    }
    const { id } = req.params;
    const updates = req.body;
    const updatedFinancer = await financerService.updateFinancer(id, updates);
    res.status(200).json({ message: "Financer updated successfully", data: updatedFinancer });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message, error: true });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error", error: true });
    }
  }
};

const deleteFinancer = async (req, res, next) => {
  try {
    const user = req.user;
    if (!["superuser", "manager"].includes(user.role)) {
      throw new APIError(
        "Unauthorized",
        STATUS_CODE.UNAUTHORIZED,
        "Not authorized to delete financers"
      );
    }
    const { id } = req.params;
    const result = await financerService.deleteFinancer(id);
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
  createFinancer,
  getFinancerById,
  getAllFinancers,
  updateFinancer,
  deleteFinancer,
};
