// Script wrapper para carregar polyfill antes do EAS Update
// Polyfill para toReversed() se não estiver disponível (Node.js < 20)
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

// Executar o comando EAS Update
const { execSync } = require('child_process');
const args = process.argv.slice(2).join(' ');
execSync(`eas update ${args}`, { stdio: 'inherit' });

