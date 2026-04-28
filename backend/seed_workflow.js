const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Room = require('./src/models/Room');
const Cot = require('./src/models/Cot');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Complaint = require('./src/models/Complaint');

async function seed() {
    await mongoose.connect('mongodb://127.0.0.1:27017/hostel_db');
    await mongoose.connection.db.dropDatabase();
    console.log('Task 0: Database Dropped.');

    const hash = await bcrypt.hash('Password123!', 10);
    
    // 1. Create Admin
    const adminUser = await User.create({ name: 'Chief Warden', email: 'admin@hostel.com', password: hash, role: 'admin' });
    console.log('Admin logged in.');

    // Task 1: Add 3 rooms and 5 cots each
    console.log('Task 1: Adding 3 rooms with 5 cots...');
    for (let i = 1; i <= 3; i++) {
        const room = await Room.create({ roomNumber: `10${i}`, floor: 1, block: 'A', totalCots: 5, type: 'general' });
        for (let j = 1; j <= 5; j++) {
            await Cot.create({ cotNumber: `C${j}`, roomId: room._id });
        }
    }

    // Task 2: Login as student - add 4 students in each room
    console.log('Task 2: Adding 12 students (4 per room)...');
    const rooms = await Room.find();
    let stuCount = 1;
    let s1 = null; // Save reference to Student 1

    for (const room of rooms) {
        const cots = await Cot.find({ roomId: room._id }).limit(4);
        for (const cot of cots) {
            const stuUser = await User.create({ name: `Student ${stuCount}`, email: `student${stuCount}@hostel.com`, password: hash, role: 'student' });
            
            const student = await Student.create({
                userId: stuUser._id,
                sspId: `SSP100${stuCount}`,
                mobile: `987654321${stuCount % 10}`.padEnd(10, '0'),
                course: 'B.Tech',
                year: 2,
                institution: 'NIT',
                verificationStatus: 'approved',
                cotId: cot._id
            });
            await Cot.findByIdAndUpdate(cot._id, { studentId: student._id, isOccupied: true });
            
            if (stuCount === 1) s1 = student;
            stuCount++;
        }
    }

    // Task 3: Update 1 student details
    console.log('Task 3: Student 1 updates profile (pending)...');
    s1.proposedUpdates = { mobile: '9999999999' };
    await s1.save();

    // Task 4: Admin approves the update request
    console.log('Task 4: Admin approves the profile update...');
    s1.mobile = s1.proposedUpdates.mobile;
    s1.proposedUpdates = null;
    await s1.save();

    // Task 5: Student sends complaint
    console.log('Task 5: Student 1 sends a complaint...');
    const complaint = await Complaint.create({
        studentId: s1._id,
        subject: 'Fan not working',
        description: 'The ceiling fan in my room is making loud noise and not spinning.',
        category: 'maintenance',
        priority: 'high',
        statusHistory: [{ status: 'open', changedBy: s1.userId }]
    });

    // Task 6: Warden replies to complaint
    console.log('Task 6: Admin replies to the complaint...');
    complaint.status = 'resolved';
    complaint.resolution = 'Electrician has been dispatched. Should be fixed by evening.';
    complaint.resolvedAt = new Date();
    complaint.statusHistory.push({ status: 'resolved', changedBy: adminUser._id, remarks: 'Replied' });
    await complaint.save();

    console.log('--- ALL TASKS COMPLETED SUCCESSFULLY! ---');
    console.log('You can now log in at http://localhost:5173');
    console.log('Admin: admin@hostel.com / Password123!');
    console.log('Student 1: student1@hostel.com / Password123!');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
