const fs = require('fs');

const files = [
    'src/pages/dashboard/academics/Classes.tsx',
    'src/pages/dashboard/admin/GateAttendanceLog.tsx',
    'src/pages/dashboard/admin/ManualClearance.tsx',
    'src/pages/dashboard/admin/operations/ClassAllocations.tsx',
    'src/pages/dashboard/admin/operations/SubjectAllocations.tsx',
    'src/pages/dashboard/finance-setup/ClassFees.tsx',
    'src/pages/dashboard/students/Students.tsx'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add to level mapping if it exists
    content = content.replace(/'Lower Primary': 4,/g, "'Lower Primary': 4,\n    'Middle Primary': 5,");
    content = content.replace(/'Upper Primary': 5,/g, "'Upper Primary': 6,");
    
    // Add to includes arrays
    content = content.replace(/'Upper Primary', 'Lower Primary'/g, "'Upper Primary', 'Middle Primary', 'Lower Primary'");
    
    // Add to select options
    content = content.replace(/<option value="Lower Primary">Lower Primary<\/option>/g, '<option value="Lower Primary">Lower Primary</option>\n            <option value="Middle Primary">Middle Primary</option>');
    content = content.replace(/<option value="Lower Primary" style=\{\{ color: '#000' \}\}>Lower Primary<\/option>/g, '<option value="Lower Primary" style={{ color: \'#000\' }}>Lower Primary</option>\n                  <option value="Middle Primary" style={{ color: \'#000\' }}>Middle Primary</option>');

    fs.writeFileSync(file, content);
}
console.log('Done replacing frontend files.');
