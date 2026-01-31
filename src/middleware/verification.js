import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import config from "../Config/index.js";
const { APP_SECRET } = config;
import { AuthenticationError } from "../../src/Utils/app-error.js";
const verifyUser = async (req, res, next) => {
    const token = req.cookies.usertoken;
    console.log("token", token)
    if (token) {
        try {
            jwt.verify(token, APP_SECRET, (err, user) => {
                if (err) return next(new AuthenticationError("Invalid token, authentication failed"));
                req.user = user;
                next();
            });
        } catch (error) {
            res.status(500).send("Internal server error");
        }
    } else {
        return res.status(401).json({ message: "not authorised" })
    }
};

export default verifyUser;
