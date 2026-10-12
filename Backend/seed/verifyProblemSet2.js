// Second sanity pass for sets 2-4: re-solves tests with independent implementations.
const { buildTestCases } = require('./buildTestCases');
const all = [
  ...require('./problemSet').problems,
  ...require('./problemSet2').problems,
  ...require('./problemSet3').problems,
  ...require('./problemSet4').problems,
];
const by = Object.fromEntries(all.map((p) => [p.problemName, p]));
const nums = (s) => s.trim().split(/\s+/).map(Number);
const L = (s) => s.split('\n');

const checks = {
  'Jump Game II': (inp) => {
    const a = nums(L(inp)[1]); const n = a.length;
    const d = Array(n).fill(Infinity); d[0] = 0;
    for (let i = 0; i < n; i++) for (let j = 1; j <= a[i] && i + j < n; j++) d[i + j] = Math.min(d[i + j], d[i] + 1);
    return String(d[n - 1]);
  },
  'Jump Game': (inp) => {
    const a = nums(L(inp)[1]);
    const ok = Array(a.length).fill(false); ok[a.length - 1] = true;
    for (let i = a.length - 2; i >= 0; i--) for (let j = 1; j <= a[i] && i + j < a.length; j++) if (ok[i + j]) { ok[i] = true; break; }
    return String(ok[0]);
  },
  'Decode Ways': (inp) => {
    const s = inp.trim(); const m = new Map();
    const go = (i) => {
      if (i === s.length) return 1n;
      if (s[i] === '0') return 0n;
      if (m.has(i)) return m.get(i);
      let r = go(i + 1);
      if (i + 1 < s.length && Number(s.slice(i, i + 2)) <= 26) r += go(i + 2);
      m.set(i, r); return r;
    };
    return go(0).toString();
  },
  'Next Permutation': (inp) => {
    const a = nums(L(inp)[1]);
    if (a.length > 8) return null;
    const perms = new Set();
    const rec = (cur, rest) => { if (!rest.length) { perms.add(cur.join(' ')); return; } rest.forEach((x, i) => rec([...cur, x], rest.filter((_, j) => j !== i))); };
    rec([], a);
    const sorted = [...perms].map((p) => p.split(' ').map(Number)).sort((x, y) => { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; }).map((x) => x.join(' '));
    return sorted[(sorted.indexOf(a.join(' ')) + 1) % sorted.length];
  },
  'Koko Eating Bananas': (inp) => {
    const [, h] = nums(L(inp)[0]); const p = nums(L(inp)[1]);
    if (Math.max(...p) > 5000) return null;
    for (let k = 1; ; k++) if (p.reduce((s, x) => s + Math.ceil(x / k), 0) <= h) return String(k);
  },
  'Capacity To Ship Packages Within D Days': (inp) => {
    const [, d] = nums(L(inp)[0]); const w = nums(L(inp)[1]);
    for (let c = Math.max(...w); ; c++) {
      let n = 1, cur = 0;
      for (const x of w) { if (cur + x > c) { n++; cur = 0; } cur += x; }
      if (n <= d) return String(c);
    }
  },
  'Split Array Largest Sum': (inp) => {
    const [n, m] = nums(L(inp)[0]); const a = nums(L(inp)[1]);
    if (n > 200) return null;
    const pre = [0]; a.forEach((x) => pre.push(pre[pre.length - 1] + x));
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(Infinity)); dp[0][0] = 0;
    for (let k = 1; k <= m; k++) for (let i = 1; i <= n; i++) for (let j = 0; j < i; j++) dp[k][i] = Math.min(dp[k][i], Math.max(dp[k - 1][j], pre[i] - pre[j]));
    return String(dp[m][n]);
  },
  'Burst Balloons': (inp) => {
    const a = nums(L(inp)[1]);
    if (a.length > 11) return null;
    const m = new Map();
    const go = (arr) => {
      if (!arr.length) return 0;
      const k = arr.join(); if (m.has(k)) return m.get(k);
      let best = 0;
      arr.forEach((x, i) => { best = Math.max(best, (arr[i - 1] ?? 1) * x * (arr[i + 1] ?? 1) + go([...arr.slice(0, i), ...arr.slice(i + 1)])); });
      m.set(k, best); return best;
    };
    return String(go(a));
  },
  'Wildcard Matching': (inp) => {
    const [s, p] = L(inp.trim());
    return String(new RegExp('^' + p.replace(/\?/g, '.').replace(/\*/g, '.*') + '$').test(s));
  },
  'Regular Expression Matching': (inp) => {
    const [s, p] = L(inp.trim());
    return String(new RegExp('^(?:' + p + ')$').test(s));
  },
  'Minimum Window Substring': (inp) => {
    const [s, t] = L(inp.trim());
    if (s.length > 40) return null;
    const need = (x) => { const c = {}; for (const ch of x) c[ch] = (c[ch] || 0) + 1; return c; };
    const nt = need(t);
    for (let len = t.length; len <= s.length; len++) for (let i = 0; i + len <= s.length; i++) {
      const w = need(s.slice(i, i + len));
      if (Object.keys(nt).every((k) => (w[k] || 0) >= nt[k])) return s.slice(i, i + len);
    }
    return '-1';
  },
  'Candy': (inp) => {
    const r = nums(L(inp)[1]); const c = r.map(() => 1);
    let ch = true;
    while (ch) {
      ch = false;
      for (let i = 0; i < r.length; i++) {
        if (i && r[i] > r[i - 1] && c[i] <= c[i - 1]) { c[i] = c[i - 1] + 1; ch = true; }
        if (i < r.length - 1 && r[i] > r[i + 1] && c[i] <= c[i + 1]) { c[i] = c[i + 1] + 1; ch = true; }
      }
    }
    return String(c.reduce((a, b) => a + b, 0));
  },
  'Meeting Rooms II': (inp) => {
    const iv = L(inp.trim()).slice(1).map(nums); let best = 0;
    for (let t = 0; t < 80; t++) best = Math.max(best, iv.filter(([s, e]) => s <= t && t < e).length);
    return String(best);
  },
  'Non-overlapping Intervals': (inp) => {
    const iv = L(inp.trim()).slice(1).map(nums).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (iv.length > 400) return null;
    const dp = iv.map(() => 1);
    for (let i = 0; i < iv.length; i++) for (let j = 0; j < i; j++) if (iv[j][1] <= iv[i][0]) dp[i] = Math.max(dp[i], dp[j] + 1);
    return String(iv.length - Math.max(...dp));
  },
  'Cheapest Flights Within K Stops': (inp) => {
    const [h, ...e] = L(inp.trim()); const [, , src, dst, k] = nums(h);
    const E = e.filter(Boolean).map(nums);
    if (E.length > 40) return null;
    let best = Infinity;
    const go = (u, stops, cost) => {
      if (u === dst) best = Math.min(best, cost);
      if (stops > k || cost >= best) return;
      for (const [a, b, w] of E) if (a === u) go(b, stops + 1, cost + w);
    };
    go(src, 0, 0);
    return String(best === Infinity ? -1 : best);
  },
  'Palindrome Partitioning II': (inp) => {
    const s = inp.trim();
    if (s.length > 40) return null;
    const isP = (x) => x === [...x].reverse().join('');
    const m = new Map();
    const go = (i) => {
      if (i === s.length) return -1;
      if (m.has(i)) return m.get(i);
      let b = Infinity;
      for (let j = i + 1; j <= s.length; j++) if (isP(s.slice(i, j))) b = Math.min(b, 1 + go(j));
      m.set(i, b); return b;
    };
    return String(go(0));
  },
  'Generate Parentheses Count': (inp) => {
    const n = Number(inp.trim());
    if (n > 12) return null;
    let c = 0;
    const go = (o, cl) => { if (o === n && cl === n) { c++; return; } if (o < n) go(o + 1, cl); if (cl < o) go(o, cl + 1); };
    go(0, 0);
    return String(c);
  },
  'Coin Change II (Count Ways)': (inp) => {
    const [, amt] = nums(L(inp)[0]); const c = nums(L(inp)[1]);
    if (amt > 200) return null;
    const m = new Map();
    const go = (i, r) => {
      if (r === 0) return 1n;
      if (i === c.length || r < 0) return 0n;
      const k = i * 10000 + r; if (m.has(k)) return m.get(k);
      const v = go(i, r - c[i]) + go(i + 1, r);
      m.set(k, v); return v;
    };
    return go(0, amt).toString();
  },
  'Course Schedule': (inp) => {
    const [h, ...e] = L(inp.trim()); const [n] = nums(h);
    const adj = Array.from({ length: n }, () => []);
    e.filter(Boolean).map(nums).forEach(([a, b]) => adj[a].push(b));
    const st = Array(n).fill(0);
    const cyc = (u) => { st[u] = 1; for (const v of adj[u]) if (st[v] === 1 || (st[v] === 0 && cyc(v))) return true; st[u] = 2; return false; };
    for (let i = 0; i < n; i++) if (st[i] === 0 && cyc(i)) return 'false';
    return 'true';
  },
  'Triangle': (inp) => {
    const t = L(inp.trim()).slice(1).map(nums); const m = new Map();
    const go = (i, j) => {
      if (i === t.length) return 0;
      const k = i * 1000 + j; if (m.has(k)) return m.get(k);
      const v = t[i][j] + Math.min(go(i + 1, j), go(i + 1, j + 1));
      m.set(k, v); return v;
    };
    return String(go(0, 0));
  },
  'First Missing Positive': (inp) => {
    const a = nums(L(inp)[1]); const n = a.length;
    for (let i = 0; i < n; i++) while (a[i] > 0 && a[i] <= n && a[a[i] - 1] !== a[i]) { const j = a[i] - 1; [a[i], a[j]] = [a[j], a[i]]; }
    for (let i = 0; i < n; i++) if (a[i] !== i + 1) return String(i + 1);
    return String(n + 1);
  },
  'Fruit Into Baskets': (inp) => {
    const a = nums(L(inp)[1]); let best = 0;
    for (let i = 0; i < a.length; i++) {
      const s = new Set(); let j = i;
      while (j < a.length && (s.has(a[j]) || s.size < 2)) { s.add(a[j]); j++; }
      best = Math.max(best, j - i);
    }
    return String(best);
  },
  'Longest Increasing Path in a Matrix': (inp) => {
    const [h, ...rows] = L(inp.trim()); const [r, c] = nums(h); const m = rows.map(nums); const memo = new Map();
    const go = (i, j) => {
      const k = i * 1000 + j; if (memo.has(k)) return memo.get(k);
      let b = 1;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = i + dx, y = j + dy; if (x >= 0 && y >= 0 && x < r && y < c && m[x][y] > m[i][j]) b = Math.max(b, 1 + go(x, y)); });
      memo.set(k, b); return b;
    };
    let a = 0;
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) a = Math.max(a, go(i, j));
    return String(a);
  },
  'Word Ladder': (inp) => {
    const [b, e, , w] = L(inp.trim()); const list = w.trim().split(/\s+/);
    const diff1 = (x, y) => [...x].filter((ch, i) => ch !== y[i]).length === 1;
    if (b === e) return '1';
    let layer = [b]; const seen = new Set([b]); let steps = 1;
    while (layer.length) {
      steps++; const nx = [];
      for (const u of layer) for (const v of list) if (!seen.has(v) && diff1(u, v)) { if (v === e) return String(steps); seen.add(v); nx.push(v); }
      layer = nx;
    }
    return '0';
  },
};

let bad = 0, checked = 0;
for (const [name, fn] of Object.entries(checks)) {
  if (!by[name]) { console.log('MISSING PROBLEM', name); bad++; continue; }
  for (const tc of buildTestCases(by[name])) {
    const alt = fn(tc.input);
    if (alt === null) continue;
    checked++;
    if (alt !== tc.output) { bad++; console.log(`MISMATCH ${name}\n${tc.input.slice(0, 200)}\nref=${tc.output} alt=${alt}`); }
  }
}
console.log(`checked ${checked} cases across ${Object.keys(checks).length} problems, ${bad} mismatches`);
process.exitCode = bad ? 1 : 0;
