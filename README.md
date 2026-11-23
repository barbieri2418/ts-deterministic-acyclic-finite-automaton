# ts-deterministic-acyclic-finite-automaton

A minimal deterministic acyclic finite automaton (DAFSA) for compact storage and fast membership testing of a fixed set of strings.

```js
import { DeterministicAcyclicFiniteAutomaton } from './src/index.js';

const dafsa = new DeterministicAcyclicFiniteAutomaton(['car', 'cat', 'dog']);

dafsa.has('car'); // true
dafsa.has('cow'); // false
dafsa.words();    // ['car', 'cat', 'dog']
```

## Why this exists

Storing a large set of strings as a plain array or a hash set costs memory proportional to the total number of characters. A DAFSA shares both prefixes and suffixes, so a set like `['bar', 'car']` stores the shared `ar` suffix once. The trade-off is construction time: building the automaton is O(total input length) but requires a minimisation pass, and the resulting structure is immutable. For read-heavy workloads with a fixed vocabulary this is a clear win; for a set that changes frequently, a hash set is simpler.

## Edge case: the empty string

The empty string is a valid word. `new DeterministicAcyclicFiniteAutomaton([''])` produces an automaton whose root is final, so `has('')` returns `true`. If you never want to match the empty string, filter it out before constructing the automaton.

## API

- `new DeterministicAcyclicFiniteAutomaton(words)` — `words` is any iterable of strings. Duplicates are ignored. Non-string entries throw a `TypeError`.
- `has(word)` — returns `true` if `word` is in the language. Throws a `TypeError` for non-strings.
- `words()` — returns all words in lexicographic order as a fresh array.
- `stateCount()` — returns the number of distinct states in the minimised automaton, including the root.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

