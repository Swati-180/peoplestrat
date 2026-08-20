import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import JobDescription from '../models/jobDescriptions.js';
import cvUploads from '../models/cvUploads.js';
import ActivityUpload from '../models/activityUploads.js';
import Employee from '../models/Employee.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import { runAnalysis } from './analysisController.js';
import { PassThrough } from 'stream';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import bcrypt from 'bcryptjs';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Mock parsing functions (replace with real parsing libraries later)
const parseJD = (buffer, filename) => {
  // Mock JD parsing - in real implementation, use pdf-parse or mammoth
  const mockData = {
    title: "Software Engineer",
    description: "We are looking for a skilled software engineer with experience in JavaScript, React, and Node.js.",
    department: "Engineering",
    requiredSkills: ["JavaScript", "React", "Node.js"],
    preferredSkills: ["TypeScript", "AWS"],
    experienceRequired: 3,
    responsibilities: ["Develop web applications", "Collaborate with team", "Write clean code"],
    location: "Remote"
  };
  return mockData;
};

const parseCV = (buffer, filename) => {
  // Mock CV parsing - in real implementation, use pdf-parse or mammoth
  const mockData = {
    candidateName: "John Doe",
    email: "john.doe@example.com",
    skills: ["JavaScript", "React", "Node.js", "Python"],
    experience: "5 years of software development experience",
    education: "Bachelor's in Computer Science"
  };
  return mockData;
};

const parseActivityCSV = (buffer, filename) => {
  // Mock CSV parsing - in real implementation, use csv-parser
  const mockActivities = [
    {
      user: "john@company.com",
      activityType: "meeting",
      date: new Date("2025-01-15"),
      durationMinutes: 60,
      tower: "Engineering",
      category: "Development"
    },
    {
      user: "jane@company.com",
      activityType: "coding",
      date: new Date("2025-01-15"),
      durationMinutes: 120,
      tower: "Engineering",
      category: "Development"
    }
  ];
  return mockActivities;
};

// Upload JD
export const uploadJD = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const parsedData = parseJD(req.file.buffer, req.file.originalname);

    const jd = new JobDescription({
      jdId: `JD_${Date.now()}`,
      title: parsedData.title,
      department: parsedData.department,
      location: parsedData.location,
      requiredSkills: parsedData.requiredSkills,
      preferredSkills: parsedData.preferredSkills,
      experienceRequired: parsedData.experienceRequired,
      responsibilities: parsedData.responsibilities,
      createdBy: req.user?.id // Assuming auth middleware sets req.user
    });

    await jd.save();

    res.json({
      success: true,
      jobDescription: parsedData
    });
  } catch (error) {
    console.error('JD upload error:', error);
    res.status(500).json({ error: 'Failed to upload job description' });
  }
};

// Upload CV
export const uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const parsedData = parseCV(req.file.buffer, req.file.originalname);

    const cv = new cvUploads({
      candidateName: parsedData.candidateName,
      email: parsedData.email,
      skills: parsedData.skills,
      experience: parsedData.experience,
      education: parsedData.education,
      uploadedAt: new Date(),
      uploadedBy: req.user?.id
    });

    await cv.save();

    res.json({
      success: true,
      cv: parsedData
    });
  } catch (error) {
    console.error('CV upload error:', error);
    res.status(500).json({ error: 'Failed to upload CV' });
  }
};

// Upload Activity Data
export const uploadActivity = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const activities = parseActivityCSV(req.file.buffer, req.file.originalname);

    // Save all activities
    const savedActivities = await ActivityUpload.insertMany(
      activities.map(activity => ({
        ...activity,
        uploadedBy: req.user?.id
      }))
    );

    res.json({
      success: true,
      count: savedActivities.length,
      activities: activities.slice(0, 10) // Return first 10 for preview
    });
  } catch (error) {
    console.error('Activity upload error:', error);
    res.status(500).json({ error: 'Failed to upload activity data' });
  }
};

// Parse employee data from different file formats
const parseEmployeeData = (buffer, filename) => {
  const fileExtension = filename.split('.').pop().toLowerCase();

  if (fileExtension === 'csv') {
    return new Promise((resolve, reject) => {
      const results = [];
      const bufferStream = new PassThrough();
      bufferStream.end(buffer);

      bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } else if (fileExtension === 'json') {
    const jsonString = buffer.toString('utf8');
    return JSON.parse(jsonString);
  } else if (fileExtension === 'pdf') {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await pdf(buffer);
        const text = data.text;
        // Simple heuristic table parser for PDF text
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const results = [];
        let headers = [];
        
        // Basic table detection: look for lines with multiple spaces or tabs
        lines.forEach((line, index) => {
          const parts = line.split(/\s{2,}/); // Split by 2+ spaces
          if (parts.length > 3) {
            if (headers.length === 0) {
              headers = parts.map(h => h.toLowerCase().replace(/\s+/g, '_'));
            } else {
              const obj = {};
              parts.forEach((val, i) => {
                if (headers[i]) obj[headers[i]] = val;
              });
              results.push(obj);
            }
          }
        });
        
        // Fallback: If no table detected, try to regex extract any "Employee Name: X" etc.
        if (results.length === 0) {
           const names = text.match(/Name:\s*([^\n]+)/gi);
           const emails = text.match(/Email:\s*([^\n]+)/gi);
           if (names && emails) {
             names.forEach((n, i) => {
               results.push({
                 name: n.replace(/Name:\s*/i, '').trim(),
                 email: emails[i] ? emails[i].replace(/Email:\s*/i, '').trim() : ''
               });
             });
           }
        }

        resolve(results);
      } catch (err) {
        reject(err);
      }
    });
  } else {
    throw new Error('Unsupported file format. Please upload CSV, Excel (.xlsx/.xls), JSON, or PDF files.');
  }
};

