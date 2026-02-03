import express from "express"

const router = express.Router();

import verifyUser from "../../middleware/verification.js"
import {
    Authorization, generalAuthorization

} from "../../middleware/Authorization.js";


import {
    handleBulkDistibution, handleReversal
} from "../controllers/distribution-management-controller.js"



router.post("/bulk-distribution", verifyUser, Authorization, handleBulkDistibution)
router.post("/reversal-distribution", verifyUser, generalAuthorization, handleReversal)

export default router;