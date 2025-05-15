module.exports = [
    {
      name: 'rotate_matrix',
      description: 'Write a function to rotate an NxN matrix 90 degrees clockwise',
      stub: `def rotate_matrix(matrix):\n    # Your code here\n    pass`,
      testCases: [
        { 
          input: [[[1, 2], [3, 4]]], 
          output: [[3, 1], [4, 2]] 
        },
        { 
          input: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], 
          output: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] 
        }
      ]
    },
    {
      name: 'valid_parentheses',
      description: 'Write a function to check if a string of parentheses is balanced',
      stub: `def is_valid(s):\n    # Your code here\n    pass`,
      testCases: [
        { input: ["()"], output: true },
        { input: ["()[]{}"], output: true },
        { input: ["(]"], output: false },
        { input: ["([)]"], output: false }
      ]
    },
    {
      name: 'group_anagrams',
      description: 'Write a function to group anagrams together from a list of words',
      stub: `def group_anagrams(strs):\n    # Your code here\n    pass`,
      testCases: [
        { 
          input: [["eat","tea","tan","ate","nat","bat"]], 
          output: [["eat","tea","ate"],["tan","nat"],["bat"]] 
        },
        { 
          input: [[""]], 
          output: [[""]] 
        }
      ]
    },
    {
      name: 'next_permutation',
      description: 'Write a function to find the next lexicographical permutation of numbers',
      stub: `def next_permutation(nums):\n    # Your code here\n    pass`,
      testCases: [
        { input: [[1,2,3]], output: [1,3,2] },
        { input: [[3,2,1]], output: [1,2,3] },
        { input: [[1,1,5]], output: [1,5,1] }
      ]
    }
  ];