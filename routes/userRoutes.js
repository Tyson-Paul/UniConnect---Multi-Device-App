import express from "express";
import User from "../models/userModel.js";

const router = express.Router();

// SIGNUP
router.post("/", async (req, res) => {
  const { name, email, password, phone, dateofBirth } = req.body;

  if (!name || !email || !password || !phone || !dateofBirth) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if email or phone already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or phone already registered" });
    }

    const newUser = new User({ name, email, password, phone, dateofBirth });
    await newUser.save();

    res.status(201).json({ message: "User created successfully", name: newUser.name });
  } catch (err) {
    console.error("Signup Error:", err.message); // Log error for debugging
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    if (user.password !== password)
      return res.status(400).json({ message: "Invalid email or password" });

    res.json({ message: "Login successful", name: user.name });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

export default router;
