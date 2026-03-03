
const express = require("express");
const router = express.Router();
const AdminNotification = require("../models/AdminNotification");

// Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await AdminNotification
      .find()
      .sort({ createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get("/unread-count", async (req, res) => {
  try {
    const count = await AdminNotification.countDocuments({ isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark as read
router.put("/:id/read", async (req, res) => {
  try {
    await AdminNotification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

// Get unread count
router.get("/unread-count", async (req, res) => {
  try {
    const count = await AdminNotification.countDocuments({ isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark as read
router.put("/:id/read", async (req, res) => {
  try {
    await AdminNotification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;