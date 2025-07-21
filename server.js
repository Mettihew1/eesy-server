import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import env from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Config
env.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Change CORS to this:
app.use(cors({
  // origin: 'http://localhost:5173', // Your exact frontend URL
  origin: 'https://www.eesy.ir',
  credentials: true,
  exposedHeaders: ['set-cookie'] // Add this line
}));



// Test Route (Can be removed in production)
app.get("/set-cookie", (req, res) => {
  res.cookie("test_cookie", "hello_world", {
    maxAge: 86400000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
  });
  res.json({ message: "Cookie set successfully" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/search", searchRoutes);
app.use("/cart", cartRoutes);
app.use("/admin", adminRoutes);





// Just Check
app.get("/", (req, res) => {
  res.json("Success")
})

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // Exit if DB connection fails
  });


// Error Handling Middleware (Should be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// Server Start
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} | ${process.env.NODE_ENV || "development"} mode`)
);
