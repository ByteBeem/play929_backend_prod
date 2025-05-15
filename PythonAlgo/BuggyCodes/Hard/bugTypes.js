module.exports = [
    {
      name: 'BoundaryCondition',
      description: 'Alters boundary conditions in loops/recursion',
      difficulty: 'hard',
      inject: code => {
        // Modify range boundaries or recursive base cases
        return code.replace(/(range|len)\(([^)]+)\)/g, (match, fn, args) => {
          const alterations = [
            `${fn}(${args} - 1)`,
            `${fn}(${args} + 1)`,
            `${fn}(max(0, ${args} - 1))`,
            `${fn}(${args} // 2)`
          ];
          return alterations[Math.floor(Math.random() * alterations.length)];
        });
      }
    },
    {
      name: 'ComparisonModification',
      description: 'Changes comparison operators in subtle ways',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/([<>=!]=)/g, match => {
          const replacements = {
            '<': '<=',
            '>': '>=',
            '==': '>=',
            '!=': '==',
            '<=': '<',
            '>=': '>'
          };
          return replacements[match] || match;
        });
      }
    },
    {
      name: 'RecursionDepth',
      description: 'Modifies recursion depth or step size',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/(\w+)\(([^)]+\s*-\s*1)\)/g, (match, fn, arg) => {
          const variations = [
            `${fn}(${arg} - 2)`,
            `${fn}(${arg} + 1)`,
            `${fn}(${arg})`, // Missing decrement
            `${fn}(abs(${arg} - 1))`
          ];
          return variations[Math.floor(Math.random() * variations.length)];
        });
      }
    },
    {
      name: 'IndexManipulation',
      description: 'Alters array/matrix indexing',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/(\w+)\[([^\]]+)\]/g, (match, arr, index) => {
          const manipulations = [
            `${arr}[(${index} + 1) % len(${arr})]`,
            `${arr}[max(0, ${index} - 1)]`,
            `${arr}[${index} // 2]`,
            `${arr}[${index}]` // No change but might confuse when combined with other bugs
          ];
          return manipulations[Math.floor(Math.random() * manipulations.length)];
        });
      }
    },
    {
      name: 'PrecisionError',
      description: 'Introduces floating point precision issues',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/(\d+\.?\d*)/g, match => {
          const num = parseFloat(match);
          if (num > 1) {
            return [num * 0.99, num * 1.01, num + 0.1, num - 0.1][
              Math.floor(Math.random() * 4)
            ].toFixed(2);
          }
          return match;
        });
      }
    },
    {
      name: 'ConcurrencySimulation',
      description: 'Simulates race conditions in single-threaded code',
      difficulty: 'expert',
      inject: code => {
        const lines = code.split('\n');
        const vars = new Set();
        
        // Find all variable assignments
        lines.forEach(line => {
          const match = line.match(/(\w+)\s*=/);
          if (match) vars.add(match[1]);
        });
  
        if (vars.size > 0) {
          const randomVar = Array.from(vars)[
            Math.floor(Math.random() * vars.size)
          ];
          const insertLine = lines.findIndex(line => 
            line.includes(`${randomVar} =`)
          );
          
          if (insertLine !== -1) {
            lines.splice(
              insertLine + 1,
              0,
              `    ${randomVar} = ${randomVar} ${['+', '-', '*', '//'][
                Math.floor(Math.random() * 4)
              ]} 1  # Injected race condition simulation`
            );
          }
        }
        
        return lines.join('\n');
      }
    },
    {
      name: 'MemoryLeakSimulation',
      description: 'Simulates memory leaks by preventing garbage collection',
      difficulty: 'expert',
      inject: code => {
        if (code.includes('class ')) {
          return code.replace(/class (\w+)/g, (match, clsName) => {
            return `${match}\n    _instance_cache = []  # Simulated memory leak\n`;
          });
        }
        return code.replace(/(def \w+\([^)]*\):)/g, (match, fnDef) => {
          return `${fnDef}\n    cache = []  # Simulated memory leak\n`;
        });
      }
    }
  ];