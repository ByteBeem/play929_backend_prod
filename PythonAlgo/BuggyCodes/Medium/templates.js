module.exports = [
    {
      name: 'binary_to_decimal',
      code: `def binary_to_decimal(binary_str):
      decimal = 0
      for i, digit in enumerate(reversed(binary_str)):
          if digit == '1':
              decimal += 2 ** i
      return decimal`,
      testCases: [
        { input: ["1010"], output: 10 },
        { input: ["1111"], output: 15 },
        { input: ["10000"], output: 16 }
      ]
    },
    {
      name: 'merge_sorted_lists',
      code: `def merge_sorted_lists(list1, list2):
      merged = []
      i = j = 0
      while i < len(list1) and j < len(list2):
          if list1[i] < list2[j]:
              merged.append(list1[i])
              i += 1
          else:
              merged.append(list2[j])
              j += 1
      merged.extend(list1[i:])
      merged.extend(list2[j:])
      return merged`,
      testCases: [
        { input: [[1, 3, 5], [2, 4, 6]], output: [1, 2, 3, 4, 5, 6] },
        { input: [[], [1, 2, 3]], output: [1, 2, 3] },
        { input: [[1, 1, 1], [1, 1, 1]], output: [1, 1, 1, 1, 1, 1] }
      ]
    },
    {
      name: 'validate_email',
      code: `def validate_email(email):
      if '@' not in email or '.' not in email:
          return False
      username, domain = email.split('@')
      if not username or not domain:
          return False
      if domain.count('.') == 0:
          return False
      return True`,
      testCases: [
        { input: ["test@example.com"], output: true },
        { input: ["invalid.email"], output: false },
        { input: ["another@test"], output: false }
      ]
    },
    {
      name: 'find_missing_number',
      code: `def find_missing_number(nums):
      n = len(nums)
      total = (n + 1) * (n + 2) // 2
      return total - sum(nums)`,
      testCases: [
        { input: [[3, 0, 1]], output: 2 },
        { input: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], output: 8 },
        { input: [[0, 1]], output: 2 }
      ]
    }
  ];