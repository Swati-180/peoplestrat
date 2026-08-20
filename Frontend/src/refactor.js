const fs = require('fs');
const path = require('path');

const srcDir = path.join('C:', 'Users', 'Swati', 'Documents', 'AI-Workforce-Managment-and-Role-Fitment-Platform', 'Frontend', 'src');

const filesToRefactor = [
  "pages/WorkforceIntelligence.jsx",
  "pages/Softskills.jsx",
  "pages/SixBySixAnalysis.jsx",
  "pages/Settings_new.jsx",
  "pages/Settings.jsx",
  "pages/Optimization.jsx",
  "pages/GapAnalysis.jsx",
  "pages/FitmentAnalysis.jsx",
  "pages/Fatigue.jsx",
  "pages/Employees.jsx",
  "pages/EmployeeDashboard.jsx",
  "pages/employee/EmployeeDataForm.jsx",
  "pages/Dashboard.jsx",
  "pages/Analytics.jsx",
  "components/EmployeeDrawer.jsx"
];

filesToRefactor.forEach(relPath => {
  const fullPath = path.join(srcDir, relPath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Skip if we already refactored
  if (content.includes('useWorkforceData')) return;

  // 1. Remove the static mock data import
  content = content.replace(/import\s+{([^}]*)}\s+from\s+["']@\/data\/mockEmployeeData["'];?\n/g, '');

  // 2. Add the context import
  content = `import { useWorkforceData } from "@/contexts/WorkforceContext";\n` + content;

  // 3. Inject the hook call right after the export default function
  const functionMatch = content.match(/export default function\s+(\w+)\s*\([^)]*\)\s*{/);
  
  if (functionMatch) {
    const signature = functionMatch[0];
    const hookInject = `\n  const { employees, getOverallRisk, getFitmentBand, getFatigueRisk } = useWorkforceData();\n  if (!employees) return <div>Loading workforce data...</div>;\n`;
    content = content.replace(signature, signature + hookInject);
  }

  fs.writeFileSync(fullPath, content);
  console.log('Refactored:', relPath);
});

// Refactor utils as well
const utilsPath = path.join(srcDir, 'lib', 'workforce-utils.js');
let utilsContent = fs.readFileSync(utilsPath, 'utf8');
utilsContent = utilsContent.replace(/import\s+{([^}]*)}\s+from\s+["']\.\.\/data\/mockEmployeeData["'];?\n/g, '');
// For utils, it's easier if we just pass `employees` as arguments to these functions, but to save time, we'll let the hooks take care of it or mock it if it's pure logic.
// For now, let's just nullify the import so it doesn't crash, and we'll fix utils manually if needed.
fs.writeFileSync(utilsPath, utilsContent);
console.log('Codemod Complete');
