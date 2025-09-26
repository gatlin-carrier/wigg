#!/usr/bin/env tsx
import { Project, SyntaxKind } from 'ts-morph';

function usage() {
  console.log('Usage: tsx scripts/codemods/migrate-fetch-to-data-layer.ts <glob ...>');
}

async function main() {
  const patterns = process.argv.slice(2);
  if (patterns.length === 0) {
    usage();
    process.exit(1);
  }

  const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
  const sourceFiles = project.addSourceFilesAtPaths(patterns);

  for (const sourceFile of sourceFiles) {
    let hasChanges = false;

    sourceFile.forEachDescendant((node) => {
      if (node.getKind() !== SyntaxKind.CallExpression) return;
      const callExpr = node.asKindOrThrow(SyntaxKind.CallExpression);
      const expression = callExpr.getExpression();
      if (!expression.isKind(SyntaxKind.Identifier) || expression.getText() !== 'fetch') return;

      const [urlArg, optionsArg] = callExpr.getArguments();
      const urlText = urlArg.getText();

      let methodText = `'GET'`;
      let bodyText: string | undefined;
      const extraProps: string[] = [];

      if (optionsArg && optionsArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
        const objectLiteral = optionsArg.asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        objectLiteral.getProperties().forEach((property) => {
          if (!property.isKind(SyntaxKind.PropertyAssignment)) {
            extraProps.push(property.getText());
            return;
          }
          const nameNode = property.getNameNode();
          const initializer = property.getInitializer();
          if (!initializer) return;

          const propertyName = nameNode.getText();
          const initializerText = initializer.getText();
          if (propertyName === 'method') {
            methodText = initializerText;
            return;
          }
          if (propertyName === 'body') {
            bodyText = initializerText;
            return;
          }
          extraProps.push(`${propertyName}: ${initializerText}`);
        });
      } else if (optionsArg) {
        extraProps.push(`...(${optionsArg.getText()})`);
      }

      const requestParts = [
        `path: ${urlText}`,
        `method: ${methodText}`,
        ...(bodyText ? [`body: ${bodyText}`] : []),
        `schema: z.any() /* TODO: replace with typed schema from '@/data/schemas' */`,
        ...extraProps,
      ];

      callExpr.replaceWithText(`apiClient.request({ ${requestParts.join(', ')} })`);
      hasChanges = true;
    });

    if (!hasChanges) continue;

    const importDecs = sourceFile.getImportDeclarations();
    const hasApiClientImport = importDecs.some((decl) => decl.getModuleSpecifier().getLiteralText() === '@/data');
    if (!hasApiClientImport) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@/data',
        namedImports: ['apiClient'],
      });
    } else {
      const declaration = importDecs.find((decl) => decl.getModuleSpecifier().getLiteralText() === '@/data');
      if (declaration && !declaration.getNamedImports().some((imp) => imp.getName() === 'apiClient')) {
        declaration.addNamedImport('apiClient');
      }
    }

    const hasZImport = importDecs.some((decl) => decl.getModuleSpecifier().getLiteralText() === 'zod');
    if (!hasZImport) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'zod',
        namedImports: ['z'],
      });
    } else {
      const declaration = importDecs.find((decl) => decl.getModuleSpecifier().getLiteralText() === 'zod');
      if (declaration && !declaration.getNamedImports().some((imp) => imp.getName() === 'z')) {
        declaration.addNamedImport('z');
      }
    }

    sourceFile.fixUnusedImports();
    sourceFile.formatText();
  }

  await project.save();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
