const templates = require('./templates');
const crypto = require('crypto');
const { execSync } = require('child_process');

class HardPythonProblemGenerator {
  constructor() {
    this.generatedHashes = new Set();
    this.timeout = 5000; // 5 second timeout for test execution
  }

  hashCode(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  runPythonCode(code) {
    const tempFile = '/tmp/python_test.py';
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

  generate() {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const hash = this.hashCode(template.name);

    if (!this.generatedHashes.has(hash)) {
      this.generatedHashes.add(hash);
      return {
        description: template.description,
        stub: template.stub,
        functionName: template.name,
        testCases: template.testCases,
        difficulty: 'hard'
      };
    }
    return this.generate(); // Retry if hash exists
  }

  validateSolution(userCode, problem) {
    try {
      // Prepare test code
      let testCode = `${userCode}\n\n`;
      testCode += `results = []\n`;
      
      problem.testCases.forEach((testCase, i) => {
        const args = testCase.input.map(arg => JSON.stringify(arg)).join(', ');
        testCode += `results.append((${problem.functionName}(${args}), ${JSON.stringify(testCase.output)}))\n`;
      });
      
      testCode += `print(all(result[0] == result[1] for result in results))`;
      
      const output = this.runPythonCode(testCode).trim();
      const allPassed = output === 'True';
      
      return {
        allPassed,
        testCases: problem.testCases.map((testCase, i) => ({
          input: testCase.input,
          expected: testCase.output,
          passed: allPassed ? true : undefined 
        }))
      };
    } catch (error) {
      return {
        allPassed: false,
        error: error.message
      };
    }
  }
}

module.exports = {
  HardPythonProblemGenerator,
  generate: function() {
    const generator = new HardPythonProblemGenerator();
    return generator.generate();
  },
  validateSolution: function(userCode, problem) {
    const generator = new HardPythonProblemGenerator();
    return generator.validateSolution(userCode, problem);
  }
};