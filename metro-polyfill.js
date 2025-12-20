// Polyfill para toReversed() se não estiver disponível (Node.js < 20)
// Este arquivo deve ser carregado antes de qualquer código que use toReversed()
if (typeof Array.prototype.toReversed === 'undefined') {
  Array.prototype.toReversed = function() {
    const arr = Array.from(this);
    arr.reverse();
    return arr;
  };
}

