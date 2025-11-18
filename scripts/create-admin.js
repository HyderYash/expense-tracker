/**
 * Script to create an admin user
 * 
 * Usage:
 * npm run create-admin <email> <password> <name>
 * 
 * Example:
 * npm run create-admin admin@example.com password123 "Admin User"
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
  console.log('📄 Loaded environment variables from .env');
} else {
  console.log('⚠️  .env file not found at:', envPath);
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: npm run create-admin <email> <password> <name>');
    console.error('Example: npm run create-admin admin@example.com password123 "Admin User"');
    process.exit(1);
  }

  const [email, password, name] = args;

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('Error: MONGODB_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('⚠️  User already exists. Updating to admin role...');
      existingUser.role = 'admin';
      existingUser.password = await bcrypt.hash(password, 10);
      await existingUser.save();
      console.log('✅ User updated to admin successfully!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name,
        role: 'admin',
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();
