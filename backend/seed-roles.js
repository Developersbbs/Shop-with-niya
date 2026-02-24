require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./lib/mongodb");
const StaffRole = require("./models/StaffRole");

const seedRoles = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB...");

        const roles = [
            { name: "super_admin", display_name: "Super Admin", is_default: false },
            { name: "admin", display_name: "Admin", is_default: true },
            { name: "staff", display_name: "Staff", is_default: false },
        ];

        for (const roleData of roles) {
            const exists = await StaffRole.findOne({ name: roleData.name });
            if (!exists) {
                await StaffRole.create(roleData);
                console.log(`Created role: ${roleData.display_name}`);
            } else {
                console.log(`Role exists: ${roleData.display_name}`);
            }
        }

        console.log("Role seeding completed.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding roles:", error);
        process.exit(1);
    }
};

seedRoles();
