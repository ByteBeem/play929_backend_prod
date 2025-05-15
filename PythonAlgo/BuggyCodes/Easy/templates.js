module.exports = [
    {
      name: 'sum_even_numbers',
      code: `def sum_even_numbers(numbers):
      total = 0
      for num in numbers:
          if num % 2 == 0:
              total += num
      return total`,
      testCases: [
        { input: [[1, 2, 3, 4, 5]], output: 6 },
        { input: [[2, 4, 6]], output: 12 },
        { input: [[1, 3, 5]], output: 0 }
      ]
    },
    {
      name: 'count_vowels',
      code: `def count_vowels(text):
      vowels = 'aeiou'
      count = 0
      for char in text.lower():
          if char in vowels:
              count += 1
      return count`,
      testCases: [
        { input: ["Hello World"], output: 3 },
        { input: ["Python"], output: 1 },
        { input: ["Rhythm"], output: 0 }
      ]
    },
    {
      name: 'find_max',
      code: `def find_max(numbers):
      if not numbers:
          return None
      max_num = numbers[0]
      for num in numbers:
          if num > max_num:
              max_num = num
      return max_num`,
      testCases: [
        { input: [[5, 2, 8, 1]], output: 8 },
        { input: [[-1, -5, -3]], output: -1 },
        { input: [[]], output: null }
      ]
    },
    {
      name: 'is_palindrome',
      code: `def is_palindrome(word):
      return word.lower() == word.lower()[::-1]`,
      testCases: [
        { input: ["radar"], output: true },
        { input: ["Python"], output: false },
        { input: ["Madam"], output: true }
      ]
    }
  ];