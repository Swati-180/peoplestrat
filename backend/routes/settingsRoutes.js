import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

// Get all settings
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.find({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update or create a setting
router.put("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category, description } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key },
      { value, category, description, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
