import express from 'express';
import Product from '../models/ProductModel.js';

const router = express.Router();

// Add sample products
router.get("/add", async (req, res) => {
  try {
    await Product.insertMany([
      // Your sample product data here
    ]);
    res.json("Sample products added successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product by ID
router.get("/product", async (req, res) => {
  const { id } = req.query; 
  
  if (!id) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Product search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      count: products.length,
      results: products
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search products
router.get("/search", async (req, res) => { // Changed to GET as it's more RESTful
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