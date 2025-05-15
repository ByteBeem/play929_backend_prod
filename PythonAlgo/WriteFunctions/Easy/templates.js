module.exports = [
    {
      name: 'sum_two_numbers',
      description: 'Write a function that returns the sum of two numbers',
      stub: `def sum_two_numbers(a, b):\n    # Your code here\n    pass`,
      testCases: [
        { input: [1, 2], output: 3 },
        { input: [0, 0], output: 0 },
        { input: [-1, 1], output: 0 }
      ]
    },
    {
      name: 'is_even',
      description: 'Write a function that checks if a number is even',
      stub: `def is_even(num):\n    # Your code here\n    pass`,
      testCases: [
        { input: [4], output: true },
        { input: [7], output: false },
        { input: [0], output: true }
      ]
    },
    {
      name: 'reverse_string',
      description: 'Write a function that reverses a string',
      stub: `def reverse_string(s):\n    # Your code here\n    pass`,
      testCases: [
        { input: ["hello"], output: "olleh" },
        { input: ["a"], output: "a" },
        { input: [""], output: "" }
      ]
    },
    {
      name: 'find_max',
      description: 'Write a function that finds the maximum number in a list',
      stub: `def find_max(numbers):\n    # Your code here\n    pass`,
      testCases: [
        { input: [[1, 2, 3]], output: 3 },
        { input: [[-1, -5, -3]], output: -1 },
        { input: [[5]], output: 5 }
      ]
    }
  ];