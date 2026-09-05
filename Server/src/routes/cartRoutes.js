const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.get("/:sessionId", cartController.getCart);
router.post("/:sessionId/item", cartController.addToCart);
router.delete("/:sessionId/item/:productId", cartController.removeFromCart);
router.post("/:sessionId/clear", cartController.clearCart);

module.exports = router;
