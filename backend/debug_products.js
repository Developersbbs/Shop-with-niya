const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
        console.log('Connected to DB');

        const products = await Product.find({}).limit(10);
        console.log(`Found ${products.length} products`);

        products.forEach(p => {
            console.log('---');
            console.log(`Name: ${p.name}`);
            console.log(`Structure: ${p.product_structure}`);
            console.log(`Nature: ${p.product_nature}`);
            console.log(`Published (Root): ${p.published}`);
            console.log(`Product Type: ${p.product_type}`);
            console.log(`File Path: ${p.file_path}`);
            if (p.product_variants && p.product_variants.length > 0) {
                console.log(`Variants: ${p.product_variants.length}`);
                p.product_variants.forEach((v, i) => {
                    console.log(`  V${i}: Published: ${v.published}, SKU: ${v.sku}`);
                });
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
