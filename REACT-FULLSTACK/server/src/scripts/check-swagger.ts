// Compara las rutas reales (src/routes) contra la documentación (src/docs/swagger.ts)
// Uso: npx tsx scripts/check-swagger.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { swaggerSpec } from '../docs/swagger';

const ROUTES_DIR = join(process.cwd(), 'src/routes');
const METODOS = ['get', 'post', 'put', 'patch', 'delete'];

// Prefijos y archivos montados en routes/index.ts
const indexSrc = readFileSync(join(ROUTES_DIR, 'index.ts'), 'utf8');
const imports = Object.fromEntries(
  [...indexSrc.matchAll(/import (\w+) from '\.\/([\w.]+)'/g)].map((m) => [m[1], `${m[2]}.ts`])
);
const montajes = [...indexSrc.matchAll(/router\.use\('([^']+)',\s*(\w+)\)/g)].map((m) => ({
  prefix: m[1],
  file: imports[m[2]],
}));

// Rutas reales
type Ruta = { metodo: string; path: string; roles: string };
const reales: Ruta[] = [];

for (const { prefix, file } of montajes) {
  const src = readFileSync(join(ROUTES_DIR, file), 'utf8');

  // Roles aplicados a todo el router (router.use(authenticateToken, authorizeRoles(...)))
  const rolesGlobal = src.match(/router\.use\([^)]*authorizeRoles\(([^)]*)\)/)?.[1];

  for (const m of src.matchAll(/router\.(get|post|put|patch|delete)\('([^']*)'([^\n]*)/g)) {
    const [, metodo, sub, resto] = m;
    const rolesLinea = resto.match(/authorizeRoles\(([^)]*)\)/)?.[1];
    const roles = (rolesLinea ?? rolesGlobal ?? 'sin restricción de rol').replace(/['\s]/g, '');
       const full = `${prefix}${sub === '/' ? '' : sub}`.replace(/:(\w+)/g, '{$1}');
    reales.push({ metodo, path: full, roles });
  }
}

// Documentación
const spec = swaggerSpec as unknown as Record<string, Record<string, Record<string, any>>>;
const documentadas: Ruta[] = [];
for (const [path, operaciones] of Object.entries(spec.paths)) {
  for (const [metodo, op] of Object.entries(operaciones)) {
    if (!METODOS.includes(metodo)) continue;
    documentadas.push({ metodo, path, roles: String(op.description ?? '') });
  }
}

const clave = (r: Ruta) => `${r.metodo.toUpperCase()} ${r.path}`;
const setReales = new Set(reales.map(clave));
const setDoc = new Set(documentadas.map(clave));

const faltanEnDoc = reales.filter((r) => !setDoc.has(clave(r)));
const sobranEnDoc = documentadas.filter((d) => !setReales.has(clave(d)));

console.log(`\nRutas reales: ${reales.length} | documentadas: ${documentadas.length}\n`);

if (faltanEnDoc.length) {
  console.log('❌ En el código y NO en swagger.ts:');
  faltanEnDoc.forEach((r) => console.log(`   ${clave(r)}  [roles: ${r.roles}]`));
}
if (sobranEnDoc.length) {
  console.log('❌ En swagger.ts y NO en el código:');
  sobranEnDoc.forEach((d) => console.log(`   ${clave(d)}`));
}
if (!faltanEnDoc.length && !sobranEnDoc.length) {
  console.log('✅ Mismas rutas y métodos en código y documentación');
}

console.log('\nRoles en el código (revisá que la descripción del spec coincida):');
reales.forEach((r) => console.log(`   ${clave(r).padEnd(55)} ${r.roles}`));