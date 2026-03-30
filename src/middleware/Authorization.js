//authorization middleware for role
import { checkRole } from "../helpers/authorisation.js";


import { AuthorizationError } from "../../src/Utils/app-error.js";
const Authorization = (req, res, next) => {
    //console.log("User Role:", req.user.role); // Debugging line to check user role
    if (!checkRole(req.user.role, ["superuser", "manager"])) {
        return next(new AuthorizationError("You are not authorized to access this resource"));
    }
    next();
}

const generalAuthorization = (req, res, next) => {
    if (!checkRole(req.user.role, ["superuser", "manager", "seller"])) {
        return next(new AuthorizationError("You are not authorized "))
    }
    next();
}

const authorizeFinancials = (req, res, next) => {
    if (!checkRole(req.user.role, ["manager", "superuser"])) {
        return res.status(403).json({ message: "You are not authorized to view financial reports." });
    }
    next();
};

export { Authorization, generalAuthorization, authorizeFinancials }