import mongoose from 'mongoose';
import EmployeeResume from '../models/employeeResume.js';
import OrganizationMembership from '../models/OrganizationMembership.js';

async function runMigration() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('ERROR: MONGO_URI environment variable is required.');
    process.exit(1);
  }

  // Enforce no localhost fallback if intended for production
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
     console.warn('WARNING: Running against local database.');
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('Connected.');

  console.log('Starting Phase 5A Resume Organization Migration...');

  const report = {
    totalScanned: 0,
    alreadyMapped: 0,
    migrated: 0,
    unmappable: 0,
    ambiguous: 0,
    errors: 0
  };

  const resumes = await EmployeeResume.find({});
  report.totalScanned = resumes.length;

  for (const resume of resumes) {
    try {
      if (resume.organizationId) {
        report.alreadyMapped++;
        continue;
      }

      // Find active memberships for this user
      const memberships = await OrganizationMembership.find({ 
        userId: resume.userId, 
        status: 'active' 
      });

      if (memberships.length === 1) {
        resume.organizationId = memberships[0].organizationId;
        await resume.save();
        report.migrated++;
      } else if (memberships.length === 0) {
        report.unmappable++;
      } else {
        report.ambiguous++;
      }
    } catch (err) {
      console.error(`Error processing resume ${resume._id}:`, err);
      report.errors++;
    }
  }

  console.log('Migration Complete. Summary:');
  console.table(report);

  console.log('Enforcing indexes...');
  try {
    await EmployeeResume.createIndexes();
    console.log('Indexes created successfully.');
  } catch (err) {
    console.error('Failed to create indexes. Potential duplicate data exists:', err.message);
  }

  await mongoose.disconnect();
}

runMigration().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
