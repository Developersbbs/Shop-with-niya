const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification"); // ← make sure this path is correct


router.get("/test", async (req, res) => {
  res.json({ success: true, message: "Notifications route is working!" });
});

// GET all notifications

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ created_at: -1 })
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET unread count
router.get("/count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ is_read: false });
    res.json({ success: true, data: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single
router.get("/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create
router.post("/", async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update (mark as read)
router.put("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!notification)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/clear/all", async (req, res) => {
  await Notification.deleteMany({});
  res.json({ success: true, message: "All cleared" });
});



module.exports = router;