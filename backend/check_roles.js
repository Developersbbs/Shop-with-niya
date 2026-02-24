
const mongoose = require('mongoose');
require('dotenv').config();
const StaffRole = require('./models/StaffRole');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
        const roles = await StaffRole.find({});
        console.log('Staff Roles:', roles);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
