const { generate: generateHardBuggyCode } = require("./BuggyCodes/Hard/generate");
const { generate: BuggyCodeEasy } = require("./BuggyCodes/Easy/generate");
const { generate: BuggyCodeMedium } = require("./BuggyCodes/Medium/generate");
const {generate: generateWriteEasyProblem} = require("./WriteFunctions/Easy/generate");
const {generate: generateWritehardProblem} = require("./WriteFunctions/Hard/generate");
const {generate: generateWriteMediumProblem} = require("./WriteFunctions/Medium/generate");

const handlePythonAlgoRequest = async (type, difficulty, params = {}) => {
  try {
    // Validate input
    if (!type || typeof type !== "string" || type.trim() === "") {
      throw new Error("Type is required (buggycode, write, optimize).");
    }

    const normalizedType = type.toLowerCase();
    const normalizedDifficulty = difficulty?.toLowerCase();

    // Route based on request type
    switch (normalizedType) {
      case "buggycode":
        return await handleBuggyCodeRequest(normalizedDifficulty);
      case "write":
        return await handleWriteFunctionRequest(normalizedDifficulty);
      case "optimize":
        return '';
      default:
        throw new Error("Invalid type. Supported: buggycode, write, optimize.");
    }
  } catch (error) {
    console.error(`Error in handlePythonAlgoRequest: ${error.message}`);
    throw error; 
  }
};

const handleBuggyCodeRequest = async (difficulty) => {
  try {
    if (!difficulty || typeof difficulty !== "string" || difficulty.trim() === "") {
      throw new Error("Difficulty is required for buggy code generation.");
    }

    switch (difficulty) {
      case "easy":
        return await BuggyCodeEasy();
      case "medium":
        return await BuggyCodeMedium();
      case "hard":
        return await generateHardBuggyCode();
      default:
        throw new Error("Invalid difficulty. Supported: easy, medium, hard.");
    }
  } catch (error) {
    console.error(`Error generating ${difficulty} buggy code: ${error.message}`);
    throw new Error(`Failed to generate ${difficulty} buggy code`);
  }
};

const handleWriteFunctionRequest  =  async(difficulty)=>{
  try{

    if (!difficulty || typeof difficulty !== "string" || difficulty.trim() === "") {
      throw new Error("Difficulty is required for buggy code generation.");
    }

    switch (difficulty) {
      case "easy":
        return await generateWriteEasyProblem();
      case "medium":
        return await generateWriteMediumProblem();
      case "hard":
        return await generateWritehardProblem();
      default:
        throw new Error("Invalid difficulty. Supported: easy, medium, hard.");
    }

  }catch(error){
    console.error(`Error generating ${difficulty} write function problem: ${error.message}`);
    throw new Error(`Failed to generate ${difficulty} write function problem`);

  }
}

module.exports = {
  handlePythonAlgoRequest,
  handleBuggyCodeRequest,
  handleWriteFunctionRequest
};