const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project();
project.addSourceFilesAtPaths('src/**/*.tsx');
project.addSourceFilesAtPaths('src/**/*.ts');
const sourceFiles = project.getSourceFiles();
let modifiedCount = 0;

for (const sourceFile of sourceFiles) {
  if (sourceFile.getBaseName() === 'DialogContext.tsx' || sourceFile.getBaseName() === 'App.tsx') {
    continue;
  }

  let madeChanges = false;
  let needsShowConfirm = false;
  let needsShowAlert = false;

  // Find all CallExpressions
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    const exprText = expression.getText();

    if (exprText === 'alert' || exprText === 'window.alert') {
      expression.replaceWithText('showAlert');
      needsShowAlert = true;
      madeChanges = true;
    } else if (exprText === 'confirm' || exprText === 'window.confirm') {
      // Find the closest containing function and make it async if it's not BEFORE replacing
      const func =
        callExpr.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ||
        callExpr.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ||
        callExpr.getFirstAncestorByKind(SyntaxKind.MethodDeclaration) ||
        callExpr.getFirstAncestorByKind(SyntaxKind.FunctionExpression);

      if (func && !func.isAsync()) {
        func.setIsAsync(true);
      }

      callExpr.replaceWithText(
        'await showConfirm(' +
          callExpr
            .getArguments()
            .map((a) => a.getText())
            .join(', ') +
          ')',
      );
      needsShowConfirm = true;
      madeChanges = true;
    }
  }

  if (madeChanges) {
    // Find the main React component in the file to inject the hook
    // Typically the default export or a function declaration with a capitalized name
    const functions = sourceFile.getFunctions();
    let mainComponent = sourceFile.getDefaultExportSymbol()?.getDeclarations()[0];

    if (!mainComponent && functions.length > 0) {
      mainComponent = functions.find(
        (f) => f.getName() && f.getName()[0] === f.getName()[0].toUpperCase(),
      );
    }

    if (mainComponent && mainComponent.isKind(SyntaxKind.FunctionDeclaration)) {
      const body = mainComponent.getBody();
      if (body && body.isKind(SyntaxKind.Block)) {
        // Check if useDialog is already injected
        if (!body.getText().includes('useDialog()')) {
          const hooksToExtract = [];
          if (needsShowAlert) hooksToExtract.push('showAlert');
          if (needsShowConfirm) hooksToExtract.push('showConfirm');

          body.insertStatements(0, `const { ${hooksToExtract.join(', ')} } = useDialog();`);
        }
      }
    } else {
      // Handle Arrow functions like const MyComponent = () => { ... }
      const arrowFuncs = sourceFile
        .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
        .filter(
          (vd) =>
            vd.getName()[0] === vd.getName()[0].toUpperCase() &&
            vd.getInitializerIfKind(SyntaxKind.ArrowFunction),
        );

      if (arrowFuncs.length > 0) {
        const arrowFunc = arrowFuncs[0].getInitializerIfKind(SyntaxKind.ArrowFunction);
        const body = arrowFunc.getBody();
        if (body && body.isKind(SyntaxKind.Block)) {
          if (!body.getText().includes('useDialog()')) {
            const hooksToExtract = [];
            if (needsShowAlert) hooksToExtract.push('showAlert');
            if (needsShowConfirm) hooksToExtract.push('showConfirm');
            body.insertStatements(0, `const { ${hooksToExtract.join(', ')} } = useDialog();`);
          }
        }
      }
    }

    // Add import statement for useDialog
    const currentFilePath = sourceFile.getFilePath();
    const dialogContextPath = path.resolve(__dirname, 'src/context/DialogContext');
    let relativePath = path
      .relative(path.dirname(currentFilePath), dialogContextPath)
      .replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

    sourceFile.addImportDeclaration({
      namedImports: ['useDialog'],
      moduleSpecifier: relativePath,
    });

    console.log(`Updated ${sourceFile.getBaseName()}`);
    modifiedCount++;
  }
}

project.saveSync();
console.log(`Finished refactoring. Modified ${modifiedCount} files.`);
