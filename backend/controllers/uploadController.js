import multer from 'multer';
import { PDFExtract } from 'pdf.js-extract';
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
const pdfLib = require('pdf-parse');
const pdf = async (buffer) => {
  if (typeof pdfLib === 'function') {
    return await pdfLib(buffer);
  } else if (pdfLib.PDFParse) {
    const instance = new pdfLib.PDFParse(new Uint8Array(buffer));
    return await instance.getText();
  }
  throw new Error('Unsupported pdf-parse version');
};
import bcrypt from 'bcryptjs';
import Groq from 'groq-sdk';

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
      organizationId: req.organizationId,
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
      organizationId: req.organizationId,
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
        organizationId: req.organizationId,
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
          { email, organizationId: req.organizationId },
          {
            organizationId: req.organizationId,
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
    const totalEmployees = await Employee.countDocuments({ organizationId: req.organizationId });
    const allEmployees = await Employee.find({ organizationId: req.organizationId });
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
    const jdCount = await JobDescription.countDocuments({ organizationId: req.organizationId });
    const cvCount = await cvUploads.countDocuments({ organizationId: req.organizationId });
    const activityCount = await ActivityUpload.countDocuments({ organizationId: req.organizationId });
    const employeeCount = await Employee.countDocuments({ organizationId: req.organizationId });

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

// Phase 2: Extract Resume Data (Preview)
export const extractResumeData = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ success: false, error: 'Only PDF files are supported' });
    if (req.file.size > 5 * 1024 * 1024) return res.status(400).json({ success: false, error: 'File size exceeds 5MB limit' });



    // 1. Extract raw text from PDF
    let text = "";
    try {
      const data = await pdf(req.file.buffer);
      text = data.text || "";
    } catch (err) {
      console.log(`pdf-parse failed: ${err.message}`);
    }

    if (text.trim().length < 50) {
      try {
        const pdfExtract = new PDFExtract();
        const data = await new Promise((resolve, reject) => {
          pdfExtract.extractBuffer(req.file.buffer, {}, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });

        let fallbackText = "";
        if (data && data.pages) {
          data.pages.forEach((page, i) => {
            fallbackText += `\nPAGE ${i+1} TEXT:\n`;
            if (page.content) {
              page.content.forEach(item => {
                fallbackText += item.str + " ";
              });
              fallbackText += "\n";
            }
          });
        }
        text = fallbackText;
      } catch (err) {
        console.log(`pdf.js-extract fallback error:`, err);
      }
    }



    if (!text || text.trim().length < 50) {
      return res.status(400).json({ success: false, error: 'Unreadable or empty PDF file. Please ensure it contains selectable text.' });
    }

    let extractedData = {
      personal: { name: null, email: null, phone: null, location: null, address: null },
      professional: { currentRole: null, department: null },
      education: [],
      workExperience: [],
      skills: { technical: [], soft: [], tools: [], languages: [] },
      projects: [],
      certifications: [],
      achievements: [],
      awards: [],
      publications: [],
      volunteerExperience: []
    };
    let usedGroq = false;

    // 2. Try Groq AI extraction
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const promptSchema = `{
  "personal": {
    "name": "string|null",
    "email": "string|null",
    "phone": "string|null",
    "location": "string|null",
    "linkedin": "string|null",
    "github": "string|null"
  },
  "professional": {
    "currentRole": "string|null",
    "department": "string|null"
  },
  "education": [{ "degree": "string|null", "institution": "string|null", "field": "string|null", "startDate": "string|null", "endDate": "string|null", "grade": "string|null" }],
  "workExperience": [
    {
      "jobTitle": "string|null",
      "company": "string|null",
      "location": "string|null",
      "startDate": "string|null",
      "endDate": "string|null",
      "isCurrent": boolean,
      "description": ["string"],
      "achievements": ["string"],
      "technologies": ["string"]
    }
  ],
  "skills": ["string"],
  "projects": [
    {
      "name": "string|null",
      "description": ["string"],
      "technologies": ["string"],
      "role": "string|null"
    }
  ],
  "certifications": ["string"],
  "achievements": ["string"],
  "training": ["string"]
}`;
        const aiInput = text.substring(0, 5000);


        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: `Extract the candidate's complete profile from the resume text. Do not invent information. Use null or empty arrays if missing. Respond ONLY with a valid JSON object matching exactly this structure:\n${promptSchema}` },
            { role: "user", content: aiInput }
          ],
          model: "openai/gpt-oss-120b",
          temperature: 0,
        });

        let content = completion.choices[0]?.message?.content || "";


        content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(content);

        if (parsed && typeof parsed === 'object') {
          // STEP 2: NO DEMO FALLBACKS. Map exactly what is in parsed.

          // Map workExperience description to responsibilities if frontend modal expects it
          const mappedWorkExp = (parsed.workExperience || []).map(job => ({
            ...job,
            responsibilities: job.description || job.responsibilities || []
          }));

          // Map skills flat array to object if frontend modal expects it
          let mappedSkills = parsed.skills || [];
          if (Array.isArray(mappedSkills)) {
            mappedSkills = { technical: mappedSkills, soft: [], tools: [], languages: [] };
          }

          extractedData = {
            personal: { ...extractedData.personal, ...(parsed.personal || {}) },
            professional: { ...extractedData.professional, ...(parsed.professional || {}) },
            education: parsed.education || [],
            workExperience: mappedWorkExp,
            skills: mappedSkills,
            projects: parsed.projects || [],
            certifications: parsed.certifications || [],
            achievements: parsed.achievements || [],
            training: parsed.training || []
          };
          usedGroq = true;
        }
      } catch (err) {
        console.error("Groq extraction failed:", err.message);
      }
    }

    // 3. DO NOT use demo strings in fallback. If it fails, return error if strict.
    // We are NOT falling back to any dummy data.
    if (!usedGroq) {
      console.log("AI Extraction failed or was not used. Returning default/empty structure without dummy data.");
    }

    res.json({
      success: true,
      data: extractedData,
      method: usedGroq ? 'ai' : 'deterministic'
    });

  } catch (error) {
    console.error('Resume extraction error:', error);
    res.status(500).json({ success: false, error: 'Failed to extract resume data' });
  }
};

