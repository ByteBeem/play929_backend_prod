// templates.js
module.exports = [
    {
        name: 'quicksort',
        code: `def quicksort(arr):
        if len(arr) <= 1:
            return arr
        pivot = arr[len(arr) // 2]
        left = [x for x in arr if x < pivot]
        middle = [x for x in arr if x == pivot]
        right = [x for x in arr if x > pivot]
        return quicksort(left) + middle + quicksort(right)`,
        testCases: [
            { input: [3,6,8,10,1,2,1], output: [1,1,2,3,6,8,10] },
            { input: [], output: [] },
            { input: [5,1,1,2,0,0], output: [0,0,1,1,2,5] }
        ]
    },
    {
        name: 'matrix_multiply',
        code: `def matrix_multiply(a, b):
        if len(a[0]) != len(b):
            raise ValueError("Incompatible matrix dimensions")
        return [[sum(x*y for x,y in zip(a_row,b_col)) for b_col in zip(*b)] for a_row in a]`,
        testCases: [
            { input: [[[1,2],[3,4]], [[5,6],[7,8]]], output: [[19,22],[43,50]] },
            { input: [[[1,2,3],[4,5,6]], [[7,8],[9,10],[11,12]]], output: [[58,64],[139,154]] }
        ]
    },
    {
        name: 'knapsack',
        code: `def knapsack(values, weights, capacity):
        n = len(values)
        dp = [[0] * (capacity + 1) for _ in range(n + 1)]
        
        for i in range(1, n + 1):
            for w in range(1, capacity + 1):
                if weights[i-1] <= w:
                    dp[i][w] = max(values[i-1] + dp[i-1][w-weights[i-1]], dp[i-1][w])
                else:
                    dp[i][w] = dp[i-1][w]
        
        return dp[n][capacity]`,
        testCases: [
            { input: [[60,100,120], [10,20,30], 50], output: 220 },
            { input: [[1,2,3], [4,5,1], 4], output: 3 }
        ]
    },
    {
        name: 'dijkstra',
        code: `def dijkstra(graph, start):
        distances = {vertex: float('infinity') for vertex in graph}
        distances[start] = 0
        pq = [(0, start)]
        
        while pq:
            current_distance, current_vertex = heapq.heappop(pq)
            
            if current_distance > distances[current_vertex]:
                continue
                
            for neighbor, weight in graph[current_vertex].items():
                distance = current_distance + weight
                
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    heapq.heappush(pq, (distance, neighbor))
                    
        return distances`,
        testCases: [
            { input: [{
                'A': {'B': 1, 'C': 4},
                'B': {'A': 1, 'C': 2, 'D': 5},
                'C': {'A': 4, 'B': 2, 'D': 1},
                'D': {'B': 5, 'C': 1}
            }, 'A'], output: {'A': 0, 'B': 1, 'C': 3, 'D': 4} }
        ]
    },
    {
        name: 'lcs',
        code: `def lcs(X, Y):
        m = len(X)
        n = len(Y)
        L = [[0]*(n+1) for i in range(m+1)]
        
        for i in range(m+1):
            for j in range(n+1):
                if i == 0 or j == 0:
                    L[i][j] = 0
                elif X[i-1] == Y[j-1]:
                    L[i][j] = L[i-1][j-1] + 1
                else:
                    L[i][j] = max(L[i-1][j], L[i][j-1])
        
        return L[m][n]`,
        testCases: [
            { input: ["ABCDGH", "AEDFHR"], output: 3 },
            { input: ["AGGTAB", "GXTXAYB"], output: 4 }
        ]
    },
    {
        name: 'n_queens',
        code: `def n_queens(n):
        def is_safe(board, row, col):
            for i in range(col):
                if board[row][i] == 1:
                    return False
            for i,j in zip(range(row,-1,-1), range(col,-1,-1)):
                if board[i][j] == 1:
                    return False
            for i,j in zip(range(row,n,1), range(col,-1,-1)):
                if board[i][j] == 1:
                    return False
            return True
        
        def solve(board, col):
            if col >= n:
                return True
            for i in range(n):
                if is_safe(board, i, col):
                    board[i][col] = 1
                    if solve(board, col+1):
                        return True
                    board[i][col] = 0
            return False
        
        board = [[0]*n for _ in range(n)]
        if not solve(board, 0):
            return []
        return board`,
        testCases: [
            { input: 4, output: [[0,0,1,0],[1,0,0,0],[0,0,0,1],[0,1,0,0]] },
            { input: 5, output: [[1,0,0,0,0],[0,0,0,1,0],[0,1,0,0,0],[0,0,0,0,1],[0,0,1,0,0]] }
        ]
    },
    {
        name: 'avl_tree',
        code: `class AVLNode:
        def __init__(self, key):
            self.key = key
            self.left = None
            self.right = None
            self.height = 1

    def avl_insert(root, key):
        if not root:
            return AVLNode(key)
        elif key < root.key:
            root.left = avl_insert(root.left, key)
        else:
            root.right = avl_insert(root.right, key)
            
        root.height = 1 + max(get_height(root.left), get_height(root.right))
        
        balance = get_balance(root)
        
        # Left Left
        if balance > 1 and key < root.left.key:
            return right_rotate(root)
            
        # Right Right
        if balance < -1 and key > root.right.key:
            return left_rotate(root)
            
        # Left Right
        if balance > 1 and key > root.left.key:
            root.left = left_rotate(root.left)
            return right_rotate(root)
            
        # Right Left
        if balance < -1 and key < root.right.key:
            root.right = right_rotate(root.right)
            return left_rotate(root)
            
        return root`,
        testCases: [
            { input: [null, 10], output: {key: 10, left: null, right: null, height: 1} },
            { input: [{key: 20, left: {key: 10}, right: null, height: 2}, 30], output: { /* balanced tree structure */ } }
        ]
    }
];