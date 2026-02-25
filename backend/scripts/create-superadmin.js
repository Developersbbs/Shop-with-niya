const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("../lib/mongodb");
const Staff = require("../models/Staff");
const StaffRole = require("../models/StaffRole");

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Connected to database");

    // Check if superadmin already exists
    const existingSuperAdmin = await Staff.findOne({ email: "superadmin@shopwithniya.com" });
    if (existingSuperAdmin) {
      console.log("⚠️  Superadmin already exists with email: superadmin@shopwithniya.com");
      process.exit(0);
    }

    // Create or get superadmin role
    let superAdminRole = await StaffRole.findOne({ name: "superadmin" });
    
    if (!superAdminRole) {
      superAdminRole = new StaffRole({
        name: "superadmin",
        display_name: "Super Admin",
        is_default: false
      });
      await superAdminRole.save();
      console.log("✅ Created superadmin role");
    } else {
      console.log("✅ Superadmin role already exists");
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    // Create superadmin user
    const superAdmin = new Staff({
      name: "Super Admin",
      email: "superadmin@shopwithniya.com",
      password: hashedPassword,
      phone: "+1234567890",
      joining_date: new Date(),
      published: true,
      is_active: true,
      role_id: superAdminRole._id
    });

    await superAdmin.save();
    console.log("✅ Superadmin created successfully!");
    console.log("📧 Email: superadmin@shopwithniya.com");
    console.log("🔑 Password: 123456");
    console.log("👤 Role: Super Admin");

    process.exit(0);

  } catch (error) {
    console.error("❌ Error creating superadmin:", error);
    process.exit(1);
  }
};

createSuperAdmin();