// Phase 2: Verify & Save Resume
export const verifyAndSaveResume = async (req, res) => {
  try {
    const { personal, professional, education, workExperience, projects, certifications, achievements, skills, experience_years } = req.body;

    // Find authenticated employee
    const email = req.user?.email;
    if (!email) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const emp = await Employee.findOne({ email, organizationId: req.organizationId });
    if (!emp) return res.status(404).json({ success: false, error: 'Employee not found' });

    // Update Personal Info
    if (personal) {
      if (personal.name) emp.name = personal.name;
      if (personal.location) emp.location = personal.location;
      if (personal.phone) emp.phone = personal.phone;
    }

    // Update Professional Info & Skills
    if (professional) {
      if (professional.currentRole) {
        emp.currentRole = professional.currentRole;
        emp.position = professional.currentRole;
      }
      if (professional.department) emp.department = professional.department;

      const incomingSkills = professional.skills || [];
      if (Array.isArray(incomingSkills)) {
        const currentSkills = emp.skills || [];
        const newSkills = incomingSkills.filter(s => typeof s === 'string').map(s => s.trim());
        emp.skills = [...new Set([...currentSkills, ...newSkills])];
      }
    }

    // Also support fallback raw skills array
    if (req.body.skills) {
      const currentSkills = emp.skills || [];
      let newSkills = [];

      if (Array.isArray(req.body.skills)) {
        newSkills = req.body.skills.filter(s => typeof s === 'string').map(s => s.trim());
      } else if (typeof req.body.skills === 'object') {
        const { technical = [], soft = [], tools = [], languages = [] } = req.body.skills;
        newSkills = [...technical, ...soft, ...tools, ...languages].filter(s => typeof s === 'string').map(s => s.trim());
      }

      emp.skills = [...new Set([...currentSkills, ...newSkills])];
    }

    // Update Work Experience
    if (workExperience && Array.isArray(workExperience)) {
      emp.workExperience = workExperience.map(w => ({
        company: w.company,
        jobTitle: w.role || w.jobTitle,
        location: w.location,
        startDate: w.startDate ? new Date(w.startDate) : null,
        endDate: w.endDate ? new Date(w.endDate) : null,
        isCurrent: Boolean(w.isCurrent),
        responsibilities: Array.isArray(w.responsibilities) ? w.responsibilities : [],
        achievements: Array.isArray(w.achievements) ? w.achievements : [],
        skills: Array.isArray(w.technologies) ? w.technologies : []
      }));
    }

    if (education && Array.isArray(education)) {
      emp.education = education;
    }
    if (projects && Array.isArray(projects)) {
      emp.projects = projects.map(p => ({
        ...p,
        description: Array.isArray(p.description) ? p.description.join('\n') : p.description
      }));
    }
    if (certifications && Array.isArray(certifications)) {
      emp.certifications = certifications;
    }
    if (achievements && Array.isArray(achievements)) {
      emp.achievements = achievements;
    }



    emp.updatedAt = new Date();
    await emp.save();



    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: emp.name,
        location: emp.location,
        currentRole: emp.currentRole,
        skills: emp.skills,
        experience_years: emp.experience_years,
        workExperience: emp.workExperience
      }
    });
  } catch (error) {
    console.error('Resume verification error:', error);
    res.status(500).json({ success: false, error: 'Failed to save resume data' });
  }
};
