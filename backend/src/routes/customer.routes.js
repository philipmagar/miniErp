const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware, customerController.getCustomers);
router.post("/", authMiddleware, customerController.addCustomer);
router.patch("/:id/balance", authMiddleware, customerController.updateBalance);

module.exports = router;
