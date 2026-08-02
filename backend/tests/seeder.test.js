const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { seedAdmin } = require('../src/utils/seeder');
const User = require('../src/models/User');
const { ROLES } = require('../src/utils/constants');

describe('seedAdmin', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    process.env.ADMIN_EMAIL = 'admin@hostel.com';
    process.env.ADMIN_PASSWORD = 'Admin@123456';
  });

  it('creates an admin user when no admin exists', async () => {
    await seedAdmin();

    const admin = await User.findOne({ email: 'admin@hostel.com' });
    expect(admin).toBeTruthy();
    expect(admin.role).toBe(ROLES.ADMIN);
    expect(admin.isActive).toBe(true);
  });

  it('restores the admin user when the existing admin record is missing or stale', async () => {
    await User.create({
      email: 'admin@hostel.com',
      password: 'old-hash',
      name: 'Old Admin',
      role: ROLES.STUDENT,
      isActive: false
    });

    await seedAdmin();

    const admin = await User.findOne({ email: 'admin@hostel.com' });
    expect(admin.role).toBe(ROLES.ADMIN);
    expect(admin.isActive).toBe(true);
    expect(admin.name).toBe('System Administrator');
  });
});
