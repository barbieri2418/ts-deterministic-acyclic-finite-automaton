import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicAcyclicFiniteAutomaton } from '../src/index.js';

test('empty set has no words', () => {
  const dafsa = new DeterministicAcyclicFiniteAutomaton([]);
  assert.equal(dafsa.has(''), false);
  assert.equal(dafsa.has('a'), false);
  assert.deepEqual(dafsa.words(), []);
});

test('single word', () => {
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['cat']);
  assert.equal(dafsa.has('cat'), true);
  assert.equal(dafsa.has('ca'), false);
  assert.equal(dafsa.has('cats'), false);
  assert.equal(dafsa.has(''), false);
  assert.deepEqual(dafsa.words(), ['cat']);
});

test('empty string as a word', () => {
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['', 'a']);
  assert.equal(dafsa.has(''), true);
  assert.equal(dafsa.has('a'), true);
  assert.equal(dafsa.has('b'), false);
  assert.deepEqual(dafsa.words(), ['', 'a']);
});

test('shared prefixes are stored once', () => {
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['car', 'cat', 'dog']);
  assert.equal(dafsa.has('car'), true);
  assert.equal(dafsa.has('cat'), true);
  assert.equal(dafsa.has('dog'), true);
  assert.equal(dafsa.has('cow'), false);
  assert.equal(dafsa.has('ca'), false);
  assert.deepEqual(dafsa.words(), ['car', 'cat', 'dog']);
});

test('shared suffixes are merged', () => {
  // 'bar' and 'car' share the suffix 'ar'. The minimised automaton should
  // have fewer states than the trie would.
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['bar', 'car']);
  assert.equal(dafsa.has('bar'), true);
  assert.equal(dafsa.has('car'), true);
  assert.equal(dafsa.has('far'), false);
  // Trie has: root, b, a, r, c (5 states) plus final r. Minimised merges
  // the 'a'->'r' path, so states should be fewer than 5.
  assert.ok(dafsa.stateCount() < 5, `expected fewer than 5 states, got ${dafsa.stateCount()}`);
});

test('duplicate words are ignored', () => {
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['a', 'a', 'b', 'a']);
  assert.deepEqual(dafsa.words(), ['a', 'b']);
  assert.equal(dafsa.has('a'), true);
  assert.equal(dafsa.has('b'), true);
});

test('unicode characters are handled as code points', () => {
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['café', 'cafe']);
  assert.equal(dafsa.has('café'), true);
  assert.equal(dafsa.has('cafe'), true);
  assert.equal(dafsa.has('caf'), false);
  assert.deepEqual(dafsa.words(), ['cafe', 'café']);
});

test('non-string input throws', () => {
  assert.throws(() => new DeterministicAcyclicFiniteAutomaton([1]), TypeError);
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['a']);
  assert.throws(() => dafsa.has(1), TypeError);
});

test('words returns a fresh array each call', () => {
  const dafsa = new DeterministicAcyclicFiniteAutomaton(['x']);
  const first = dafsa.words();
  first.push('y');
  assert.deepEqual(dafsa.words(), ['x']);
});

test('large set membership', () => {
  const words = [];
  for (let i = 0; i < 1000; i++) {
    words.push('word' + i);
  }
  const dafsa = new DeterministicAcyclicFiniteAutomaton(words);
  assert.equal(dafsa.has('word0'), true);
  assert.equal(dafsa.has('word999'), true);
  assert.equal(dafsa.has('word1000'), false);
  assert.equal(dafsa.words().length, 1000);
});
