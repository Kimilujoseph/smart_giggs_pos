// middleware/error-handler.js
import { STATUS_CODE } from "../Utils/app-error.js";

const ErrorHandler = (err, req, res, next) => {
  console.error("Error message", {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  const statusCode = err.statusCode || STATUS_CODE.INTERNAL_ERROR;
  const message = err.message || "Internal Server Error";

  if (err.name === 'ValidationError') {
    return res.status(STATUS_CODE.BAD_REQUEST).json({ "status": STATUS_CODE.BAD_REQUEST, "message": err.message });
  }
  if (err.name === 'NotFoundError') {
    return res.status(STATUS_CODE.NOT_FOUND).json({ "status": STATUS_CODE.NOT_FOUND, "message": err.message });
  }
  if (err.name === 'AuthorizationError') {
    return res.status(STATUS_CODE.FORBIDDEN).json({ "status": STATUS_CODE.FORBIDDEN, "message": err.message });
  }

  if (err.name === 'AuthenticationError') {
    return res.status(STATUS_CODE.UNAUTHORIZED).json({ "status": STATUS_CODE.UNAUTHORIZED, "message": err.message });
  }

  if (err.name === 'Duplicate Key Error') {
    return res.status(STATUS_CODE.BAD_REQUEST).json({ "status": STATUS_CODE.BAD_REQUEST, "message": err.message });
  }
  // Send the error response
  res.status(statusCode).json({
    status: statusCode,
    message: message,
  });
};

export { ErrorHandler };
