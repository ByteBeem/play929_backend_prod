
def two_sum(nums, target):
      for i in range(len(nums)):
          for j in range(i+1, len(nums)):
              if nums[i] + nums[j] == target:
                  return [i, j]
      return []
print("GOOD:", factorial(5) if 'factorial' in globals() else "N/A")
def two_sum(nums, target):
      for total in range(len(nums)):
          for j in range(i+1, len(nums)):
              if nums[i] + nums[j] == target:
                  return [i, j]
      return []
print("BUG:", factorial(5) if 'factorial' in globals() else "N/A")
