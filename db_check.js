import 'dotenv/config';
import mongoose from 'mongoose';
import Employee from './backend/models/Employee.js';
import AnalysisResult from './backend/models/AnalysisResult.js';

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplestat');
        console.log('Connected to DB');
        
        const empCount = await Employee.countDocuments();
        const resCount = await AnalysisResult.countDocuments();
        
        console.log(`Employees: ${empCount}`);
        console.log(`Analysis Results: ${resCount}`);
        
        if (resCount > 0) {
            const first = await AnalysisResult.findOne();
            console.log('Sample Analysis Result:', JSON.stringify(first, null, 2));
        } else {
            console.log('No analysis results found.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

check();
