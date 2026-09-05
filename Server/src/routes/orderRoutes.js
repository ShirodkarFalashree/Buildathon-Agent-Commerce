const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/", orderController.getOrders);
router.get("/session/:sessionId", orderController.getSessionOrders);
router.get("/:orderId", orderController.getOrderById);

module.exports = router;
