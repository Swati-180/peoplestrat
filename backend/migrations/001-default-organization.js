import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';

const runMigration = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/peoplestrat_local';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for Migration');

    // 1. Create or Find Default Organization
    // Using 'name' as the stable identifier for the default org
    const orgName = 'PeopleStrat Default';
    let defaultOrg = await Organization.findOne({ name: orgName });
    
    if (!defaultOrg) {
      defaultOrg = new Organization({
        name: orgName,
        status: 'active'
      });
      await defaultOrg.save();
      console.log(`Created default organization: ${orgName} (${defaultOrg._id})`);
    } else {
      console.log(`Found existing default organization: ${orgName} (${defaultOrg._id})`);
    }

    // 2. Find all existing users
    const users = await User.find({});
    console.log(`Found ${users.length} total users.`);

    let membershipsCreated = 0;
    let membershipsExisted = 0;

    // 3. Create memberships safely
    for (const user of users) {
      const existingMembership = await OrganizationMembership.findOne({
        userId: user._id,
        organizationId: defaultOrg._id
      });

      if (!existingMembership) {
        const membership = new OrganizationMembership({
          userId: user._id,
          organizationId: defaultOrg._id,
          role: user.role || 'employee', // Fallback to employee if role is missing
          status: 'active'
        });
        await membership.save();
        membershipsCreated++;
      } else {
        membershipsExisted++;
      }
    }

    console.log('Migration Complete.');
    console.log(`- Users processed: ${users.length}`);
    console.log(`- Memberships created: ${membershipsCreated}`);
    console.log(`- Memberships already existed: ${membershipsExisted}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runMigration();
