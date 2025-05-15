const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

class MediumPythonProblemGenerator {
  constructor() {
    this.generatedHashes = new Set();
    this.timeout = 3000; // 3 second timeout
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
        difficulty: 'medium'
      };
    }
    return this.generate();
  }

  validateSolution(userCode, problem) {
    try {
      let testCode = `${userCode}\n\n`;
      testCode += `results = []\n`;
      
      problem.testCases.forEach((testCase, i) => {
        const args = testCase.input.map(arg => JSON.stringify(arg)).join(', ');
        testCode += `result = ${problem.functionName}(${args})\n`;
        testCode += `results.append((result, ${JSON.stringify(testCase.output)}))\n`;
      });
      
      testCode += `print(all(str(result[0]) == str(result[1]) for result in results))`;
      
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

const templates = require('./templates');

module.exports = {
  MediumPythonProblemGenerator,
  generate: function() {
    const generator = new MediumPythonProblemGenerator();
    return generator.generate();
  },
  validateSolution: function(userCode, problem) {
    const generator = new MediumPythonProblemGenerator();
    return generator.validateSolution(userCode, problem);
  }
};