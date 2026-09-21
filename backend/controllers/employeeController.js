import Employee from "../models/Employee.js";
import User from "../models/User.js";
import OrganizationMembership from "../models/OrganizationMembership.js";
import xlsx from "xlsx";

export const addEmployee = async (req, res) => {
  try {
    req.body.organizationId = req.organizationId;
    const emp = await Employee.create(req.body);
    res.json({ success: true, data: emp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      search = '', 
      department = '', 
      fitmentMin = 0, 
      fitmentMax = 100,
      sortBy = 'name',
      sortDir = 'asc'
    } = req.query;

    if (!req.organizationId) {
      return res.status(401).json({ success: false, error: 'Organization context required' });
    }

    const query = { organizationId: req.organizationId };
    
    // Status filter
    const statusFilter = req.query.status || 'Active';
    if (statusFilter !== 'all') {
      query.status = statusFilter === 'Terminated' ? 'Terminated' : 'Active';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { userid: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) {
      query.department = department;
    }
    
    // Fitment score filtering
    const minFit = parseInt(fitmentMin, 10);
    const maxFit = parseInt(fitmentMax, 10);
    if (!isNaN(minFit) && !isNaN(maxFit) && (minFit > 0 || maxFit < 100)) {
      query.fitmentScore = { $gte: minFit, $lte: maxFit };
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortDir === 'desc' ? -1 : 1;
    }

    const limitVal = limit === 'all' ? 0 : parseInt(limit, 10) || 15;
    const pageVal = parseInt(page, 10) || 1;
    const skip = limitVal === 0 ? 0 : (pageVal - 1) * limitVal;

    const total = await Employee.countDocuments(query);
    
    let employeesQuery = Employee.find(query).sort(sortOptions);
    if (limitVal > 0) {
      employeesQuery = employeesQuery.skip(skip).limit(limitVal);
    }
    const employees = await employeesQuery;

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
    
    const paginationLimit = limitVal === 0 ? total : limitVal;
    
    res.json({ 
      success: true, 
      data: formattedData,
      pagination: {
        total,
        page: pageVal,
        limit: paginationLimit,
        totalPages: paginationLimit > 0 ? Math.ceil(total / paginationLimit) : 1
      }
    });
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
          { email: emailToFind, organizationId: req.organizationId },
          {
            organizationId: req.organizationId,
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
    const employee = await Employee.findOne({ _id: id, organizationId: req.organizationId });
    
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
    const updated = await Employee.findOneAndUpdate({ _id: id, organizationId: req.organizationId }, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.findOneAndDelete({ _id: id, organizationId: req.organizationId });
    if (!deleted) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const statusFilter = req.query.status || 'Active';
    const query = { organizationId: req.organizationId };
    if (statusFilter !== 'all') {
      query.status = statusFilter === 'Terminated' ? 'Terminated' : 'Active';
    }
    
    const employees = await Employee.find(query);
    
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

export const terminateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      { status: 'Terminated' },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found in your organization.' });
    }

    if (employee.email) {
      const user = await User.findOne({ email: employee.email.toLowerCase() });
      if (user) {
        const membership = await OrganizationMembership.findOne({ userId: user._id, organizationId: req.organizationId });
        if (membership && membership.status === 'active') {
          membership.status = 'inactive';
          membership.deactivatedByTermination = true;
          await membership.save();
        }
      }
    }

    res.json({ success: true, data: employee, message: 'Employee terminated successfully. Organization access revoked.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOneAndUpdate(
      { _id: id, organizationId: req.organizationId },
      { status: 'Active' },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found in your organization.' });
    }

    if (employee.email) {
      const user = await User.findOne({ email: employee.email.toLowerCase() });
      if (user) {
        const membership = await OrganizationMembership.findOne({ userId: user._id, organizationId: req.organizationId });
        if (membership && membership.deactivatedByTermination === true) {
          membership.status = 'active';
          membership.deactivatedByTermination = false;
          await membership.save();
        }
      }
    }

    res.json({ success: true, data: employee, message: 'Employee reactivated successfully. Organization access restored.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
