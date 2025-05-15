const { generate: generateHardBuggyCode } = require("./BuggyCodes/Hard/generate");



const handleJavaScriptAlgoRequest = async (type, difficulty, params = {}) => {
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
        return  handleBuggyCodeRequest(normalizedDifficulty);
      case "write":
        return '';
      case "optimize":
        return '';
      default:
        throw new Error("Invalid type. Supported: buggycode, write, optimize.");
    }
  } catch (error) {
    console.error(`Error in handleJavaScriptAlgoRequest: ${error.message}`);
    throw error; 
  }
};

const handleBuggyCodeRequest =  (difficulty) => {
  try {
    if (!difficulty || typeof difficulty !== "string" || difficulty.trim() === "") {
      throw new Error("Difficulty is required for buggy code generation.");
    }

    switch (difficulty) {
      case "easy":
        return '';
      case "medium":
        return '';
      case "hard":
        return  generateHardBuggyCode();
      default:
        throw new Error("Invalid difficulty. Supported: easy, medium, hard.");
    }
  } catch (error) {
    console.error(`Error generating ${difficulty} buggy code: ${error.message}`);
    throw new Error(`Failed to generate ${difficulty} buggy code`);
  }
};

module.exports = {
    handleJavaScriptAlgoRequest,
  handleBuggyCodeRequest
};