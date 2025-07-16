import express from 'express';
import Product from '../models/ProductModel.js';

const router = express.Router();

router.get("/", async (req, res) => { 
  try {
    const search = req.query.q;

    if (!search?.trim()) {
      return res.status(400).json({ 
        error: "Please provide a valid search term" 
      });
    }

    const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const products = await Product.find({
      $or: [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } }
      ]
    }).limit(20);

    res.json({
      count: products.length,
      results: products.length ? products : "No products found"
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ 
      error: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
});

export default router;