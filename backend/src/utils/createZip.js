const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../../..');
const zipFile = path.join(rootDir, 'CareFlow-Project.zip');
const tempDir = path.join(process.env.TEMP || '/tmp', 'careflow-zip-temp');

console.log('Packaging CareFlow Project into clean ZIP...');
console.log('Project Root:', rootDir);

// 1. Clean previous temp
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

// 2. Use robocopy or recursive copy excluding node_modules, .git, .env
try {
  execSync(`robocopy "${rootDir}" "${tempDir}" /E /XD node_modules dist .git .vscode .idea /XF .env .env.local *.log`, {
    stdio: 'ignore',
  });
} catch (e) {
  // Robocopy exits with code 1 upon successful file copy
}

// 3. Compress using PowerShell Compress-Archive
try {
  execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipFile}' -Force"`, {
    stdio: 'inherit',
  });
  console.log('✅ Successfully created ZIP archive at:', zipFile);
} finally {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
