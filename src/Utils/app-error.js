// Utils/app-error.js
class AppError extends Error {
  constructor(
    name,
    statusCode,
    description,
    isOperational = true,
    errorStack = "",
    logingErrorResponse = false
  ) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorStack = errorStack;
    this.logError = logingErrorResponse;
    Error.captureStackTrace(this);
  }
}

class APIError extends AppError {
  constructor(
    name,
    statusCode = 500,
    description = "Internal Server Error",
    isOperational = true
  ) {
    super(name, statusCode, description, isOperational);
  }
}

class ValidationError extends APIError {
  constructor(
    description, fieldErrors = {}
  ) {
    super("ValidationError", 400, description, true);
    this.fieldErrors = fieldErrors;
  }
}


class NotFoundError extends APIError {
  constructor(
    description
  ) {
    super("NotFoundError", 404, description, true);
  }
}

class AuthorizationError extends APIError {
  constructor(
    description
  ) {
    super("AuthorizationError", 403, description, true);
  }
}

class AuthenticationError extends APIError {
  constructor(
    description
  ) {
    super("AuthenticationError", 401, description, true);
  }
}

class DuplicationError extends APIError {
  constructor(
    description
  ) {
    super("Duplicate Key Error", 400, description, true);
  }
}

class InternalServerError extends APIError {
  constructor(
    description = "Internal Server Error"
  ) {
    super("InternalServerError", 500, description, true);
  }
}

const STATUS_CODE = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export { AppError, APIError, STATUS_CODE, ValidationError, NotFoundError, AuthorizationError, AuthenticationError, DuplicationError, InternalServerError };
