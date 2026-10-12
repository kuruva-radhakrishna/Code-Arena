// Dev-time sanity check: re-solves every generated test with an independent
// implementation (brute force / known values) and reports any disagreement.
const { problems } = require('./problemSet');
const { buildTestCases } = require('./buildTestCases');

const nums = (s) => s.trim().split(/\s+/).map(Number);
const L = (s) => s.split('\n');
const by = Object.fromEntries(problems.map((p) => [p.problemName, p]));

const checks = {
  '3Sum Count': (inp) => {
    const a = nums(L(inp)[1]); const s = new Set();
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) for (let k = j + 1; k < a.length; k++)
      if (a[i] + a[j] + a[k] === 0) s.add([a[i], a[j], a[k]].sort((x, y) => x - y).join());
    return String(s.size);
  },
  'Partition Equal Subset Sum': (inp) => {
    const a = nums(L(inp)[1]); if (a.length > 22) return null;
    const t = a.reduce((x, y) => x + y, 0);
    for (let m = 0; m < 1 << a.length; m++) { let s = 0; for (let i = 0; i < a.length; i++) if (m >> i & 1) s += a[i]; if (s * 2 === t) return 'true'; }
    return 'false';
  },
  'Word Break': (inp) => {
    const [s, , w] = L(inp); const d = w.trim().split(/\s+/); const memo = new Map();
    const go = (i) => { if (i === s.length) return true; if (memo.has(i)) return memo.get(i);
      const r = d.some((x) => s.startsWith(x, i) && go(i + x.length)); memo.set(i, r); return r; };
    return String(go(0));
  },
  'Longest Increasing Subsequence': (inp) => {
    const t = []; for (const x of nums(L(inp)[1])) { let lo = 0, hi = t.length; while (lo < hi) { const m = (lo + hi) >> 1; if (t[m] < x) lo = m + 1; else hi = m; } t[lo] = x; }
    return String(t.length);
  },
  'Coin Change': (inp) => {
    const [, amt] = nums(L(inp)[0]); const c = nums(L(inp)[1]);
    let frontier = [0]; const seen = new Set([0]); let steps = 0;
    if (amt === 0) return '0';
    while (frontier.length) { steps++; const nx = [];
      for (const v of frontier) for (const k of c) { const w = v + k; if (w === amt) return String(steps); if (w < amt && !seen.has(w)) { seen.add(w); nx.push(w); } }
      frontier = nx; }
    return '-1';
  },
  'Edit Distance': (inp) => {
    const [a, b] = L(inp.trim()); const memo = new Map();
    const go = (i, j) => { if (i === a.length) return b.length - j; if (j === b.length) return a.length - i;
      const k = i * 1000 + j; if (memo.has(k)) return memo.get(k);
      const r = a[i] === b[j] ? go(i + 1, j + 1) : 1 + Math.min(go(i + 1, j), go(i, j + 1), go(i + 1, j + 1)); memo.set(k, r); return r; };
    return String(go(0, 0));
  },
  'Network Delay Time': (inp) => {
    const [h, ...e] = L(inp.trim()); const [n, , k] = nums(h); const E = e.filter(Boolean).map(nums);
    const d = Array(n + 1).fill(Infinity); d[k] = 0; const done = Array(n + 1).fill(false);
    for (let it = 0; it < n; it++) { let u = -1; for (let i = 1; i <= n; i++) if (!done[i] && (u < 0 || d[i] < d[u])) u = i;
      if (u < 0 || d[u] === Infinity) break; done[u] = true; for (const [a, b, w] of E) if (a === u && d[u] + w < d[b]) d[b] = d[u] + w; }
    const m = Math.max(...d.slice(1)); return String(m === Infinity ? -1 : m);
  },
  'Search in Rotated Sorted Array': (inp) => {
    const [n, t] = nums(L(inp)[0]); const a = nums(L(inp)[1]);
    let lo = 0, hi = n - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (a[m] === t) return String(m);
      if (a[lo] <= a[m]) { if (a[lo] <= t && t < a[m]) hi = m - 1; else lo = m + 1; } else { if (a[m] < t && t <= a[hi]) lo = m + 1; else hi = m - 1; } }
    return '-1';
  },
  'N-Queens Count': (inp) => String([0, 1, 0, 0, 2, 10, 4, 40, 92, 352, 724][Number(inp)]),
  'Count Primes': (inp) => { const n = Number(inp); let c = 0; for (let i = 2; i < n; i++) { let p = true; for (let j = 2; j * j <= i; j++) if (i % j === 0) { p = false; break; } if (p) c++; } return n > 200000 ? null : String(c); },
  'Longest Valid Parentheses': (inp) => {
    const s = inp.trim(); const st = [-1]; let best = 0;
    for (let i = 0; i < s.length; i++) { if (s[i] === '(') st.push(i); else { st.pop(); if (!st.length) st.push(i); else best = Math.max(best, i - st[st.length - 1]); } }
    return String(best);
  },
  'Trapping Rain Water': (inp) => {
    const h = nums(L(inp)[1]); let l = 0, r = h.length - 1, lm = 0, rm = 0, t = 0;
    while (l < r) { if (h[l] < h[r]) { lm = Math.max(lm, h[l]); t += lm - h[l]; l++; } else { rm = Math.max(rm, h[r]); t += rm - h[r]; r--; } }
    return String(t);
  },
  'Container With Most Water': (inp) => {
    const h = nums(L(inp)[1]); let l = 0, r = h.length - 1, b = 0;
    while (l < r) { b = Math.max(b, Math.min(h[l], h[r]) * (r - l)); if (h[l] < h[r]) l++; else r--; }
    return String(b);
  },
  'Daily Temperatures': (inp) => {
    const t = nums(L(inp)[1]); const res = t.map(() => 0); const st = [];
    t.forEach((x, i) => { while (st.length && t[st[st.length - 1]] < x) { const j = st.pop(); res[j] = i - j; } st.push(i); });
    return res.join(' ');
  },
};

let bad = 0, checked = 0;
for (const [name, fn] of Object.entries(checks)) {
  for (const tc of buildTestCases(by[name])) {
    const alt = fn(tc.input); if (alt === null) continue; checked++;
    if (alt !== tc.output) { bad++; console.log(`MISMATCH ${name}\n${tc.input}\nref=${tc.output} alt=${alt}`); }
  }
}
// spot values from the statements
const spot = { 'Count Primes|10': '4', 'Count Primes|1000000': '78498', 'Fibonacci Number|90': '2880067194370816120',
  'Unique Paths|16 16': '155117520', 'Roman to Integer|MCMXCIV': '1994', 'Edit Distance|horse\nros': '3', 'Median of Two Sorted Arrays|2 2\n1 2\n3 4': '2.5' };
for (const [k, v] of Object.entries(spot)) { const [n, i] = k.split('|'); const got = by[n].solve(i); checked++; if (got !== v) { bad++; console.log('SPOT FAIL', k, got, v); } }
console.log(`checked ${checked} cases, ${bad} mismatches`);
process.exitCode = bad ? 1 : 0;
