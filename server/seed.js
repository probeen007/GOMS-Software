import bcrypt from 'bcryptjs';
import User from './models/User.js';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './db.js';
import dotenv from 'dotenv';

export async function seedDatabase(forceClear = false) {
  try {
    if (forceClear) {
      console.log('Clearing database collections for a fresh start...');
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
        console.log(`- Cleared: ${collection.collectionName}`);
      }
    }

    const adminEmail = 'admin@pmautomobiles.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log(`Admin user with email ${adminEmail} already exists. Skipping seed.`);
      return;
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
      console.warn(
        '[SECURITY WARNING] No ADMIN_PASSWORD env var set — seeding the initial admin account with the ' +
        'well-known default password "admin123". Set ADMIN_PASSWORD in your environment before first deploy, ' +
        'or log in and change this password immediately.'
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      name: 'System Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('----------------------------------------');
    console.log('Database seeded successfully!');
    console.log(`Admin Email: ${adminEmail}`);
    console.log(process.env.ADMIN_PASSWORD ? 'Admin Password: (set via ADMIN_PASSWORD env var)' : 'Admin Password: admin123 (default — please change)');
    console.log('----------------------------------------');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Self-run check (if executing directly from node command line)
if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].endsWith('seed'))) {
  const runSeed = async () => {
    dotenv.config();
    await connectDB();
    await seedDatabase(true); // Force clear when manually running seed script
    await disconnectDB();
    process.exit(0);
  };
  
  runSeed();
}
