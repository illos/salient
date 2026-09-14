// SPDX-License-Identifier: GPL-3.0-only
// Development inventory, not a character rules importer. Never executes upstream code.
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const forge = join(root, 'vendor/forge-steel');
const compendium = join(root, 'vendor/steel-compendium');
const revision = (path: string) =>
  execFileSync('git', ['-C', path, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

function property(node: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  return node.properties.find(
    (entry): entry is ts.PropertyAssignment =>
      ts.isPropertyAssignment(entry) && entry.name.getText() === name,
  )?.initializer;
}
function literal(node: ts.Expression | undefined): string | number | undefined {
  if (node && ts.isStringLiteral(node)) return node.text;
  if (node && ts.isNumericLiteral(node)) return Number(node.text);
  return undefined;
}
function array(node: ts.Expression | undefined): readonly ts.Expression[] {
  if (!node || !ts.isArrayLiteralExpression(node))
    throw new Error('Expected a literal array; inspect upstream format change.');
  return node.elements;
}
function object(node: ts.Expression): ts.ObjectLiteralExpression {
  if (!ts.isObjectLiteralExpression(node))
    throw new Error('Expected a literal object; inspect upstream format change.');
  return node;
}

async function inspect(path: string, kind: 'HeroClass' | 'SubClass') {
  const source = ts.createSourceFile(
    path,
    await readFile(join(forge, path), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const definitions = source.statements
    .filter(ts.isVariableStatement)
    .flatMap(statement => [...statement.declarationList.declarations])
    .filter(declaration => declaration.type?.getText(source) === kind);
  if (definitions.length !== 1 || !definitions[0].initializer)
    throw new Error(`Expected one ${kind} in ${path}`);
  const definition = object(definitions[0].initializer);
  return {
    name: literal(property(definition, 'name')),
    forgeId: literal(property(definition, 'id')),
    path,
    ...(kind === 'HeroClass'
      ? {
          subclassName: literal(property(definition, 'subclassName')),
          subclassCount: literal(property(definition, 'subclassCount')),
          subclassExports: array(property(definition, 'subclasses')).map(entry =>
            entry.getText(source),
          ),
        }
      : {}),
    levels: array(property(definition, 'featuresByLevel')).map(entry => {
      const level = object(entry);
      const factories: Record<string, number> = {};
      // Counts include nested options and conditional branches, not required user selections.
      function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.expression.getText(source) === 'FactoryLogic.feature'
        ) {
          const method = node.expression.name.text;
          factories[method] = (factories[method] ?? 0) + 1;
        }
        ts.forEachChild(node, visit);
      }
      const features = property(level, 'features');
      if (!features) throw new Error(`Missing level features in ${path}`);
      visit(features);
      return { level: literal(property(level, 'level')), featureFactoryCalls: factories };
    }),
  };
}

type DefinitionInventory = Awaited<ReturnType<typeof inspect>>;
const classes: (DefinitionInventory & {
  compendiumId: string;
  subclasses: DefinitionInventory[];
})[] = [];
for (const slug of (await readdir(join(forge, 'src/data/classes'))).sort()) {
  const directory = `src/data/classes/${slug}`;
  const main = await inspect(`${directory}/${slug}.ts`, 'HeroClass');
  const data = JSON.parse(
    await readFile(join(compendium, `en/unified/json/class/${slug}.json`), 'utf8'),
  );
  if (data.name !== main.name || typeof data.scc !== 'string')
    throw new Error(`Class mapping needs review: ${slug}`);
  const subclasses = [];
  for (const file of (await readdir(join(forge, directory))).sort()) {
    if (file.endsWith('.ts') && file !== `${slug}.ts`)
      subclasses.push(await inspect(`${directory}/${file}`, 'SubClass'));
  }
  classes.push({ ...main, compendiumId: data.scc, subclasses });
}
const compendiumClasses = (await readdir(join(compendium, 'en/unified/json/class')))
  .filter(file => file.endsWith('.json'))
  .map(file => file.slice(0, -5));
console.log(
  JSON.stringify(
    {
      scope:
        'Static class and subclass inventory. Factory calls are not resolved choices; defaults, referenced domains/kits, conditions, and option-to-SCC mappings are not evaluated.',
      forgeRevision: revision(forge),
      compendiumRevision: revision(compendium),
      compendiumClassesWithoutForgeDefinition: compendiumClasses.filter(
        slug => !classes.some(entry => entry.path === `src/data/classes/${slug}/${slug}.ts`),
      ),
      classes,
    },
    null,
    2,
  ),
);
