//authorization middleware for role
import { checkRole } from "../helpers/authorisation.js";


import { AuthorizationError } from "../../src/Utils/app-error.js";
const Authorization = (req, res, next) => {

    if (!checkRole(req.user.role, ["superuser", "manager"])) {
        return next(new AuthorizationError("You are not authorized to access this resource"));
    }
    next();
}

export { Authorization }