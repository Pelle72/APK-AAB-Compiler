const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Runs a shell command and returns a Promise.
 * @param {string} cmd - The command to execute.
 * @returns {Promise<string>}
 */
function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Generates APK and AAB files for a PWA using Bubblewrap.
 * @param {string} manifestUrlOrPath - URL or local path to the PWA manifest.json.
 * @param {string} packageId - Unique Android package ID.
 * @param {string} outputDir - Directory to output generated files.
 */
async function generateApkAab(manifestUrlOrPath, packageId, outputDir) {
  try {
    // Create output dir if missing
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Step 1: Init Bubblewrap project
    await run(`bubblewrap init --manifest ${manifestUrlOrPath} --packageId ${packageId} --directory "${outputDir}"`);

    // (Optional) Modify icons, splash etc in outputDir before build

    // Step 2: Build APK & AAB
    await run(`bubblewrap build --directory "${outputDir}"`);

    const apkPath = path.join(outputDir, 'build/outputs/apk/release');
    const aabPath = path.join(outputDir, 'build/outputs/bundle/release');

    return { apkPath, aabPath };
  } catch (error) {
    throw error;
  }
}

module.exports = { generateApkAab };