const API = 'http://localhost:5000/api/v1';

async function req(method, endpoint, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) {
        if (data.errors) console.error(JSON.stringify(data.errors, null, 2));
        throw { status: res.status, data };
    }
    return data;
}

async function run() {
    console.log('--- STARTING WORKFLOW SIMULATION ---');

    console.log('Registering/Logging in Admin...');
    let adminToken = '';
    const adminUser = 'admin@hostel.com';
    
    try {
        await req('POST', '/auth/register', { name: 'Chief Warden', email: adminUser, password: 'Password123!', role: 'admin', sspId: 'ADMIN001' });
    } catch(e) {}
    
    const adminLogin = await req('POST', '/auth/login', { email: adminUser, password: 'Password123!' });
    adminToken = adminLogin.data.token;
    console.log('Admin logged in.');

    console.log('Task 1: Adding 3 rooms with 5 cots...');
    const rooms = [];
    for (let i = 1; i <= 3; i++) {
        try {
            const res = await req('POST', '/rooms', { roomNumber: `10${i}`, floor: 1, block: 'A', totalCots: 5, type: 'general' }, adminToken);
            rooms.push(res.data.room);
        } catch(e) {
            if (e.status === 400 || e.status === 409) {
               const ex = await req('GET', '/rooms', null, adminToken);
               rooms.push(ex.data.rooms.find(r => r.roomNumber === `10${i}`) || ex.data.rooms[0]);
               continue;
            }
            console.error('Error creating room', i);
        }
    }
    console.log(`Created/Fetched ${rooms.length} rooms.`);

    console.log('Task 2: Adding 12 students (4 per room)...');
    const studentsData = [];
    for (let i = 1; i <= 12; i++) {
        let stuToken = '';
        const dynTS = Date.now();
        const email = `student${i}_${dynTS}@hostel.com`;
        
        await req('POST', '/auth/register', { name: `Student ${i}`, email, password: 'Password123!', role: 'student', sspId: `SSP9900${dynTS}${i}` });
        const login = await req('POST', '/auth/login', { email, password: 'Password123!' });
        stuToken = login.data.token;
        
        try {
            await req('PUT', '/students/me', {
                sspId: `SSP9900${dynTS}${i}`,
                mobile: `987654321${i % 10}`.padEnd(10, '0'),
                course: 'B.Tech',
                year: 2,
                institution: 'NIT'
            }, stuToken);
        } catch(e) {}

        const profileReq = await req('GET', '/auth/me', null, stuToken);
        studentsData.push({ id: profileReq.data.user.studentId, token: stuToken, userId: profileReq.data.user._id });
    }
    
    console.log('Admin approving 12 students to allow allocation...');
    for (const st of studentsData) {
        if(st.id) await req('PUT', `/admin/students/verify/${st.id}`, { action: 'approve' }, adminToken);
    }

    console.log('Allocating 4 students per room...');
    let studentIndex = 0;
    const allRoomsRes = await req('GET', '/rooms', null, adminToken);
    for (const rm of allRoomsRes.data.rooms) {
        let allocations = 0;
        for (const cot of rm.cots) {
            if (!cot.isOccupied && allocations < 4 && studentIndex < 12) {
                await req('POST', '/rooms/allocate', { cotId: cot._id, studentId: studentsData[studentIndex].id }, adminToken);
                allocations++;
                studentIndex++;
            }
        }
    }

    console.log('Task 3: Student 1 updates profile...');
    await req('PUT', '/students/me', { mobile: '9999999999' }, studentsData[0].token);

    console.log('Task 4: Admin approves the profile update...');
    await req('PUT', `/admin/students/verify/${studentsData[0].id}`, { action: 'approve' }, adminToken);

    console.log('Task 5: Student 1 sends a complaint...');
    const compRes = await req('POST', '/complaints', {
        subject: 'Fan not working',
        description: 'The ceiling fan in my room is making loud noise and not spinning.',
        category: 'electrical',
        priority: 'high'
    }, studentsData[0].token);
    const complaintId = compRes.data.complaint._id;

    console.log('Task 6: Admin replies to the complaint...');
    await req('PUT', `/complaints/${complaintId}/status`, {
        status: 'resolved',
        resolution: 'Electrician has been dispatched. Should be fixed by evening.'
    }, adminToken);

    console.log('--- ALL TASKS COMPLETED SUCCESSFULLY! ---');
}

run().catch(console.error);