// Upload Employee Data
export const uploadEmployeeData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const rawData = await parseEmployeeData(req.file.buffer, req.file.originalname);

    // Normalize data - handle both array and single object
    const employees = Array.isArray(rawData) ? rawData : [rawData];

    const savedEmployees = [];
    const errors = [];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      try {
        // Generate userid if not provided
        const userid = emp.userid || emp.userId || emp.id || `EMP_${Date.now()}_${i}`;

        // Validate required fields
        if (!emp.name && !emp.Name && !emp.email && !emp.Email) {
          errors.push(`Row ${i + 1}: Missing required fields (name and email)`);
          continue;
        }

        const name = emp.name || emp.Name || emp.employee_name || 'New Employee';
        const rawEmail = (emp.email || emp.Email || emp.employee_email || '').trim().toLowerCase();
        const email = rawEmail || `${name.toLowerCase().replace(/\s+/g, '')}@employee.com`;
        
        // Pass1234 hashed
        const defaultPassword = await bcrypt.hash('pass1234', 10);

        const employeeDoc = await Employee.findOneAndUpdate(
          { email },
          {
            userid,
            name,
            email,
            password: defaultPassword, // Default password for new/updated employees
            role: 'employee',
            department: emp.department || emp.Department || '',
            process_area: emp.process || emp.process_area || emp.Process || '',
            position: emp.position || emp.Position || emp.role || emp.Role || '',
            band: emp.band || emp.Band || 'D3',
            salary: emp.salary || emp.Salary ? parseInt(emp.salary || emp.Salary) : 0,
            experience_years: emp.experience_years || emp.experience || 0,
            location: emp.location || emp.Location || 'Remote',
            updatedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
            runValidators: false
          }
        );

        // Map Performance Data if present
        if (emp.tasks_completed || emp.expected_tasks || emp.overtime_hours || emp.error_rate) {
          await PerformanceRecord.create({
            employee_id: employeeDoc._id,
            tasks_completed: parseInt(emp.tasks_completed || 0),
            expected_tasks: parseInt(emp.expected_tasks || 1),
            working_hours: parseFloat(emp.working_hours || 8),
            overtime_hours: parseFloat(emp.overtime_hours || 0),
            error_rate: parseFloat(emp.error_rate || 0),
            department_process: employeeDoc.process_area || 'Default',
            record_date: new Date()
          });
        }

        savedEmployees.push(employeeDoc);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    // Trigger AI Analysis Pipeline after data ingestion
    console.log(`Triggering auto-analysis for ${savedEmployees.length} records...`);
    try {
       // Mock req/res for runAnalysis
       await runAnalysis({ query: {} }, { status: () => ({ json: () => {} }) });
    } catch (analysisErr) {
       console.error('Post-upload analysis failed:', analysisErr);
    }

    // Get updated stats after upload
    const totalEmployees = await Employee.countDocuments();
    const allEmployees = await Employee.find();
    const avgFitmentScore = allEmployees.length > 0 ? allEmployees.reduce((sum, e) => sum + (e.fitmentScore || 0), 0) / allEmployees.length : 0;
    const avgProductivity = allEmployees.length > 0 ? allEmployees.reduce((sum, e) => sum + (e.productivity || 0), 0) / allEmployees.length : 0;
    const avgUtilization = allEmployees.length > 0 ? allEmployees.reduce((sum, e) => sum + (e.utilization || 0), 0) / allEmployees.length : 0;
    const highPerformers = allEmployees.filter(e => (e.productivity || 0) > 90).length;
    const lowUtilization = allEmployees.filter(e => (e.utilization || 0) < 50).length;

    res.json({
      success: true,
      count: savedEmployees.length,
      totalEmployees,
      employees: savedEmployees.slice(0, 10), // Return first 10 for preview
      analysis: {
        totalEmployees,
        avgFitmentScore: parseFloat(avgFitmentScore.toFixed(2)),
        avgProductivity: parseFloat(avgProductivity.toFixed(2)),
        avgUtilization: parseFloat(avgUtilization.toFixed(2)),
        highPerformers,
        lowUtilization,
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Employee data upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload employee data' });
  }
};

// Get upload stats
export const getUploadStats = async (req, res) => {
  try {
    const jdCount = await JobDescription.countDocuments();
    const cvCount = await cvUploads.countDocuments();
    const activityCount = await ActivityUpload.countDocuments();
    const employeeCount = await Employee.countDocuments();

    const stats = [
      { type: 'jd', count: jdCount },
      { type: 'cv', count: cvCount },
      { type: 'activity', count: activityCount },
      { type: 'employee', count: employeeCount }
    ];

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get upload stats' });
  }
};

// Export multer middleware
export const uploadMiddleware = upload.single('file');
