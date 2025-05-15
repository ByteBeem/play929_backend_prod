module.exports = [
    {
      name: 'OffByOneLoop',
      description: 'Loop runs one iteration too few or too many',
      difficulty: 'easy nyana',
      inject: code => {
        return code.replace(/for (.+?) in (.+?):/g, (match, vars, iter) => {
          return Math.random() < 0.5 
            ? `for ${vars} in ${iter}[:-1]:` 
            : `for ${vars} in ${iter} + [None]:`;
        });
      }
    },
    {
      name: 'CaseSensitivityBug',
      description: 'Adds case sensitivity issues',
      difficulty: 'easy nyana',
      inject: code => {
        return code.replace(/\.lower\(\)/g, '');
      }
    },
    {
      name: 'ComparisonFlip',
      description: 'Flips comparison operators in subtle ways',
      difficulty: 'easy nyana',
      inject: code => {
        return code.replace(/([<>]=?)=/g, (match, op) => {
          const flips = {
            '<': '>',
            '>': '<',
            '<=': '>=',
            '>=': '<='
          };
          return flips[op] || match;
        });
      }
    },
    {
      name: 'EdgeCaseMiss',
      description: 'Misses edge cases by small margins',
      difficulty: 'easy nyana',
      inject: code => {
        return code.replace(/if not (.+?):/g, 'if len($1) == 1:')
                 .replace(/if (.+?):/g, 'if $1 and False:');
      }
    },
    {
      name: 'IncorrectInitialization',
      description: 'Initializes variables incorrectly',
      difficulty: 'easy nyana',
      inject: code => {
        return code.replace(/= 0/g, '= 1')
                 .replace(/= \[\];/g, '= [None];')
                 .replace(/= None/g, '= ""');
      }
    }
  ];