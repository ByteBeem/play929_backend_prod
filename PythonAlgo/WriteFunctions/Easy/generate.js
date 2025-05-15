const templates = require('./templates');
const crypto = require('crypto');

class PythonProblemGenerator {
  constructor() {
    this.generatedHashes = new Set();
  }

  hashCode(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
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
        difficulty: 'easy'
      };
    }
    return this.generate(); // Recursively try again if hash exists
  }

  static validateSolution(userCode, template) {
    try {
      // Combine user code with test cases
      const testCode = `${userCode}\n\n`;
      let testResults = [];

      template.testCases.forEach(testCase => {
        const result = eval(`(${template.name}(${testCase.input.map(JSON.stringify).join(', ')}))`);
        testResults.push({
          input: testCase.input,
          expected: testCase.output,
          actual: result,
          passed: JSON.stringify(result) === JSON.stringify(testCase.output)
        });
      });

      return {
        allPassed: testResults.every(test => test.passed),
        testResults
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
  PythonProblemGenerator,
  generate: function() {
    const generator = new PythonProblemGenerator();
    return generator.generate();
  },
  validateSolution: PythonProblemGenerator.validateSolution
};