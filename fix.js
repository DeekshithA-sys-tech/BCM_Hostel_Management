const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fix() {
    await mongoose.connect('mongodb://127.0.0.1:27017/hostel_db');
    const db = mongoose.connection.db;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    await db.collection('users').updateOne({ email: 'admin@hostel.com' }, { $set: { password: hash, role: 'admin' } }, { upsert: true });
    console.log('Fixed');
    process.exit(0);
}
fix();
