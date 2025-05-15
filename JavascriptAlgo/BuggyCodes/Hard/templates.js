module.exports = [
    {
      name: 'deepClone',
      code: `function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        const clone = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            clone[key] = deepClone(obj[key]);
          }
        }
        return clone;
      }`,
      testCases: [
        { input: [{ a: 1, b: { c: 2 } }], output: { a: 1, b: { c: 2 } } },
        { input: [[1, [2, 3]]], output: [1, [2, 3]] },
        { input: [null], output: null }
      ]
    },
    {
      name: 'memoize',
      code: `function memoize(fn) {
        const cache = new Map();
        return function(...args) {
          const key = JSON.stringify(args);
          if (!cache.has(key)) {
            cache.set(key, fn.apply(this, args));
          }
          return cache.get(key);
        };
      }`,
      testCases: [
        { input: [(a, b) => a + b], output: 'function' },
        { input: [(x) => x * x], output: 'function' }
      ]
    },
    {
      name: 'promiseAll',
      code: `function promiseAll(promises) {
        return new Promise((resolve, reject) => {
          const results = [];
          let completed = 0;
          if (promises.length === 0) resolve(results);
          promises.forEach((promise, index) => {
            Promise.resolve(promise)
              .then(result => {
                results[index] = result;
                completed++;
                if (completed === promises.length) {
                  resolve(results);
                }
              })
              .catch(reject);
          });
        });
      }`,
      testCases: [
        { 
          input: [
            [Promise.resolve(1), Promise.resolve(2)]
          ], 
          output: [1, 2] 
        },
        { 
          input: [
            [Promise.resolve(1), Promise.reject('error')]
          ],
          output: 'error'
        },
        {
          input: [[]],
          output: []
        }
      ]
    },
    {
      name: 'binarySearch',
      code: `function binarySearch(arr, target) {
        let left = 0;
        let right = arr.length - 1;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          if (arr[mid] < target) {
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }
        return -1;
      }`,
      testCases: [
        { input: [[1, 3, 5, 7, 9], 5], output: 2 },
        { input: [[1, 3, 5, 7, 9], 2], output: -1 }
      ]
    }
  ];