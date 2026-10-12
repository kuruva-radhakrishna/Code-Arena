// Seed set 4: hard problems.
const { ri, arr, word, lines, nums, J } = require('./helpers');

const problems = [
  {
    problemName: 'Minimum Window Substring',
    difficulty: 'hard',
    topics: ['string', 'sliding window', 'hash table'],
    description: `Find the smallest substring of \`s\` that contains **every character of \`t\`** (with multiplicity). If several windows have the minimum length, print the leftmost one.

**Input Format**

- Line 1: string \`s\`.
- Line 2: string \`t\`.

**Output Format**

Print the window, or \`-1\` if none exists.`,
    constraints: ['1 <= |s|, |t| <= 10^5', 'Letters only (case-sensitive)'],
    hints: ['Expand the right edge until the window is valid, then shrink the left edge as far as possible, recording the best window.'],
    tests: ['ADOBECODEBANC\nABC', 'a\na', 'a\naa', 'aab\naab'],
    gen: (rng, big) => `${word(rng, big ? 3000 : ri(rng, 3, 16), 'abcAB')}\n${word(rng, ri(rng, 1, 4), 'abcAB')}`,
    solve: (inp) => {
      const [s, t] = lines(inp.trim());
      const need = {};
      for (const c of t) need[c] = (need[c] || 0) + 1;
      let missing = t.length, l = 0, bestL = -1, bestLen = Infinity;
      for (let r = 0; r < s.length; r++) {
        if (need[s[r]]-- > 0) missing--;
        while (missing === 0) {
          if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
          if (++need[s[l]] > 0) missing++;
          l++;
        }
      }
      return bestL < 0 ? '-1' : s.slice(bestL, bestL + bestLen);
    },
  },
  {
    problemName: 'Wildcard Matching',
    difficulty: 'hard',
    topics: ['dynamic programming', 'string', 'greedy'],
    description: `Match the **entire** string \`s\` against pattern \`p\`, where \`?\` matches any single character and \`*\` matches any sequence of characters (including the empty one).

**Input Format**

- Line 1: string \`s\` (lowercase letters).
- Line 2: pattern \`p\` (lowercase letters, \`?\` and \`*\`).

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= |s|, |p| <= 2000'],
    hints: ['dp[i][j]: do the first i chars of s match the first j chars of p? A "*" either matches nothing (dp[i][j-1]) or one more char (dp[i-1][j]).'],
    tests: ['aa\na', 'aa\n*', 'cb\n?a', 'adceb\n*a*b', 'acdcb\na*c?b'],
    gen: (rng, big) => `${word(rng, big ? 300 : ri(rng, 1, 8), 'ab')}\n${word(rng, big ? 40 : ri(rng, 1, 6), 'ab?*')}`,
    solve: (inp) => {
      const [s, p] = lines(inp.trim());
      const dp = Array.from({ length: s.length + 1 }, () => Array(p.length + 1).fill(false));
      dp[0][0] = true;
      for (let j = 1; j <= p.length; j++) if (p[j - 1] === '*') dp[0][j] = dp[0][j - 1];
      for (let i = 1; i <= s.length; i++) for (let j = 1; j <= p.length; j++)
        dp[i][j] = p[j - 1] === '*' ? dp[i][j - 1] || dp[i - 1][j] : (p[j - 1] === '?' || p[j - 1] === s[i - 1]) && dp[i - 1][j - 1];
      return String(dp[s.length][p.length]);
    },
  },
  {
    problemName: 'Regular Expression Matching',
    difficulty: 'hard',
    topics: ['dynamic programming', 'string', 'recursion'],
    description: `Implement matching of the **entire** string \`s\` against pattern \`p\` with these rules: \`.\` matches any single character and \`x*\` matches **zero or more** copies of the character \`x\` (or of any character when it is \`.*\`).

**Input Format**

- Line 1: string \`s\` (lowercase letters).
- Line 2: pattern \`p\` (lowercase letters, \`.\` and \`*\`; every \`*\` follows a letter or a dot).

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= |s| <= 30', '1 <= |p| <= 30'],
    hints: ['dp[i][j] = s[i..] matches p[j..]. If p[j+1] is "*", either skip the pair, or consume one matching char of s and stay on the same pair.'],
    tests: ['aa\na', 'aa\na*', 'ab\n.*', 'aab\nc*a*b', 'mississippi\nmis*is*p*.'],
    gen: (rng) => {
      let p = '';
      const k = ri(rng, 1, 4);
      for (let i = 0; i < k; i++) p += 'ab.'[ri(rng, 0, 2)] + (rng() < 0.45 ? '*' : '');
      return `${word(rng, ri(rng, 1, 7), 'ab')}\n${p}`;
    },
    solve: (inp) => {
      const [s, p] = lines(inp.trim());
      const memo = new Map();
      const go = (i, j) => {
        const key = i * 100 + j;
        if (memo.has(key)) return memo.get(key);
        let r;
        if (j === p.length) r = i === s.length;
        else {
          const first = i < s.length && (p[j] === '.' || p[j] === s[i]);
          r = p[j + 1] === '*' ? go(i, j + 2) || (first && go(i + 1, j)) : first && go(i + 1, j + 1);
        }
        memo.set(key, r);
        return r;
      };
      return String(go(0, 0));
    },
  },
  {
    problemName: 'Burst Balloons',
    difficulty: 'hard',
    topics: ['dynamic programming', 'array'],
    description: `You have \`n\` balloons with values \`nums[i]\`. Bursting balloon \`i\` earns \`nums[i-1] * nums[i] * nums[i+1]\` coins, where a neighbour that is out of range counts as \`1\`. After a burst the neighbours become adjacent. Find the **maximum coins** from bursting all balloons.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers.

**Output Format**

Print the maximum coins.`,
    constraints: ['1 <= n <= 300', '0 <= nums[i] <= 100'],
    hints: ['Think about which balloon bursts LAST in a range (l, r): its neighbours are then the fixed boundaries l and r.', 'dp[l][r] = max over k of dp[l][k] + dp[k][r] + a[l]*a[k]*a[r] on the array padded with 1s.'],
    tests: ['4\n3 1 5 8', '2\n1 5', '1\n7', '3\n0 0 5'],
    gen: (rng, big) => { const n = big ? 60 : ri(rng, 1, 7); return `${n}\n${J(arr(rng, n, 0, 9))}`; },
    solve: (inp) => {
      const a = [1, ...nums(lines(inp)[1]), 1], n = a.length;
      const dp = Array.from({ length: n }, () => Array(n).fill(0));
      for (let len = 2; len < n; len++) for (let l = 0; l + len < n; l++) {
        const r = l + len;
        for (let k = l + 1; k < r; k++) dp[l][r] = Math.max(dp[l][r], dp[l][k] + dp[k][r] + a[l] * a[k] * a[r]);
      }
      return String(dp[0][n - 1]);
    },
  },
  {
    problemName: 'Cheapest Flights Within K Stops',
    difficulty: 'hard',
    topics: ['graph', 'shortest path', 'dynamic programming'],
    description: `There are \`n\` cities and \`m\` directed flights \`u → v\` with price \`w\`. Find the cheapest price from \`src\` to \`dst\` using **at most \`k\` stops** (intermediate cities). Print \`-1\` if no such route exists.

**Input Format**

- Line 1: integers \`n\`, \`m\`, \`src\`, \`dst\`, \`k\`.
- Next \`m\` lines: \`u v w\`.

**Output Format**

Print the cheapest price, or \`-1\`.`,
    constraints: ['1 <= n <= 100', '0 <= m <= 5000', '0 <= k < n', '1 <= w <= 10^4'],
    hints: ['A plain Dijkstra ignores the stop limit. Run Bellman-Ford for exactly k + 1 rounds, relaxing from a copy of the previous round.'],
    tests: ['4 5 0 3 1\n0 1 100\n1 2 100\n2 0 100\n1 3 600\n2 3 200', '3 3 0 2 1\n0 1 100\n1 2 100\n0 2 500', '3 3 0 2 0\n0 1 100\n1 2 100\n0 2 500', '2 0 0 1 0'],
    gen: (rng, big) => {
      const n = ri(rng, 2, big ? 40 : 7), m = ri(rng, 1, big ? 300 : n * 2);
      const e = Array.from({ length: m }, () => `${ri(rng, 0, n - 1)} ${ri(rng, 0, n - 1)} ${ri(rng, 1, 50)}`);
      return `${n} ${m} ${ri(rng, 0, n - 1)} ${ri(rng, 0, n - 1)} ${ri(rng, 0, n - 1)}\n${e.join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...e] = lines(inp.trim());
      const [n, , src, dst, k] = nums(h);
      const E = e.filter(Boolean).map(nums);
      let d = Array(n).fill(Infinity);
      d[src] = 0;
      for (let i = 0; i <= k; i++) { const nd = [...d]; for (const [u, v, w] of E) if (d[u] + w < nd[v]) nd[v] = d[u] + w; d = nd; }
      return String(d[dst] === Infinity ? -1 : d[dst]);
    },
  },
  {
    problemName: 'First Missing Positive',
    difficulty: 'hard',
    topics: ['array', 'hash table'],
    description: `Find the **smallest missing positive integer** in an unsorted array. Aim for O(n) time and O(1) extra space.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers.

**Output Format**

Print the smallest positive integer that does not appear.`,
    constraints: ['1 <= n <= 10^5', '-2^31 <= arr[i] <= 2^31 - 1'],
    hints: ['The answer is in [1, n + 1].', 'Place every value v in 1..n at index v - 1 by swapping, then scan for the first index that does not hold index + 1.'],
    tests: ['3\n1 2 0', '4\n3 4 -1 1', '5\n7 8 9 11 12', '1\n1'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 12); return `${n}\n${J(arr(rng, n, -3, big ? n + 2 : 12))}`; },
    solve: (inp) => {
      const s = new Set(nums(lines(inp)[1]));
      let i = 1;
      while (s.has(i)) i++;
      return String(i);
    },
  },
  {
    problemName: 'Split Array Largest Sum',
    difficulty: 'hard',
    topics: ['binary search', 'dynamic programming', 'greedy'],
    description: `Split an array of non-negative integers into \`m\` **non-empty contiguous** subarrays so that the **largest subarray sum is as small as possible**. Print that minimised largest sum.

**Input Format**

- Line 1: integers \`n\` and \`m\`.
- Line 2: \`n\` integers.

**Output Format**

Print the minimised largest sum.`,
    constraints: ['1 <= m <= n <= 1000', '0 <= arr[i] <= 10^6'],
    hints: ['Binary search the answer: for a candidate limit, greedily cut a new piece whenever adding the next element would exceed it, and count pieces.'],
    tests: ['5 2\n7 2 5 10 8', '5 2\n1 2 3 4 5', '4 4\n1 4 4 2', '1 1\n9'],
    gen: (rng, big) => { const n = big ? 500 : ri(rng, 1, 9); return `${n} ${ri(rng, 1, n)}\n${J(arr(rng, n, 0, big ? 10000 : 20))}`; },
    solve: (inp) => {
      const [, m] = nums(lines(inp)[0]);
      const a = nums(lines(inp)[1]);
      const pieces = (lim) => { let c = 1, cur = 0; for (const x of a) { if (cur + x > lim) { c++; cur = 0; } cur += x; } return c; };
      let lo = Math.max(...a), hi = a.reduce((x, y) => x + y, 0);
      while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (pieces(mid) <= m) hi = mid; else lo = mid + 1; }
      return String(lo);
    },
  },
  {
    problemName: 'Count of Smaller Numbers After Self',
    difficulty: 'hard',
    topics: ['array', 'binary search', 'segment tree'],
    description: `For each element, count how many elements to its **right** are strictly smaller.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers.

**Output Format**

Print \`n\` space-separated counts.`,
    constraints: ['1 <= n <= 10^5', '-10^4 <= arr[i] <= 10^4'],
    hints: ['O(n^2) is too slow for n = 10^5.', 'Process from the right and keep a Fenwick tree / BIT over compressed values, or use merge sort counting inversions.'],
    tests: ['4\n5 2 6 1', '1\n-1', '2\n-1 -1', '5\n5 4 3 2 1'],
    gen: (rng, big) => { const n = big ? 2000 : ri(rng, 2, 12); return `${n}\n${J(arr(rng, n, -10, big ? 1000 : 10))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      return J(a.map((x, i) => a.slice(i + 1).filter((y) => y < x).length));
    },
  },
  {
    problemName: 'Longest Increasing Path in a Matrix',
    difficulty: 'hard',
    topics: ['graph', 'dynamic programming', 'depth-first search', 'topological sort'],
    description: `From any cell you may move **up, down, left or right** to a cell with a **strictly larger** value. Find the length (number of cells) of the longest such increasing path.

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: \`c\` integers each.

**Output Format**

Print the length of the longest increasing path.`,
    constraints: ['1 <= r, c <= 200', '0 <= value <= 10^9'],
    hints: ['DFS from every cell with memoisation: longest(i, j) = 1 + max over greater neighbours.'],
    tests: ['3 3\n9 9 4\n6 6 8\n2 1 1', '3 3\n3 4 5\n3 2 6\n2 2 1', '1 1\n1', '2 2\n1 2\n4 3'],
    gen: (rng, big) => { const r = big ? 25 : ri(rng, 1, 5), c = big ? 25 : ri(rng, 1, 5); return `${r} ${c}\n${Array.from({ length: r }, () => J(arr(rng, c, 0, big ? 500 : 9))).join('\n')}`; },
    solve: (inp) => {
      const [h, ...rows] = lines(inp.trim());
      const [r, c] = nums(h);
      const m = rows.map(nums);
      const memo = Array.from({ length: r }, () => Array(c).fill(0));
      const go = (i, j) => {
        if (memo[i][j]) return memo[i][j];
        let best = 1;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = i + dx, y = j + dy;
          if (x >= 0 && y >= 0 && x < r && y < c && m[x][y] > m[i][j]) best = Math.max(best, 1 + go(x, y));
        }
        return (memo[i][j] = best);
      };
      let ans = 0;
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) ans = Math.max(ans, go(i, j));
      return String(ans);
    },
  },
  {
    problemName: 'Best Time to Buy and Sell Stock IV',
    difficulty: 'hard',
    topics: ['dynamic programming', 'array'],
    description: `Given daily prices and an integer \`k\`, find the maximum profit using **at most \`k\` transactions** (a transaction is one buy followed by one sell; you must sell before buying again).

**Input Format**

- Line 1: integers \`k\` and \`n\`.
- Line 2: \`n\` prices.

**Output Format**

Print the maximum profit.`,
    constraints: ['0 <= k <= 100', '1 <= n <= 1000', '0 <= price <= 1000'],
    hints: ['dp[t][i] = max(dp[t][i-1], max over j<i of price[i] - price[j] + dp[t-1][j]); keep the inner max as a running value.'],
    tests: ['2 2\n2 4', '2 6\n3 2 6 5 0 3', '0 3\n1 2 3', '1 5\n7 6 4 3 1'],
    gen: (rng, big) => { const n = big ? 400 : ri(rng, 1, 12); return `${ri(rng, 0, big ? 10 : 4)} ${n}\n${J(arr(rng, n, 0, big ? 1000 : 20))}`; },
    solve: (inp) => {
      const [k] = nums(lines(inp)[0]);
      const p = nums(lines(inp)[1]);
      const dp = Array.from({ length: k + 1 }, () => Array(p.length).fill(0));
      for (let t = 1; t <= k; t++) {
        let best = -p[0];
        for (let i = 1; i < p.length; i++) { dp[t][i] = Math.max(dp[t][i - 1], p[i] + best); best = Math.max(best, dp[t - 1][i] - p[i]); }
      }
      return String(k === 0 ? 0 : dp[k][p.length - 1]);
    },
  },
  {
    problemName: 'Palindrome Partitioning II',
    difficulty: 'hard',
    topics: ['dynamic programming', 'string'],
    description: `Cut a string into pieces so that **every piece is a palindrome**. Find the **minimum number of cuts** needed.

**Input Format**

A single line with a lowercase string.

**Output Format**

Print the minimum number of cuts.`,
    constraints: ['1 <= |s| <= 2000'],
    hints: ['Precompute isPal[i][j] with DP, then cuts[i] = 0 if s[0..i] is a palindrome, otherwise min over j of cuts[j-1] + 1.'],
    tests: ['aab', 'a', 'ab', 'abccbc', 'aaaa'],
    gen: (rng, big) => word(rng, big ? 400 : ri(rng, 2, 14), 'abc'),
    solve: (inp) => {
      const s = inp.trim(), n = s.length;
      const pal = Array.from({ length: n }, () => Array(n).fill(false));
      for (let i = n - 1; i >= 0; i--) for (let j = i; j < n; j++) pal[i][j] = s[i] === s[j] && (j - i < 2 || pal[i + 1][j - 1]);
      const cuts = Array(n).fill(Infinity);
      for (let i = 0; i < n; i++) {
        if (pal[0][i]) { cuts[i] = 0; continue; }
        for (let j = 1; j <= i; j++) if (pal[j][i]) cuts[i] = Math.min(cuts[i], cuts[j - 1] + 1);
      }
      return String(cuts[n - 1]);
    },
  },
  {
    problemName: 'Word Ladder',
    difficulty: 'hard',
    topics: ['graph', 'breadth-first search'],
    description: `Transform \`begin\` into \`end\` by changing **one letter at a time**; every intermediate word (and \`end\`) must be in the given word list. Print the **number of words** in the shortest transformation sequence (counting both \`begin\` and \`end\`), or \`0\` if none exists.

**Input Format**

- Line 1: \`begin\`.
- Line 2: \`end\`.
- Line 3: integer \`n\` (size of the list).
- Line 4: \`n\` space-separated words, all the same length as \`begin\`.

**Output Format**

Print the length of the shortest sequence, or \`0\`.`,
    constraints: ['1 <= |word| <= 10', '1 <= n <= 5000', 'Lowercase letters; begin is not required to be in the list'],
    hints: ['Words are nodes; two words are connected if they differ in exactly one position. Run BFS from begin.'],
    tests: ['hit\ncog\n6\nhot dot dog lot log cog', 'hit\ncog\n5\nhot dot dog lot log', 'a\nc\n3\na b c', 'ab\nab\n1\nab'],
    gen: (rng, big) => {
      const n = big ? 25 : ri(rng, 2, 10);
      const ws = new Set();
      while (ws.size < n) ws.add(word(rng, 3, 'abc'));
      return `${word(rng, 3, 'abc')}\n${word(rng, 3, 'abc')}\n${n}\n${[...ws].join(' ')}`;
    },
    solve: (inp) => {
      const [b, e, , w] = lines(inp.trim());
      const list = new Set(w.trim().split(/\s+/));
      if (b === e) return '1';
      if (!list.has(e)) return '0';
      const d = new Map([[b, 1]]);
      const q = [b];
      for (let i = 0; i < q.length; i++) {
        const u = q[i];
        for (const v of list) {
          if (d.has(v)) continue;
          let diff = 0;
          for (let k = 0; k < u.length && diff < 2; k++) if (u[k] !== v[k]) diff++;
          if (diff === 1) { d.set(v, d.get(u) + 1); q.push(v); }
        }
      }
      return String(d.get(e) || 0);
    },
  },
];

module.exports = { problems };
