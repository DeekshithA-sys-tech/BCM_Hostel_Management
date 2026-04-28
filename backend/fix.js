const mongoose = require('./node_modules/mongoose');
const bcrypt = require('./node_modules/bcryptjs');

async function fix() {
    await mongoose.connect('mongodb://127.0.0.1:27017/hostel_db');
    const db = mongoose.connection.db;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    await db.collection('users').updateOne({ email: 'admin@hostel.com' }, { $set: { password: hash, role: 'admin' } }, { upsert: true });
    // Also remove unique index that caused errors initially if it exists
    try { await db.collection('users').dropIndex('email_1'); } catch(e){}
    try { await db.collection('users').dropIndex('userId_1'); } catch(e){}
    try { await db.collection('students').dropIndex('sspId_1'); } catch(e){}
    try { await db.collection('rooms').dropIndex('roomNumber_1'); } catch(e){}
    console.log('Fixed DB successfully');
    process.exit(0);
}
fix().catch(err => { console.error(err); process.exit(1); });
