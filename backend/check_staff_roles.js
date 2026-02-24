
const mongoose = require('mongoose');
require('dotenv').config();
const Staff = require('./models/Staff');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
        const staff = await Staff.find({});
        console.log('Staff members:', staff.map(s => ({ email: s.email, role: s.role })));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
