import Employee from "../models/Employee.js";
import xlsx from "xlsx";

export const addEmployee = async (req, res) => {
  try {
    const emp = await Employee.create(req.body);
    res.json({ success: true, data: emp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    // Add backward compatibility for frontend pages expecting .scores object
    const formattedData = employees.map(emp => {
      const obj = emp.toObject();
      obj.scores = {
        productivity: obj.productivity || 0,
        utilization: obj.utilization || 0,
        fitment: obj.fitmentScore || 0,
        fatigue: obj.fatigueScore || 0,
        fitmentScore: obj.fitmentScore || 0,
        automationPotential: obj.automationPotential || 0
      };
      return obj;
    });
    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadBulkEmployees = async (req, res) => {
  try {
    let employees = [];

    // Parse from file buffer (CSV/XLSX)
    if (req.file) {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      employees = xlsx.utils.sheet_to_json(worksheet);
    } else if (req.body.employees && Array.isArray(req.body.employees)) {
      employees = req.body.employees;
    }

    if (employees.length === 0) {
      return res.status(400).json({ error: 'No employee data found in upload.' });
    }

    const savedEmployees = [];
    for (const emp of employees) {
      try {
        const userid = emp.userid || `EMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const emailToFind = emp.email || emp.Email || emp.EMAIL;
        
        if (!emailToFind) continue;

        const employeeDoc = await Employee.findOneAndUpdate(
          { email: emailToFind },
          {
            userid,
            name: emp.name || emp.Name || emp.NAME,
            email: emailToFind,
            department: emp.department || emp.Department || '',
            position: emp.position || emp.Position || '',
            salary: parseInt(emp.salary || emp.Salary) || 0,
            productivity: parseInt(emp.productivity || emp.Productivity) || 0,
            utilization: parseInt(emp.utilization || emp.Utilization) || 0,
            fitmentScore: parseFloat(emp.fitmentScore || emp.Fitment || 0),
            updatedAt: new Date(),
          },
          { 
            upsert: true, 
            new: true,
            runValidators: false 
          }
        );
        
        savedEmployees.push(employeeDoc);
      } catch (err) {
        console.error(`Error saving employee record:`, err.message);
      }
    }

    res.json({
      success: true,
      insertedCount: savedEmployees.length,
      employees: savedEmployees,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const obj = employee.toObject();
    obj.scores = {
      productivity: obj.productivity || 0,
      utilization: obj.utilization || 0,
      fitment: obj.fitmentScore || 0,
      fatigue: obj.fatigueScore || 0,
      fitmentScore: obj.fitmentScore || 0,
      automationPotential: obj.automationPotential || 0
    };
    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Employee.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.findByIdAndDelete(id);
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const employees = await Employee.find();
    
    if (employees.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalEmployees: 0,
          avgFitmentScore: 0,
          avgProductivity: 0,
          avgUtilization: 0,
          highPerformers: 0,
          lowUtilization: 0,
        },
      });
    }

    const formattedData = employees.map(emp => {
      const obj = emp.toObject();
      obj.scores = {
        productivity: obj.productivity || 0,
        utilization: obj.utilization || 0,
        fitment: obj.fitmentScore || 0,
        fatigue: obj.fatigueScore || 0,
        fitmentScore: obj.fitmentScore || 0,
        automationPotential: obj.automationPotential || 0
      };
      return obj;
    });

    const totalEmployees = employees.length;
    const avgFitmentScore = employees.reduce((sum, e) => sum + (e.fitmentScore || 0), 0) / totalEmployees;
    const avgProductivity = employees.reduce((sum, e) => sum + (e.productivity || 0), 0) / totalEmployees;
    const avgUtilization = employees.reduce((sum, e) => sum + (e.utilization || 0), 0) / totalEmployees;
    const highPerformers = employees.filter(e => (e.productivity || 0) > 90).length;
    const lowUtilization = employees.filter(e => (e.utilization || 0) < 50).length;

    res.json({
      success: true,
      stats: {
        totalEmployees,
        avgFitmentScore: parseFloat(avgFitmentScore.toFixed(2)),
        avgProductivity: parseFloat(avgProductivity.toFixed(2)),
        avgUtilization: parseFloat(avgUtilization.toFixed(2)),
        highPerformers,
        lowUtilization,
      },
      employees: formattedData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
