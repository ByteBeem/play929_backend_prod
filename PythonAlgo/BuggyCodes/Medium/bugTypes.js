module.exports = [
    {
      name: 'BoundaryCondition',
      description: 'Alters boundary conditions in loops',
      difficulty: 'medium',
      inject: code => {
        return code.replace(/(while|for) \((.+?) < (.+?)\)/g, (match, loopType, var1, var2) => {
          return `${loopType} (${var1} <= ${var2})`;
        });
      }
    },
    {
      name: 'IncorrectFormula',
      description: 'Modifies mathematical formulas slightly',
      difficulty: 'medium',
      inject: code => {
        return code.replace(/(\d+) \*\* (\d+)/g, (match, num, exp) => {
          return `${num} * ${exp}`;
        }).replace(/\/\/ 2/g, '/ 2');
      }
    },
    {
      name: 'StringOperationBug',
      description: 'Introduces string operation errors',
      difficulty: 'medium',
      inject: code => {
        return code.replace(/\.split\('@'\)/g, ".split('@', 1)")
                 .replace(/\.count\(/g, ".find(");
      }
    },
    {
      name: 'IndexOffByOne',
      description: 'Changes indices by ±1',
      difficulty: 'medium',
      inject: code => {
        return code.replace(/(\w+)\[(\w+)\]/g, (match, arr, idx) => {
          return Math.random() < 0.5 
            ? `${arr}[${idx} + 1]`
            : `${arr}[${idx} - 1]`;
        });
      }
    },
    {
      name: 'LogicInversion',
      description: 'Inverts logical conditions subtly',
      difficulty: 'medium',
      inject: code => {
        return code.replace(/if \((.+?) < (.+?)\)/g, "if ($1 > $2)")
                 .replace(/if \((.+?) == (.+?)\)/g, "if ($1 != $2)");
      }
    }
  ];