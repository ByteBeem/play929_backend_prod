const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

class EasyNyanaBugGenerator {
  constructor() {
    this.generatedHashes = new Set();
    this.maxAttempts = 50;
  }

  hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  runPythonCode(code) {
    const tempFile = '/tmp/bug_test.py';
    fs.writeFileSync(tempFile, code);
    try {
      return execSync(`python3 ${tempFile}`, { 
        timeout: 3000,
        stdio: ['pipe', 'pipe', 'ignore']
      }).toString();
    } catch {
      return '';
    }
  }

  isValidBug(template, buggyCode) {
    const testCases = template.testCases;
    if (!testCases || testCases.length === 0) return false;

    let testCode = `${template.code}\n\n`;
    testCode += `original_results = [\n`;
    testCode += testCases.map(tc => 
      `  ${template.name}(${JSON.stringify(tc.input[0])})`
    ).join(',\n');
    testCode += '\n]\n\n';

    testCode += `${buggyCode}\n\n`;
    testCode += `buggy_results = [\n`;
    testCode += testCases.map(tc => 
      `  ${template.name}(${JSON.stringify(tc.input[0])})`
    ).join(',\n');
    testCode += '\n]\n\n';

    testCode += `print("VALID:", original_results == buggy_results)`;

    const output = this.runPythonCode(testCode);
    return !output.includes('VALID: True');
  }

  generate() {
    const templates = require('./templates');
    const bugTypes = require('./bugTypes');

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const bugType = bugTypes[Math.floor(Math.random() * bugTypes.length)];
      
      let buggyCode = bugType.inject(template.code);
      const hash = this.hashCode(buggyCode);

      if (!this.generatedHashes.has(hash)) {
        if (this.isValidBug(template, buggyCode)) {
          this.generatedHashes.add(hash);
          return {
            original: template.code,
            buggy: buggyCode,
            bugType: bugType.name,
            difficulty: bugType.difficulty,
            description: bugType.description,
            functionName: template.name
          };
        }
      }
    }
    throw new Error(`Failed to generate valid bug after ${this.maxAttempts} attempts`);
  }
}

// Export both the class and a generate function
module.exports = {
  BugGenerator: EasyNyanaBugGenerator,
  generate: function() {
    const generator = new EasyNyanaBugGenerator();
    return generator.generate();
  }
};