const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", authMiddleware, productController.getProducts);
router.post("/", authMiddleware, productController.addProduct);
router.patch("/:id/stock", authMiddleware, productController.updateStock);

module.exports = router;
