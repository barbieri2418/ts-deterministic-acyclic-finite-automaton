// Core implementation of a minimal deterministic acyclic finite automaton (DAFSA).
// The design deliberately keeps the automaton immutable after construction:
// minimisation is done once, and the resulting structure is shared safely.

/**
 * A node in the automaton. Each node has a map from character to child node.
 * The `final` flag marks the end of a word.
 *
 * Nodes are interned by their (final, transitions) signature during minimisation,
 * so structurally identical nodes are the same object. This is what makes the
 * automaton minimal and allows equality checks by reference.
 */
class Node {
  constructor() {
    /** @type {Map<string, Node>} */
    this.transitions = new Map();
    /** @type {boolean} */
    this.final = false;
  }
}

/**
 * Deterministic acyclic finite automaton (DAFSA) for a finite set of strings.
 *
 * The automaton is built by inserting all strings into a trie, then minimising
 * it bottom-up. Because the language is finite, the trie is acyclic, and the
 * standard DAG minimisation algorithm applies: two subtrees are equivalent if
 * they have the same final flag and the same outgoing transitions (recursively).
 *
 * The resulting structure is a DAG where each distinct suffix is stored once.
 * Membership testing is O(length of input).
 */
export class DeterministicAcyclicFiniteAutomaton {
  /**
   * @param {Iterable<string>} words
   */
  constructor(words) {
    const root = new Node();
    for (const word of words) {
      if (typeof word !== 'string') {
        throw new TypeError('all words must be strings');
      }
      this._insert(root, word);
    }
    // Minimise the trie into a DAG. `_minimise` returns the canonical root.
    this._root = this._minimise(root);
  }

  /**
   * Insert a word into the trie rooted at `root`.
   * @param {Node} root
   * @param {string} word
   */
  _insert(root, word) {
    let node = root;
    for (const ch of word) {
      let next = node.transitions.get(ch);
      if (next === undefined) {
        next = new Node();
        node.transitions.set(ch, next);
      }
      node = next;
    }
    node.final = true;
  }

  /**
   * Minimise a trie by merging equivalent subtrees.
   *
   * The algorithm is post-order: children are minimised first, then the parent
   * is replaced by a canonical representative for its signature. Interning is
   * done with a Map keyed by a string that encodes the final flag and the
   * sorted transitions. Sorting is required for a canonical key; the alphabet
   * is small in practice, so the cost is acceptable.
   *
   * @param {Node} node
   * @returns {Node}
   */
  _minimise(node) {
    // Recursively minimise children first.
    for (const [ch, child] of node.transitions) {
      node.transitions.set(ch, this._minimise(child));
    }
    const key = this._signature(node);
    let canonical = this._intern.get(key);
    if (canonical === undefined) {
      canonical = node;
      this._intern.set(key, canonical);
    }
    return canonical;
  }

  /**
   * Build a canonical string signature for a node.
   * The signature is (final ? '1' : '0') followed by each transition in
   * sorted order, encoded as `ch + ':' + childId + ';'`.
   * Child identity is the signature of the child, but to avoid unbounded
   * recursion we use the child's own signature string, which is already
   * canonical because children were processed first.
   *
   * @param {Node} node
   * @returns {string}
   */
  _signature(node) {
    const parts = [node.final ? '1' : '0'];
    const chars = Array.from(node.transitions.keys()).sort();
    for (const ch of chars) {
      const child = node.transitions.get(ch);
      parts.push(ch + ':' + this._signature(child) + ';');
    }
    return parts.join('');
  }

  /**
   * @type {Map<string, Node>}
   * @private
   */
  _intern = new Map();

  /**
   * Test whether `word` is in the language.
   * @param {string} word
   * @returns {boolean}
   */
  has(word) {
    if (typeof word !== 'string') {
      throw new TypeError('word must be a string');
    }
    let node = this._root;
    for (const ch of word) {
      const next = node.transitions.get(ch);
      if (next === undefined) {
        return false;
      }
      node = next;
    }
    return node.final;
  }

  /**
   * Number of distinct states in the minimised automaton, including the root.
   * Useful for verifying that minimisation actually compressed the structure.
   * @returns {number}
   */
  stateCount() {
    const seen = new Set();
    const stack = [this._root];
    while (stack.length > 0) {
      const node = stack.pop();
      if (seen.has(node)) {
        continue;
      }
      seen.add(node);
      for (const child of node.transitions.values()) {
        stack.push(child);
      }
    }
    return seen.size;
  }

  /**
   * Enumerate all words in the language in lexicographic order.
   * The automaton is acyclic, so a simple DFS with backtracking works.
   * @returns {string[]}
   */
  words() {
    const result = [];
    const path = [];
    const visit = (node) => {
      if (node.final) {
        result.push(path.join(''));
      }
      const chars = Array.from(node.transitions.keys()).sort();
      for (const ch of chars) {
        path.push(ch);
        visit(node.transitions.get(ch));
        path.pop();
      }
    };
    visit(this._root);
    return result;
  }
}
