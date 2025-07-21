import express from 'express';
import Product from '../models/ProductModel.js';

const router = express.Router();

// Toggle featured status (PUT /products/:id/featured)
router.put('/:id/featured', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    
    product.featured = !product.featured; // Flips true/false
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
