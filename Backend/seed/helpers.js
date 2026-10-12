// Small generators/parsers shared by the seed problem sets.
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const arr = (rng, n, a, b) => Array.from({ length: n }, () => ri(rng, a, b));
const word = (rng, n, alpha = 'abcdefghijklmnopqrstuvwxyz') =>
  Array.from({ length: n }, () => alpha[ri(rng, 0, alpha.length - 1)]).join('');
const shuffle = (rng, a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(rng, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const lines = (s) => s.split('\n');
const nums = (s) => s.trim().split(/\s+/).map(Number);
const J = (a) => a.join(' ');
const sortedArr = (rng, n, a, b) => arr(rng, n, a, b).sort((x, y) => x - y);
const distinct = (rng, n, a, b) => {
  const s = new Set();
  while (s.size < n) s.add(ri(rng, a, b));
  return [...s];
};
const grid = (rng, r, c, pOne) =>
  Array.from({ length: r }, () => Array.from({ length: c }, () => (rng() < pOne ? '1' : '0')).join(''));

// ── binary trees, LeetCode-style level order with "null" ──
const buildTree = (tok) => {
  if (!tok.length || tok[0] === 'null') return null;
  const mk = (v) => ({ v: Number(v), l: null, r: null });
  const root = mk(tok[0]);
  const q = [root];
  let i = 1;
  while (q.length && i < tok.length) {
    const n = q.shift();
    if (i < tok.length && tok[i] !== 'null') { n.l = mk(tok[i]); q.push(n.l); }
    i++;
    if (i < tok.length && tok[i] !== 'null') { n.r = mk(tok[i]); q.push(n.r); }
    i++;
  }
  return root;
};
const serializeTree = (root) => {
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    if (n === null) { out.push('null'); continue; }
    out.push(String(n.v));
    q.push(n.l, n.r);
  }
  while (out[out.length - 1] === 'null') out.pop();
  return out;
};
// random tree with n nodes and values in [lo, hi]
const randomTree = (rng, n, lo, hi) => {
  const nodes = [{ v: ri(rng, lo, hi), l: null, r: null }];
  while (nodes.length < n) {
    const p = nodes[ri(rng, 0, nodes.length - 1)];
    const side = rng() < 0.5 ? 'l' : 'r';
    if (p[side]) continue;
    p[side] = { v: ri(rng, lo, hi), l: null, r: null };
    nodes.push(p[side]);
  }
  return nodes[0];
};
const bstFrom = (values) => {
  let root = null;
  for (const v of values) {
    const node = { v, l: null, r: null };
    if (!root) { root = node; continue; }
    let c = root;
    for (;;) {
      if (v < c.v) { if (c.l) c = c.l; else { c.l = node; break; } }
      else if (c.r) c = c.r; else { c.r = node; break; }
    }
  }
  return root;
};
const treeInput = (root) => {
  const t = serializeTree(root);
  return `${t.length}\n${t.join(' ')}`;
};
const parseTreeInput = (inp) => buildTree(lines(inp.trim())[1].trim().split(/\s+/));

module.exports = {
  ri, arr, word, shuffle, lines, nums, J, sortedArr, distinct, grid,
  buildTree, serializeTree, randomTree, bstFrom, treeInput, parseTreeInput,
};
