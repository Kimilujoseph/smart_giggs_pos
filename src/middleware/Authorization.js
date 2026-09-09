//authorization middleware for role
import { checkRole } from "../helpers/authorisation.js";


import { AuthorizationError } from "../../src/Utils/app-error.js";
const Authorization = (req, res, next) => {
    //console.log("User Role:", req.user.role); // Debugging line to check user role
    if (!checkRole(req.user.role, ["superuser", "manager","stockist"])) {
        return next(new AuthorizationError("You are not authorized to access this resource"));
    }
    next();
}

const generalAuthorization = (req, res, next) => {
    if (!checkRole(req.user.role, ["superuser", "manager", "seller","stockist"])) {
        return next(new AuthorizationError("You are not authorized "))
    }
    next();
}

const confirmationAuthorization =(req,res,next) => {
    if(!checkRole(req.user.role,['seller'])){
        return next(new Authorization("you are not Authorized to confirm stock"))
    }
    next()
}
const paymentAuthorization = (req,res,next) =>{
    if(!checkRole(req.user.role,['superUser'])){
        return next(new AuthorizationError("You are not authorized to pay commission"))
    }
    next()
}
const authorizeFinancials = (req, res, next) => {
    if (!checkRole(req.user.role, ["manager", "superuser"])) {
        return res.status(403).json({ message: "You are not authorized to view financial reports." });
    }
    next();
};

const expenseManagementAuthorization = (req,res,next) => {
    if(!checkRole(req.user.role,['manager','superuser'])){
        return next (new AuthorizationError('You are not allowed to manager expenses'))
    }
    next()
}
export { Authorization, generalAuthorization, authorizeFinancials,confirmationAuthorization,paymentAuthorization,expenseManagementAuthorization }