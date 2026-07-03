import bcrypt from 'bcryptjs';
import User from './models/User.js';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './db.js';
import dotenv from 'dotenv';

export async function seedDatabase() {
  try {
    console.log('Clearing database collections for a fresh start...');
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`- Cleared: ${collection.collectionName}`);
    }

    const adminEmail = 'admin@pmautomobiles.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log(`Admin user with email ${adminEmail} already exists. Skipping seed.`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

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
    console.log('Admin Password: admin123');
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
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  };
  
  runSeed();
}
