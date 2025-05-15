module.exports = [
    {
      name: 'matrix_spiral_order',
      description: 'Write a function that returns elements of a 2D matrix in spiral order',
      stub: `def spiral_order(matrix):\n    # Your code here\n    pass`,
      testCases: [
        { 
          input: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], 
          output: [1, 2, 3, 6, 9, 8, 7, 4, 5] 
        },
        { 
          input: [[[1, 2], [3, 4]]], 
          output: [1, 2, 4, 3] 
        }
      ]
    },
    {
      name: 'longest_palindromic_substring',
      description: 'Write a function that finds the longest palindromic substring',
      stub: `def longest_palindrome(s):\n    # Your code here\n    pass`,
      testCases: [
        { input: ["babad"], output: "bab" },
        { input: ["cbbd"], output: "bb" },
        { input: ["a"], output: "a" }
      ]
    },
    {
      name: 'word_break',
      description: 'Write a function that determines if a string can be segmented into dictionary words',
      stub: `def word_break(s, word_dict):\n    # Your code here\n    pass`,
      testCases: [
        { 
          input: ["leetcode", ["leet", "code"]], 
          output: true 
        },
        { 
          input: ["applepenapple", ["apple", "pen"]], 
          output: true 
        },
        { 
          input: ["catsandog", ["cats", "dog", "sand", "and", "cat"]], 
          output: false 
        }
      ]
    },
    {
      name: 'course_schedule',
      description: 'Write a function that checks if you can finish all courses given prerequisites',
      stub: `def can_finish(num_courses, prerequisites):\n    # Your code here\n    pass`,
      testCases: [
        { 
          input: [2, [[1, 0]]], 
          output: true 
        },
        { 
          input: [2, [[1, 0], [0, 1]]], 
          output: false 
        }
      ]
    }
  ];