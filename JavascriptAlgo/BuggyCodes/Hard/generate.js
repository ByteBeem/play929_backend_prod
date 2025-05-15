const crypto = require('crypto');
const vm = require('vm');

class BugGenerator {
  constructor() {
    this.generatedHashes = new Set();
    this.maxAttempts = 100;
    this.timeout = 5000;
  }

  hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  runJSCode(code) {
    const sandbox = {
      console: { log: () => {} },
      originalResults: null,
      buggyResults: null,
      setTimeout,
      Promise
    };
  
    const context = vm.createContext(sandbox);
  
    try {
      const script = new vm.Script(code); // this can throw syntax errors
      script.runInContext(context, { timeout: this.timeout });
  
      return {
        valid: JSON.stringify(sandbox.originalResults) === JSON.stringify(sandbox.buggyResults),
        error: null
      };
    } catch (err) {
      return {
        valid: false,
        error: err.message
      };
    }
  }
  

   isValidBug(template, buggyCode) {
    const testCases = template.testCases;
    if (!testCases || testCases.length === 0) return false;

    let testCode = `${template.code}\n\n`;
    testCode += `const originalResults = [\n`;
    testCode += testCases.map(tc => {
      const args = tc.input.map(arg => 
        typeof arg === 'function' ? arg.toString() : JSON.stringify(arg)
      ).join(', ');
      return `  ${template.name}(${args})`;
    }).join(',\n');
    testCode += '\n];\n\n';

    testCode += `${buggyCode}\n\n`;
    testCode += `const buggyResults = [\n`;
    testCode += testCases.map(tc => {
      const args = tc.input.map(arg => 
        typeof arg === 'function' ? arg.toString() : JSON.stringify(arg)
      ).join(', ');
      return `  ${template.name}(${args})`;
    }).join(',\n');
    testCode += '\n];';

    const { valid, error } = this.runJSCode(testCode);
if (error) {
  console.error(`Validation error: ${error}`);
  console.error("Buggy code was:\n", buggyCode);
}

    return !valid;
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

module.exports = {
  BugGenerator,
  generate: function() {
    const generator = new BugGenerator();
    return  generator.generate();
  }
};