/**
 * Seed Script — Creates initial Admin and Support accounts
 * 
 * Run once from the backend directory:
 *   node seed.js
 * 
 * You can edit the accounts below before running.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
const User = require('./models/User');

// Force Google DNS — fixes ECONNREFUSED on routers that don't support SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const seedUsers = [
    {
        name: 'Admin User',
        email: 'admin@helpdesk.com',
        password: 'Admin@1234',
        role: 'admin'
    },
    {
        name: 'Support Agent',
        email: 'support@helpdesk.com',
        password: 'Support@1234',
        role: 'support'
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        for (const userData of seedUsers) {
            const exists = await User.findOne({ email: userData.email });

            if (exists) {
                console.log(`⚠️  Skipped — "${userData.email}" already exists (role: ${exists.role})`);
                continue;
            }

            // Hash password manually (the pre-save hook will also run — that's fine)
            const user = new User(userData);
            await user.save(); // triggers bcrypt pre-save hook

            console.log(`✅ Created ${userData.role}: ${userData.email} / ${userData.password}`);
        }

        console.log('\n🎉 Seeding complete! Use the credentials above to log in.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
};

seed();
