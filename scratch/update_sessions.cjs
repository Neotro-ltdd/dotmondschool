const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/pages/dashboard/finance/PointOfSale.tsx',
  'src/pages/dashboard/finance/ProxyPaymentUpload.tsx',
  'src/pages/dashboard/finance-setup/ClassFees.tsx',
  'src/pages/dashboard/finance-setup/FinanceFeeBuilder.tsx',
  'src/pages/dashboard/students/Students.tsx',
  'src/pages/dashboard/teacher/ContinuousAssessment.tsx',
  'src/pages/dashboard/teacher/MyClass.tsx',
  'src/pages/dashboard/teacher/TeacherResults.tsx',
  'src/pages/dashboard/teacher/Utilities.tsx',
  'src/pages/dashboard/admin/operations/SessionOperation.tsx',
  'src/pages/dashboard/admin/operations/Templates.tsx',
  'src/pages/dashboard/admin/operations/TermSetup.tsx',
  'src/pages/dashboard/reports/Reports.tsx'
];

filesToUpdate.forEach(file => {
  const p = path.join(process.cwd(), file.replace(/\\\\/g, '/'));
  if (!fs.existsSync(p)) return;
  
  let content = fs.readFileSync(p, 'utf8');
  
  const depth = file.split('/').length - 2;
  const hookPath = '../'.repeat(depth) + 'hooks/useActiveTerm';
  
  let modified = false;
  
  if (!content.includes('useActiveTerm')) {
    content = content.replace(/(import React.*?;\n)/, `$1import { useActiveTerm } from '${hookPath}';\n`);
  }
  
  const r1 = /const\s+\[filterSession,\s*setFilterSession\]\s*=\s*useState(?:<string>)?\(.*?\);\s*const\s+\[filterTerm,\s*setFilterTerm\]\s*=\s*useState(?:<string>)?\(.*?\);/g;
  if (r1.test(content)) {
    content = content.replace(r1, 'const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();');
    modified = true;
  }
  
  const r2 = /const\s+\[posSession,\s*setPosSession\]\s*=\s*useState(?:<string>)?\(.*?\);\s*const\s+\[posTerm,\s*setPosTerm\]\s*=\s*useState(?:<string>)?\(.*?\);/g;
  if (r2.test(content)) {
    content = content.replace(r2, 'const { session: posSession, term: posTerm, setSession: setPosSession, setTerm: setPosTerm } = useActiveTerm();');
    modified = true;
  }

  const r3 = /const\s+\[session,\s*setSession\]\s*=\s*useState(?:<string>)?\(.*?\);\s*const\s+\[term,\s*setTerm\]\s*=\s*useState(?:<string>)?\(.*?\);/g;
  if (r3.test(content)) {
    content = content.replace(r3, 'const { session, term, setSession, setTerm } = useActiveTerm();');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated ' + file);
  }
});
