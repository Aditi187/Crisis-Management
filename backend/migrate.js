const db = require('./config/db');

async function migrate() {
    try {
        console.log("Checking donations table...");
        await db.query(`ALTER TABLE donations ADD COLUMN payment_method VARCHAR(20) DEFAULT 'razorpay'`);
        console.log("Added payment_method column.");
    } catch(e) { console.log(e.message); }

    try {
        await db.query(`ALTER TABLE donations ADD COLUMN upi_reference VARCHAR(100)`);
        console.log("Added upi_reference column.");
    } catch(e) { console.log(e.message); }
    
    console.log("Migration finished.");
    process.exit(0);
}

migrate();
