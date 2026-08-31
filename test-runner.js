// This file will run all test files that follow the naming convention *.test.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [];

// Recursively find test files
function findTestFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            // Skip node_modules
            if (file === 'node_modules') continue;
            findTestFiles(filePath);
        } else if (file.endsWith('.test.ts')) {
            testFiles.push(filePath);
        }
    }
}

// Start searching from the current directory
findTestFiles(__dirname);

console.log(`Found ${testFiles.length} test files:`);
testFiles.forEach(file => console.log(`- ${file}`));

// Run each test file
async function runTests() {
    let totalTests = 0;
    let failedTests = 0;

    for (const file of testFiles) {
        console.log(`
Running tests in ${file}...`);
        try {
            // Import and execute the test file
            // Each test file is expected to export functions named 'test' or similar,
            // or directly execute tests in global scope.
            // For simplicity, we assume they will throw errors on failure.
            const testModule = await import(file);
            // If tests are defined as async functions, await them
            if (testModule.default && typeof testModule.default === 'function') {
                await testModule.default();
            } else {
                // Assuming tests are executed directly when imported
            }
            console.log(`✓ ${file} passed.`);
            totalTests++;
        } catch (error) {
            console.error(`✗ ${file} failed:`);
            console.error(error.stack || error.message);
            failedTests++;
            totalTests++;
        }
    }

    console.log(`
--- Test Summary ---`);
    console.log(`Total test files run: ${totalTests}`);
    console.log(`Passed: ${totalTests - failedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
        process.exit(1); // Exit with failure code
    } else {
        process.exit(0); // Exit with success code
    }
}

runTests();
