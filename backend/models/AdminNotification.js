const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  type: {
    type: String,
    default: "LOW_STOCK",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "AdminNotification",
  adminNotificationSchema
);