import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const serverDir = path.join(rootDir, 'server');
const tauriResourcesDir = path.join(rootDir, 'src-tauri', 'resources');
const destBinDir = path.join(tauriResourcesDir, 'bin');
const destServerDir = path.join(tauriResourcesDir, 'server');

console.log('📦 [Prepare Bundle] Packaging backend for desktop bundle...');

// 1. Ensure target dirs exist
fs.mkdirSync(destBinDir, { recursive: true });
fs.mkdirSync(destServerDir, { recursive: true });

// 2. Copy Node executable
const nodeExeName = process.platform === 'win32' ? 'node.exe' : 'node';
const targetNodePath = path.join(destBinDir, nodeExeName);

console.log(`Copying Node executable from ${process.execPath} -> ${targetNodePath}`);
fs.copyFileSync(process.execPath, targetNodePath);

// 3. Verify and copy server/dist
const serverDist = path.join(serverDir, 'dist');
const serverDistMain = path.join(serverDist, 'server.js');
if (!fs.existsSync(serverDistMain)) {
  throw new Error(`❌ FATAL: ${serverDistMain} does not exist! Backend server was not built properly.`);
}
console.log(`Copying server/dist -> ${destServerDir}/dist`);
fs.cpSync(serverDist, path.join(destServerDir, 'dist'), { recursive: true });

// 4. Copy server/package.json
const serverPkg = path.join(serverDir, 'package.json');
if (fs.existsSync(serverPkg)) {
  fs.copyFileSync(serverPkg, path.join(destServerDir, 'package.json'));
}

// 5. Clean dest node_modules and copy real native modules (dereferenced, no symlinks)
const destModules = path.join(destServerDir, 'node_modules');
fs.rmSync(destModules, { recursive: true, force: true });
fs.mkdirSync(destModules, { recursive: true });

const bsSource = path.join(serverDir, 'node_modules', 'better-sqlite3');
if (!fs.existsSync(bsSource)) {
  throw new Error(`❌ FATAL: ${bsSource} does not exist! Run pnpm install in server folder.`);
}

const bsReal = fs.realpathSync(bsSource);
const bsDest = path.join(destModules, 'better-sqlite3');
console.log(`Copying better-sqlite3 (real path: ${bsReal}) -> ${bsDest}...`);
fs.cpSync(bsReal, bsDest, { recursive: true });

console.log('✅ [Prepare Bundle] Backend packaging complete with verified server.js and node_modules.');
