import express from 'express';
import Product from '../models/ProductModel.js';

const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    // 1. Get user ID from token
    const userId = req.user._id; // From your auth middleware
    const { productId } = req.body;

    console.log(userId, productId, 'can you see me?');
    

    // 2. Update user's cart array (no duplicates)
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { cart: productId } }, // $addToSet prevents duplicates
      { new: true }
    );

    res.send("Product added to cart");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.post("/", async (req, res) => {
  console.log('see me ? req.bod', req.body);
  
  try {
    const { cId } = req.body;
    if (!cId?.length) return res.status(400).json({ error: "Product IDs required" });
    
    const cart = await Product.find({ _id: { $in: cId } });
    res.json(cart);
  } catch (err) {
    console.error("Cart error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;