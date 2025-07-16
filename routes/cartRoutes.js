import express from 'express';
import Product from '../models/ProductModel.js';

const router = express.Router();

router.post("/", async (req, res) => {
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