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

  // Skip if already modified
  if (content.includes('useWorkforceData')) return;

  // 1. Remove mock import
  content = content.replace(/import\s+{([^}]*)}\s+from\s+["']@\/data\/mockEmployeeData["'];?\n/g, '');

  content = `import { useWorkforceData } from "@/contexts/WorkforceContext";\n` + content;

  // 2. Inject hook Call logic
  const hookInject = `\n  const { employees, getOverallRisk, getFitmentBand, getFatigueRisk } = useWorkforceData();\n  if (!employees) return <div>Loading workforce data...</div>;\n`;

  // Function signature 1: export default function X() {
  const functionMatch = content.match(/export default function\s+(\w+)\s*\([^)]*\)\s*{/);
  if (functionMatch) {
    content = content.replace(functionMatch[0], functionMatch[0] + hookInject);
  } else {
    // Function signature 2: export default function() {
    const anonMatch = content.match(/export default function\s*\([^)]*\)\s*{/);
    if (anonMatch) {
      content = content.replace(anonMatch[0], anonMatch[0] + hookInject);
    } else {
      // Function signature 3: const X = () => {
      const arrowMatch = content.match(/const\s+(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*=>\s*{/);
      if (arrowMatch) {
        content = content.replace(arrowMatch[0], arrowMatch[0] + hookInject);
      }
    }
  }

  // 3. Specifically fix references to `centralEmployees` or `initialEmployees` to just `employees` since we alias
  content = content.replace(/centralEmployees/g, 'employees');
  content = content.replace(/initialEmployees/g, 'employees');

  fs.writeFileSync(fullPath, content);
  console.log('Refactored:', relPath);
});

console.log('Codemod Complete');
