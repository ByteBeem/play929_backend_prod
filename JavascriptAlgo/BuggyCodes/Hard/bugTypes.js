module.exports = [
    {
      name: 'PrototypePollution',
      description: 'Introduces prototype pollution vulnerabilities',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/for \(const key in obj\) \{/g, 
          `for (const key in obj) {\nif (key === '__proto__') continue;`);
      }
    },
    {
      name: 'MemoryLeak',
      description: 'Creates potential memory leaks',
      difficulty: 'hard',
      inject: code => {
        return code.replace(
          /(const (\w+) = new \w+\(\))/g,
          `$1;\nglobalThis.__leaks = globalThis.__leaks || [];\nglobalThis.__leaks.push($2);`
        );
      }
    },
    
    
    {
      name: 'RaceCondition',
      description: 'Introduces race conditions',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/\.then\(result => \{/g, 
          `.then(async result => {\nawait new Promise(res => setTimeout(res, Math.random() * 100));`);
      }
    },
    {
      name: 'AsyncContextLoss',
      description: 'Loses async context',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/fn\.apply\(this, args\)/g, 
          'fn(...args)');
      }
    },
    {
      name: 'BoundaryOverflow',
      description: 'Causes boundary overflows',
      difficulty: 'hard',
      inject: code => {
        return code.replace(/let right = arr\.length - 1;/g, 
          'let right = arr.length;');
      }
    }
  ];