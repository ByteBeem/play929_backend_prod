// generate.js
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

class BugGenerator {
  constructor() {
    this.generatedHashes = new Set();
    this.maxAttempts = 100;
    this.timeout = 5000;
    
    // Bind methods to ensure proper 'this' context
    this.formatInput = this.formatInput.bind(this);
    this.runPythonCode = this.runPythonCode.bind(this);
    this.isValidBug = this.isValidBug.bind(this);
  }

  hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  runPythonCode(code) {
    const tempFile = '/tmp/bug_test.py';
    fs.writeFileSync(tempFile, code);
    
    try {
      return execSync(`python3 ${tempFile}`, { 
        timeout: this.timeout,
        stdio: ['pipe', 'pipe', 'ignore']
      }).toString();
    } catch (error) {
      return error.stdout ? error.stdout.toString() : '';
    }
  }

  formatInput(input) {
    if (Array.isArray(input)) {
      if (input.length === 2 && Array.isArray(input[0])) {
        return `(${this.formatInput(input[0])}, ${this.formatInput(input[1])})`;
      }
      return `[${input.map(x => this.formatInput(x)).join(', ')}]`;
    }
    if (typeof input === 'object' && input !== null) {
      if (input.key !== undefined) {
        return `{'key': ${input.key}, 'left': ${this.formatInput(input.left)}, 'right': ${this.formatInput(input.right)}}`;
      }
      const entries = Object.entries(input).map(([k, v]) => 
        `'${k}': ${this.formatInput(v)}`
      );
      return `{${entries.join(', ')}}`;
    }
    if (typeof input === 'string') {
      return `"${input}"`;
    }
    return input;
  }

  isValidBug(template, buggyCode) {
    const testCases = template.testCases;
    if (!testCases || testCases.length === 0) return false;

    let testCode = `${template.code}\n\n`;
    testCode += `original_results = [\n`;
    testCode += testCases.map(tc => 
      `  ${template.name}(${this.formatInput(tc.input)})`
    ).join(',\n');
    testCode += '\n]\n\n';

    testCode += `${buggyCode}\n\n`;
    testCode += `buggy_results = [\n`;
    testCode += testCases.map(tc => 
      `  ${template.name}(${this.formatInput(tc.input)})`
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
            functionName: template.name,
            attempts: attempt + 1
          };
        }
      }
    }

    throw new Error(`Failed to generate valid bug after ${this.maxAttempts} attempts`);
  }
}

// Main execution
if (require.main === module) {
  const generator = new BugGenerator();
  
  try {
    const result = generator.generate();
    
    console.log(`=== GENERATED BUG (Attempts: ${result.attempts}) ===`);
    console.log(`Type: ${result.bugType} (${result.difficulty})`);
    console.log(`Function: ${result.functionName}`);
    console.log(`Description: ${result.description}\n`);
    
    console.log("=== ORIGINAL FUNCTION ===");
    console.log(result.original + "\n");
    
    console.log("=== BUGGY FUNCTION ===");
    console.log(result.buggy + "\n");
    
    console.log("✅ Bug generated successfully");
  } catch (error) {
    console.error("❌ Error generating bug:", error.message);
    process.exit(1);
  }
}

module.exports = {
  BugGenerator,
  generate: function() {
    const generator = new BugGenerator();
    return generator.generate();
  }
};