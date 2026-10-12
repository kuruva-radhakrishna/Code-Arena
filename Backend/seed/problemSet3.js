// Seed set 3: medium problems.
const { ri, arr, word, shuffle, lines, nums, J, sortedArr, distinct, grid } = require('./helpers');

const matrix = (rng, r, c, a, b) => Array.from({ length: r }, () => J(arr(rng, c, a, b)));
const parseMatrix = (inp) => { const [h, ...rows] = lines(inp.trim()); const [r, c] = nums(h); return { r, c, m: rows.map(nums) }; };

const problems = [
  {
    problemName: 'Longest Palindromic Subsequence',
    difficulty: 'medium',
    topics: ['dynamic programming', 'string'],
    description: `Find the length of the longest **palindromic subsequence** of a string (characters need not be adjacent).

**Input Format**

A single line with a lowercase string.

**Output Format**

Print the length of the longest palindromic subsequence.`,
    constraints: ['1 <= |s| <= 1000'],
    hints: ['dp[i][j] is the answer for s[i..j]. If the ends match, add 2 to dp[i+1][j-1]; otherwise take the better of dropping either end.'],
    tests: ['bbbab', 'cbbd', 'a', 'abcde', 'agbdba'],
    gen: (rng, big) => word(rng, big ? 400 : ri(rng, 2, 14), 'abc'),
    solve: (inp) => {
      const s = inp.trim(), n = s.length;
      const dp = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
      for (let i = n - 1; i >= 0; i--) for (let j = i + 1; j < n; j++)
        dp[i][j] = s[i] === s[j] ? dp[i + 1][j - 1] + 2 : Math.max(dp[i + 1][j], dp[i][j - 1]);
      return String(dp[0][n - 1]);
    },
  },
  {
    problemName: 'Jump Game',
    difficulty: 'medium',
    topics: ['array', 'greedy', 'dynamic programming'],
    description: `You start at index 0. \`arr[i]\` is the **maximum** number of steps you can jump forward from index \`i\`. Can you reach the last index?

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` non-negative integers.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= n <= 10^4', '0 <= arr[i] <= 10^5'],
    hints: ['Track the farthest index reachable so far; if you stand beyond it, you are stuck.'],
    tests: ['5\n2 3 1 1 4', '5\n3 2 1 0 4', '1\n0', '2\n0 1'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 12); return `${n}\n${J(arr(rng, n, 0, big ? 3 : 3))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      let far = 0;
      for (let i = 0; i < a.length; i++) { if (i > far) return 'false'; far = Math.max(far, i + a[i]); }
      return 'true';
    },
  },
  {
    problemName: 'Jump Game II',
    difficulty: 'medium',
    topics: ['array', 'greedy', 'dynamic programming'],
    description: `Same setup as Jump Game, but the last index is **always reachable**. Find the **minimum number of jumps** needed to get from index 0 to the last index.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` positive integers.

**Output Format**

Print the minimum number of jumps.`,
    constraints: ['1 <= n <= 10^4', '1 <= arr[i] <= 1000'],
    hints: ['Think in BFS layers: the set of indices reachable with j jumps is a contiguous range.'],
    tests: ['5\n2 3 1 1 4', '5\n2 3 0 1 4', '1\n1', '3\n1 1 1'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 14); return `${n}\n${J(arr(rng, n, 1, 4))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      let jumps = 0, end = 0, far = 0;
      for (let i = 0; i < a.length - 1; i++) { far = Math.max(far, i + a[i]); if (i === end) { jumps++; end = far; } }
      return String(jumps);
    },
  },
  {
    problemName: 'Spiral Matrix',
    difficulty: 'medium',
    topics: ['array', 'simulation'],
    description: `Print the elements of an \`r × c\` matrix in **spiral order** (start at the top-left, go right, then down, then left, then up, and keep spiralling inwards).

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: \`c\` integers each.

**Output Format**

Print the \`r * c\` elements on one line, space-separated.`,
    constraints: ['1 <= r, c <= 100', '-100 <= value <= 100'],
    hints: ['Maintain four boundaries (top, bottom, left, right) and shrink them after each side.'],
    tests: ['3 3\n1 2 3\n4 5 6\n7 8 9', '3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12', '1 3\n1 2 3', '3 1\n1\n2\n3'],
    gen: (rng, big) => { const r = big ? 40 : ri(rng, 1, 6), c = big ? 40 : ri(rng, 1, 6); return `${r} ${c}\n${matrix(rng, r, c, -9, 9).join('\n')}`; },
    solve: (inp) => {
      const { r, c, m } = parseMatrix(inp);
      const out = [];
      let t = 0, b = r - 1, l = 0, rt = c - 1;
      while (t <= b && l <= rt) {
        for (let j = l; j <= rt; j++) out.push(m[t][j]);
        t++;
        for (let i = t; i <= b; i++) out.push(m[i][rt]);
        rt--;
        if (t <= b) { for (let j = rt; j >= l; j--) out.push(m[b][j]); b--; }
        if (l <= rt) { for (let i = b; i >= t; i--) out.push(m[i][l]); l++; }
      }
      return J(out);
    },
  },
  {
    problemName: 'Rotate Image',
    difficulty: 'medium',
    topics: ['array', 'math'],
    description: `Rotate an \`n × n\` matrix by 90 degrees **clockwise** and print it.

**Input Format**

- Line 1: integer \`n\`.
- Next \`n\` lines: \`n\` integers each.

**Output Format**

Print the rotated matrix, one row per line, values space-separated.`,
    constraints: ['1 <= n <= 100', '-1000 <= value <= 1000'],
    hints: ['Rotate = transpose, then reverse every row.'],
    tests: ['3\n1 2 3\n4 5 6\n7 8 9', '2\n1 2\n3 4', '1\n5', '4\n5 1 9 11\n2 4 8 10\n13 3 6 7\n15 14 12 16'],
    gen: (rng, big) => { const n = big ? 40 : ri(rng, 2, 6); return `${n}\n${matrix(rng, n, n, -99, 99).join('\n')}`; },
    solve: (inp) => {
      const rows = lines(inp.trim()).slice(1).map(nums);
      const n = rows.length;
      return Array.from({ length: n }, (_, i) => J(Array.from({ length: n }, (_, j) => rows[n - 1 - j][i]))).join('\n');
    },
  },
  {
    problemName: 'Set Matrix Zeroes',
    difficulty: 'medium',
    topics: ['array'],
    description: `If an element of a matrix is \`0\`, set its **entire row and column** to \`0\`. Print the resulting matrix.

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: \`c\` integers each.

**Output Format**

Print the matrix, one row per line.`,
    constraints: ['1 <= r, c <= 100', '-1000 <= value <= 1000'],
    hints: ['Record which rows and columns contain a zero first, then clear them — otherwise newly written zeros would spread.'],
    tests: ['3 3\n1 1 1\n1 0 1\n1 1 1', '3 4\n0 1 2 0\n3 4 5 2\n1 3 1 5', '1 1\n0', '2 2\n1 2\n3 4'],
    gen: (rng, big) => { const r = big ? 30 : ri(rng, 1, 6), c = big ? 30 : ri(rng, 1, 6); return `${r} ${c}\n${Array.from({ length: r }, () => J(Array.from({ length: c }, () => (rng() < 0.12 ? 0 : ri(rng, 1, 9))))).join('\n')}`; },
    solve: (inp) => {
      const { r, c, m } = parseMatrix(inp);
      const zr = new Set(), zc = new Set();
      m.forEach((row, i) => row.forEach((v, j) => { if (v === 0) { zr.add(i); zc.add(j); } }));
      return m.map((row, i) => J(row.map((v, j) => (zr.has(i) || zc.has(j) ? 0 : v)))).join('\n');
    },
  },
  {
    problemName: 'Next Permutation',
    difficulty: 'medium',
    topics: ['array', 'two pointers'],
    description: `Print the **next lexicographically greater permutation** of the given sequence. If it is already the greatest arrangement, print the smallest one (sorted ascending).

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers.

**Output Format**

Print the next permutation, space-separated.`,
    constraints: ['1 <= n <= 1000', '0 <= arr[i] <= 100'],
    hints: ['Find the rightmost index i with arr[i] < arr[i+1]; swap arr[i] with the smallest larger element to its right; reverse the suffix.'],
    tests: ['3\n1 2 3', '3\n3 2 1', '3\n1 1 5', '4\n1 3 2 4', '1\n7'],
    gen: (rng, big) => { const n = big ? 500 : ri(rng, 2, 8); return `${n}\n${J(arr(rng, n, 0, 5))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      let i = a.length - 2;
      while (i >= 0 && a[i] >= a[i + 1]) i--;
      if (i >= 0) { let j = a.length - 1; while (a[j] <= a[i]) j--; [a[i], a[j]] = [a[j], a[i]]; }
      return J(a.slice(0, i + 1).concat(a.slice(i + 1).reverse()));
    },
  },
  {
    problemName: 'Coin Change II (Count Ways)',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `Given coin denominations (unlimited supply) and an amount, count the number of **combinations** of coins that make exactly that amount. Order does not matter (\`1+2\` and \`2+1\` are the same combination).

**Input Format**

- Line 1: integers \`n\` and \`amount\`.
- Line 2: \`n\` distinct coin values.

**Output Format**

Print the number of combinations (it fits in a signed 64-bit integer).`,
    constraints: ['1 <= n <= 8', '1 <= coin <= 1000', '0 <= amount <= 5000'],
    hints: ['Loop over coins in the outer loop and amounts in the inner loop so each combination is counted once.'],
    tests: ['3 5\n1 2 5', '1 3\n2', '1 10\n10', '3 0\n1 2 3'],
    gen: (rng, big) => { const n = ri(rng, 1, big ? 6 : 4); return `${n} ${big ? ri(rng, 800, 1500) : ri(rng, 0, 30)}\n${J(distinct(rng, n, 1, big ? 60 : 9))}`; },
    solve: (inp) => {
      const [, amt] = nums(lines(inp)[0]);
      const dp = Array(amt + 1).fill(0n);
      dp[0] = 1n;
      for (const c of nums(lines(inp)[1])) for (let x = c; x <= amt; x++) dp[x] += dp[x - c];
      return dp[amt].toString();
    },
  },
  {
    problemName: 'Decode Ways',
    difficulty: 'medium',
    topics: ['dynamic programming', 'string'],
    description: `A message of letters is encoded with \`A = 1, B = 2, ..., Z = 26\`. Given the encoded digit string, count the number of ways to decode it. Print \`0\` if it cannot be decoded.

**Input Format**

A single line with a string of digits.

**Output Format**

Print the number of decodings (fits in a signed 64-bit integer).`,
    constraints: ['1 <= |s| <= 40', 'The string contains only digits'],
    hints: ['dp[i] = (s[i-1] is 1-9 ? dp[i-1] : 0) + (s[i-2..i] is 10-26 ? dp[i-2] : 0).'],
    tests: ['12', '226', '06', '10', '2101', '111111'],
    gen: (rng, big) => word(rng, big ? 40 : ri(rng, 1, 12), '0112233456'),
    solve: (inp) => {
      const s = inp.trim();
      const dp = [1n, s[0] === '0' ? 0n : 1n];
      for (let i = 2; i <= s.length; i++) {
        let v = 0n;
        if (s[i - 1] !== '0') v += dp[i - 1];
        const t = Number(s.slice(i - 2, i));
        if (t >= 10 && t <= 26) v += dp[i - 2];
        dp[i] = v;
      }
      return dp[s.length].toString();
    },
  },
  {
    problemName: 'Longest Consecutive Sequence',
    difficulty: 'medium',
    topics: ['array', 'hash table'],
    description: `Find the length of the longest run of **consecutive integers** that appear in the array (in any order). Aim for O(n).

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers.

**Output Format**

Print the length of the longest consecutive sequence.`,
    constraints: ['1 <= n <= 10^5', '-10^9 <= arr[i] <= 10^9'],
    hints: ['Put everything in a set; only start counting from numbers whose predecessor is missing.'],
    tests: ['6\n100 4 200 1 3 2', '10\n0 3 7 2 5 8 4 6 0 1', '1\n5', '4\n1 1 1 1'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 14); return `${n}\n${J(arr(rng, n, -10, big ? 3000 : 12))}`; },
    solve: (inp) => {
      const s = new Set(nums(lines(inp)[1]));
      let best = 0;
      for (const x of s) if (!s.has(x - 1)) { let y = x; while (s.has(y + 1)) y++; best = Math.max(best, y - x + 1); }
      return String(best);
    },
  },
  {
    problemName: 'Minimum Size Subarray Sum',
    difficulty: 'medium',
    topics: ['array', 'sliding window', 'binary search'],
    description: `Find the **minimal length** of a contiguous subarray whose sum is **at least** \`target\`. Print \`0\` if there is none. All numbers are positive.

**Input Format**

- Line 1: integers \`n\` and \`target\`.
- Line 2: \`n\` positive integers.

**Output Format**

Print the minimal length, or \`0\`.`,
    constraints: ['1 <= n <= 10^5', '1 <= target <= 10^9', '1 <= arr[i] <= 10^4'],
    hints: ['Grow the window to the right; while its sum is enough, record the length and shrink from the left.'],
    tests: ['6 7\n2 3 1 2 4 3', '3 4\n1 4 4', '8 11\n1 1 1 1 1 1 1 1', '1 5\n5'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 14); return `${n} ${ri(rng, 1, big ? 5000 : 30)}\n${J(arr(rng, n, 1, big ? 100 : 9))}`; },
    solve: (inp) => {
      const [, t] = nums(lines(inp)[0]);
      const a = nums(lines(inp)[1]);
      let l = 0, s = 0, best = Infinity;
      for (let r = 0; r < a.length; r++) { s += a[r]; while (s >= t) { best = Math.min(best, r - l + 1); s -= a[l++]; } }
      return String(best === Infinity ? 0 : best);
    },
  },
  {
    problemName: 'Find All Anagrams Count',
    difficulty: 'medium',
    topics: ['string', 'sliding window', 'hash table'],
    description: `Count the start indices \`i\` such that the substring of \`s\` of length \`|p|\` starting at \`i\` is an **anagram** of \`p\`.

**Input Format**

- Line 1: string \`s\`.
- Line 2: string \`p\`.

**Output Format**

Print the number of such indices.`,
    constraints: ['1 <= |p| <= |s| <= 10^5', 'Lowercase letters only'],
    hints: ['Slide a window of length |p| and maintain letter counts instead of re-counting each window.'],
    tests: ['cbaebabacd\nabc', 'abab\nab', 'a\na', 'aaaa\naa'],
    gen: (rng, big) => `${word(rng, big ? 3000 : ri(rng, 3, 16), 'abc')}\n${word(rng, ri(rng, 1, 3), 'abc')}`,
    solve: (inp) => {
      const [s, p] = lines(inp.trim());
      const key = (x) => x.split('').sort().join('');
      const kp = key(p);
      let c = 0;
      for (let i = 0; i + p.length <= s.length; i++) if (key(s.slice(i, i + p.length)) === kp) c++;
      return String(c);
    },
  },
  {
    problemName: 'Permutation in String',
    difficulty: 'medium',
    topics: ['string', 'sliding window', 'two pointers'],
    description: `Does \`s2\` contain a substring that is a **permutation** of \`s1\`?

**Input Format**

- Line 1: string \`s1\`.
- Line 2: string \`s2\`.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= |s1|, |s2| <= 10^5', 'Lowercase letters only'],
    hints: ['A permutation of s1 is a window of s2 with exactly the same letter counts.'],
    tests: ['ab\neidbaooo', 'ab\neidboaoo', 'a\na', 'abc\nab'],
    gen: (rng, big) => `${word(rng, ri(rng, 1, 3), 'abc')}\n${word(rng, big ? 2000 : ri(rng, 2, 14), 'abc')}`,
    solve: (inp) => {
      const [a, b] = lines(inp.trim());
      const k = (x) => x.split('').sort().join('');
      const ka = k(a);
      for (let i = 0; i + a.length <= b.length; i++) if (k(b.slice(i, i + a.length)) === ka) return 'true';
      return 'false';
    },
  },
  {
    problemName: 'Rotting Oranges',
    difficulty: 'medium',
    topics: ['graph', 'breadth-first search', 'simulation'],
    description: `A grid has empty cells (\`0\`), fresh oranges (\`1\`) and rotten oranges (\`2\`). Every minute, each fresh orange that is **4-directionally adjacent** to a rotten one becomes rotten. Print the minimum number of minutes until no fresh orange remains, or \`-1\` if that is impossible.

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: a string of \`c\` characters from \`0\`, \`1\`, \`2\`.

**Output Format**

Print the number of minutes, or \`-1\`.`,
    constraints: ['1 <= r, c <= 100'],
    hints: ['Start a multi-source BFS from all rotten oranges at once and count BFS levels.'],
    tests: ['3 3\n211\n110\n011', '3 3\n211\n011\n101', '1 1\n0', '1 2\n01'],
    gen: (rng, big) => {
      const r = big ? 30 : ri(rng, 1, 6), c = big ? 30 : ri(rng, 1, 6);
      const g = Array.from({ length: r }, () => Array.from({ length: c }, () => { const x = rng(); return x < 0.2 ? '0' : x < 0.85 ? '1' : '2'; }).join(''));
      return `${r} ${c}\n${g.join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...g0] = lines(inp.trim());
      const [r, c] = nums(h);
      const g = g0.map((x) => x.split(''));
      let q = [], fresh = 0;
      g.forEach((row, i) => row.forEach((v, j) => { if (v === '2') q.push([i, j]); if (v === '1') fresh++; }));
      let t = 0;
      while (q.length && fresh) {
        const nx = [];
        for (const [x, y] of q) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = x + dx, b = y + dy;
          if (a >= 0 && b >= 0 && a < r && b < c && g[a][b] === '1') { g[a][b] = '2'; fresh--; nx.push([a, b]); }
        }
        q = nx; t++;
      }
      return String(fresh ? -1 : t);
    },
  },
  {
    problemName: 'Course Schedule',
    difficulty: 'medium',
    topics: ['graph', 'topological sort', 'breadth-first search'],
    description: `There are \`n\` courses numbered \`0..n-1\` and \`m\` prerequisites. A line \`a b\` means course \`a\` must be taken **before** course \`b\`. Can all courses be finished?

**Input Format**

- Line 1: integers \`n\` and \`m\`.
- Next \`m\` lines: two integers \`a b\`.

**Output Format**

Print \`true\` if every course can be completed, otherwise \`false\`.`,
    constraints: ['1 <= n <= 2000', '0 <= m <= 5000'],
    hints: ['The answer is "true" exactly when the prerequisite graph has no cycle.', "Kahn's algorithm: repeatedly remove nodes of in-degree 0."],
    tests: ['2 1\n0 1', '2 2\n0 1\n1 0', '3 0', '4 3\n0 1\n1 2\n2 3', '3 3\n0 1\n1 2\n2 1'],
    gen: (rng, big) => {
      const n = big ? 200 : ri(rng, 2, 7), m = ri(rng, 0, big ? 300 : n * 2);
      return `${n} ${m}${Array.from({ length: m }, () => `\n${ri(rng, 0, n - 1)} ${ri(rng, 0, n - 1)}`).join('')}`;
    },
    solve: (inp) => {
      const [h, ...e] = lines(inp.trim());
      const [n] = nums(h);
      const deg = Array(n).fill(0), adj = Array.from({ length: n }, () => []);
      e.filter(Boolean).map(nums).forEach(([a, b]) => { adj[a].push(b); deg[b]++; });
      const q = deg.map((d, i) => (d === 0 ? i : -1)).filter((x) => x >= 0);
      let seen = 0;
      while (q.length) { const u = q.pop(); seen++; for (const v of adj[u]) if (--deg[v] === 0) q.push(v); }
      return String(seen === n);
    },
  },
  {
    problemName: 'Number of Provinces',
    difficulty: 'medium',
    topics: ['graph', 'depth-first search', 'disjoint set'],
    description: `There are \`n\` cities. Row \`i\` of an adjacency matrix has a \`1\` at column \`j\` if cities \`i\` and \`j\` are **directly connected** (connections are symmetric). A **province** is a group of cities connected directly or indirectly. Count the provinces.

**Input Format**

- Line 1: integer \`n\`.
- Next \`n\` lines: a string of \`n\` characters (\`0\` or \`1\`).

**Output Format**

Print the number of provinces.`,
    constraints: ['1 <= n <= 200', 'The matrix is symmetric and cell (i, i) is 1'],
    hints: ['Run a DFS/BFS from each unvisited city, or use union-find, and count the components.'],
    tests: ['3\n110\n110\n001', '3\n100\n010\n001', '1\n1', '4\n1100\n1100\n0011\n0011'],
    gen: (rng, big) => {
      const n = big ? 60 : ri(rng, 1, 8);
      const m = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? '1' : '0')));
      for (let k = 0; k < n; k++) { const a = ri(rng, 0, n - 1), b = ri(rng, 0, n - 1); if (rng() < 0.5) m[a][b] = m[b][a] = '1'; }
      return `${n}\n${m.map((r) => r.join('')).join('\n')}`;
    },
    solve: (inp) => {
      const [, ...rows] = lines(inp.trim());
      const n = rows.length, seen = Array(n).fill(false);
      let c = 0;
      for (let i = 0; i < n; i++) if (!seen[i]) { c++; const st = [i]; seen[i] = true; while (st.length) { const u = st.pop(); for (let v = 0; v < n; v++) if (rows[u][v] === '1' && !seen[v]) { seen[v] = true; st.push(v); } } }
      return String(c);
    },
  },
  {
    problemName: 'Min Cost Climbing Stairs',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `\`cost[i]\` is the price of stepping **on** stair \`i\`; after paying you may climb one or two stairs. You may start on stair 0 or stair 1. Find the minimum cost to reach the **top** (one step past the last stair).

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` costs.

**Output Format**

Print the minimum cost.`,
    constraints: ['2 <= n <= 1000', '0 <= cost[i] <= 999'],
    hints: ['best(i) = cost[i] + min(best(i-1), best(i-2)); the answer is min(best(n-1), best(n-2)).'],
    tests: ['3\n10 15 20', '10\n1 100 1 1 1 100 1 1 100 1', '2\n5 3', '4\n0 0 0 0'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 12); return `${n}\n${J(arr(rng, n, 0, 99))}`; },
    solve: (inp) => {
      const c = nums(lines(inp)[1]);
      let a = c[0], b = c[1];
      for (let i = 2; i < c.length; i++) [a, b] = [b, c[i] + Math.min(a, b)];
      return String(Math.min(a, b));
    },
  },
  {
    problemName: 'Unique Paths II',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `A robot moves only **right or down** from the top-left to the bottom-right of a grid. Cells marked \`1\` are obstacles. Count the distinct paths.

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: a string of \`c\` characters (\`0\` free, \`1\` obstacle).

**Output Format**

Print the number of paths (0 if the start or end is blocked).`,
    constraints: ['1 <= r, c <= 15', 'The answer fits in a 64-bit signed integer'],
    hints: ['dp[i][j] = dp[i-1][j] + dp[i][j-1], and 0 on obstacles.'],
    tests: ['3 3\n000\n010\n000', '2 2\n01\n00', '1 1\n0', '1 1\n1'],
    gen: (rng) => { const r = ri(rng, 1, 7), c = ri(rng, 1, 7); return `${r} ${c}\n${grid(rng, r, c, 0.2).join('\n')}`; },
    solve: (inp) => {
      const [h, ...g] = lines(inp.trim());
      const [r, c] = nums(h);
      const dp = Array.from({ length: r }, () => Array(c).fill(0n));
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
        if (g[i][j] === '1') continue;
        if (i === 0 && j === 0) dp[i][j] = 1n;
        else dp[i][j] = (i ? dp[i - 1][j] : 0n) + (j ? dp[i][j - 1] : 0n);
      }
      return dp[r - 1][c - 1].toString();
    },
  },
  {
    problemName: 'Triangle',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `Given a triangle of numbers, find the minimum path sum from the top to the bottom. From index \`j\` in one row you may move to index \`j\` or \`j + 1\` in the next row.

**Input Format**

- Line 1: integer \`n\` (number of rows).
- Next \`n\` lines: row \`i\` (0-indexed) has \`i + 1\` integers.

**Output Format**

Print the minimum path sum.`,
    constraints: ['1 <= n <= 200', '-10^4 <= value <= 10^4'],
    hints: ['Work bottom-up: each cell becomes itself plus the smaller of the two cells below it.'],
    tests: ['4\n2\n3 4\n6 5 7\n4 1 8 3', '1\n-10', '3\n1\n2 3\n4 5 6', '2\n-1\n2 3'],
    gen: (rng, big) => { const n = big ? 60 : ri(rng, 1, 7); return `${n}\n${Array.from({ length: n }, (_, i) => J(arr(rng, i + 1, -9, 9))).join('\n')}`; },
    solve: (inp) => {
      const t = lines(inp.trim()).slice(1).map(nums);
      for (let i = t.length - 2; i >= 0; i--) for (let j = 0; j <= i; j++) t[i][j] += Math.min(t[i + 1][j], t[i + 1][j + 1]);
      return String(t[0][0]);
    },
  },
  {
    problemName: 'Best Time to Buy and Sell Stock II',
    difficulty: 'medium',
    topics: ['array', 'greedy', 'dynamic programming'],
    description: `You may buy and sell a stock **any number of times**, but you can hold at most one share at a time. Find the maximum total profit.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` daily prices.

**Output Format**

Print the maximum profit.`,
    constraints: ['1 <= n <= 10^5', '0 <= price <= 10^4'],
    hints: ['Every upward step between consecutive days can be captured separately: add every positive difference.'],
    tests: ['6\n7 1 5 3 6 4', '5\n1 2 3 4 5', '5\n7 6 4 3 1', '1\n3'],
    gen: (rng, big) => { const n = big ? 4000 : ri(rng, 2, 14); return `${n}\n${J(arr(rng, n, 0, big ? 10000 : 30))}`; },
    solve: (inp) => { const p = nums(lines(inp)[1]); let s = 0; for (let i = 1; i < p.length; i++) s += Math.max(0, p[i] - p[i - 1]); return String(s); },
  },
  {
    problemName: 'Gas Station',
    difficulty: 'medium',
    topics: ['array', 'greedy'],
    description: `There are \`n\` gas stations on a circular route. Station \`i\` gives \`gas[i]\` fuel and driving to the next station costs \`cost[i]\`. The tank is initially empty. Print the index of the station from which you can complete the full circuit clockwise, or \`-1\` if impossible. If a solution exists it is unique.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` values of \`gas\`.
- Line 3: \`n\` values of \`cost\`.

**Output Format**

Print the starting index or \`-1\`.`,
    constraints: ['1 <= n <= 10^5', '0 <= gas[i], cost[i] <= 10^4'],
    hints: ['If total gas < total cost, the answer is -1.', 'Otherwise, whenever the running tank goes negative, the start must be after the current station.'],
    tests: ['5\n1 2 3 4 5\n3 4 5 1 2', '3\n2 3 4\n3 4 3', '1\n5\n4', '2\n1 2\n2 1'],
    gen: (rng, big) => {
      for (;;) {
        const n = big ? 3000 : ri(rng, 2, 8);
        const gas = arr(rng, n, 0, 9), cost = arr(rng, n, 0, 9);
        let c = 0;
        for (let s = 0; s < n; s++) { let t = 0, ok = true; for (let k = 0; k < n; k++) { const i = (s + k) % n; t += gas[i] - cost[i]; if (t < 0) { ok = false; break; } } if (ok) c++; }
        if (c <= 1) return `${n}\n${J(gas)}\n${J(cost)}`;
      }
    },
    solve: (inp) => {
      const g = nums(lines(inp)[1]), c = nums(lines(inp)[2]);
      let tot = 0, tank = 0, start = 0;
      for (let i = 0; i < g.length; i++) { tot += g[i] - c[i]; tank += g[i] - c[i]; if (tank < 0) { start = i + 1; tank = 0; } }
      return String(tot < 0 ? -1 : start);
    },
  },
  {
    problemName: 'Candy',
    difficulty: 'medium',
    topics: ['array', 'greedy'],
    description: `\`n\` children stand in a line, each with a rating. Give every child at least one candy; a child with a **higher rating than an adjacent neighbour** must get more candies than that neighbour. Find the minimum total number of candies.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` ratings.

**Output Format**

Print the minimum number of candies.`,
    constraints: ['1 <= n <= 2 * 10^4', '0 <= rating <= 2 * 10^4'],
    hints: ['Two passes: left-to-right enforcing the left-neighbour rule, then right-to-left enforcing the right-neighbour rule (take the max).'],
    tests: ['3\n1 0 2', '3\n1 2 2', '1\n9', '5\n1 3 4 5 2'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 12); return `${n}\n${J(arr(rng, n, 0, big ? 1000 : 6))}`; },
    solve: (inp) => {
      const r = nums(lines(inp)[1]), n = r.length;
      const c = Array(n).fill(1);
      for (let i = 1; i < n; i++) if (r[i] > r[i - 1]) c[i] = c[i - 1] + 1;
      for (let i = n - 2; i >= 0; i--) if (r[i] > r[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);
      return String(c.reduce((a, b) => a + b, 0));
    },
  },
  {
    problemName: 'Meeting Rooms II',
    difficulty: 'medium',
    topics: ['sorting', 'heap', 'greedy'],
    description: `Given meeting time intervals \`[start, end)\`, find the **minimum number of rooms** needed so that no two overlapping meetings share a room. A meeting that ends at time \`t\` does not overlap with one that starts at \`t\`.

**Input Format**

- Line 1: integer \`n\`.
- Next \`n\` lines: \`start end\`.

**Output Format**

Print the minimum number of rooms.`,
    constraints: ['1 <= n <= 10^4', '0 <= start < end <= 10^6'],
    hints: ['Sort starts and ends separately, then sweep: a new start before the earliest unfinished end needs another room.'],
    tests: ['3\n0 30\n5 10\n15 20', '2\n7 10\n2 4', '3\n1 5\n5 10\n10 15', '1\n1 2'],
    gen: (rng, big) => { const n = big ? 1500 : ri(rng, 1, 9); return `${n}\n${Array.from({ length: n }, () => { const s = ri(rng, 0, 30); return `${s} ${s + ri(rng, 1, 15)}`; }).join('\n')}`; },
    solve: (inp) => {
      const iv = lines(inp.trim()).slice(1).map(nums);
      const ev = [];
      iv.forEach(([s, e]) => { ev.push([s, 1], [e, -1]); });
      ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let cur = 0, best = 0;
      for (const [, d] of ev) { cur += d; best = Math.max(best, cur); }
      return String(best);
    },
  },
  {
    problemName: 'Non-overlapping Intervals',
    difficulty: 'medium',
    topics: ['greedy', 'sorting'],
    description: `Given a list of intervals, find the **minimum number of intervals to remove** so that the rest do not overlap. Intervals that only touch at an endpoint (\`[1,2]\` and \`[2,3]\`) do not overlap.

**Input Format**

- Line 1: integer \`n\`.
- Next \`n\` lines: \`start end\`.

**Output Format**

Print the minimum number of removals.`,
    constraints: ['1 <= n <= 10^5', '-5 * 10^4 <= start < end <= 5 * 10^4'],
    hints: ['Sort by end time and greedily keep every interval that starts at or after the last kept end.'],
    tests: ['4\n1 2\n2 3\n3 4\n1 3', '3\n1 2\n1 2\n1 2', '2\n1 2\n2 3', '1\n0 5'],
    gen: (rng, big) => { const n = big ? 1500 : ri(rng, 1, 9); return `${n}\n${Array.from({ length: n }, () => { const s = ri(rng, -10, 20); return `${s} ${s + ri(rng, 1, 10)}`; }).join('\n')}`; },
    solve: (inp) => {
      const iv = lines(inp.trim()).slice(1).map(nums).sort((a, b) => a[1] - b[1]);
      let end = -Infinity, keep = 0;
      for (const [s, e] of iv) if (s >= end) { keep++; end = e; }
      return String(iv.length - keep);
    },
  },
  {
    problemName: 'Kth Smallest Element in a Sorted Matrix',
    difficulty: 'medium',
    topics: ['binary search', 'heap', 'array'],
    description: `An \`n × n\` matrix has every row and every column sorted in non-decreasing order. Find the \`k\`-th smallest element (counting duplicates).

**Input Format**

- Line 1: integers \`n\` and \`k\`.
- Next \`n\` lines: \`n\` integers each.

**Output Format**

Print the k-th smallest element.`,
    constraints: ['1 <= n <= 300', '1 <= k <= n^2', '-10^9 <= value <= 10^9'],
    hints: ['A min-heap seeded with the first column gives O(k log n).', 'Or binary search on the value and count how many cells are <= mid in O(n).'],
    tests: ['3 8\n1 5 9\n10 11 13\n12 13 15', '1 1\n-5', '2 2\n1 2\n1 3', '2 3\n1 2\n3 3'],
    gen: (rng, big) => {
      const n = big ? 25 : ri(rng, 1, 5);
      const x = sortedArr(rng, n, 0, 20), y = sortedArr(rng, n, 0, 20);
      return `${n} ${ri(rng, 1, n * n)}\n${x.map((a) => J(y.map((b) => a + b))).join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...rows] = lines(inp.trim());
      const [, k] = nums(h);
      return String(rows.flatMap(nums).sort((a, b) => a - b)[k - 1]);
    },
  },
  {
    problemName: 'Maximum Product Subarray',
    difficulty: 'medium',
    topics: ['array', 'dynamic programming'],
    description: `Find the contiguous, non-empty subarray with the largest **product** and print that product.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers.

**Output Format**

Print the maximum product (it fits in a signed 64-bit integer).`,
    constraints: ['1 <= n <= 20', '-10 <= arr[i] <= 10'],
    hints: ['Track both the maximum and the minimum product ending at each index — a negative number can flip the minimum into the maximum.'],
    tests: ['4\n2 3 -2 4', '3\n-2 0 -1', '1\n-3', '5\n-2 3 -4 0 2'],
    gen: (rng) => { const n = ri(rng, 2, 14); return `${n}\n${J(arr(rng, n, -4, 4))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      let best = -Infinity;
      for (let i = 0; i < a.length; i++) { let p = 1; for (let j = i; j < a.length; j++) { p *= a[j]; best = Math.max(best, p); } }
      return String(best === 0 ? 0 : best);
    },
  },
  {
    problemName: 'Find Minimum in Rotated Sorted Array',
    difficulty: 'medium',
    topics: ['array', 'binary search'],
    description: `A sorted array of **distinct** integers was rotated an unknown number of times. Find its minimum element in O(log n).

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` distinct integers.

**Output Format**

Print the minimum element.`,
    constraints: ['1 <= n <= 5000', 'All values are distinct'],
    hints: ['Compare arr[mid] with arr[hi]: if arr[mid] > arr[hi] the minimum is to the right of mid, otherwise at mid or to its left.'],
    tests: ['5\n3 4 5 1 2', '7\n4 5 6 7 0 1 2', '4\n11 13 15 17', '1\n8'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 14);
      const base = sortedArr(rng, n, 0, 3).map((_, i) => i * 4 - 9);
      const k = ri(rng, 0, n - 1);
      return `${n}\n${J(base.slice(k).concat(base.slice(0, k)))}`;
    },
    solve: (inp) => String(Math.min(...nums(lines(inp)[1]))),
  },
  {
    problemName: 'Koko Eating Bananas',
    difficulty: 'medium',
    topics: ['binary search', 'array'],
    description: `There are \`n\` piles of bananas. Koko eats at a speed of \`k\` bananas per hour; each hour she picks one pile and eats up to \`k\` bananas from it (if the pile has fewer, she finishes it and waits out the hour). She must finish all piles within \`h\` hours. Find the **minimum integer speed** \`k\`.

**Input Format**

- Line 1: integers \`n\` and \`h\`.
- Line 2: \`n\` pile sizes.

**Output Format**

Print the minimum speed.`,
    constraints: ['1 <= n <= 10^4', 'n <= h <= 10^9', '1 <= pile <= 10^9'],
    hints: ['If a speed works, any faster speed works too — binary search on k between 1 and max(pile).'],
    tests: ['4 8\n3 6 7 11', '5 5\n30 11 23 4 20', '5 6\n30 11 23 4 20', '1 1\n1'],
    gen: (rng, big) => { const n = big ? 500 : ri(rng, 1, 7); return `${n} ${ri(rng, n, n * 4)}\n${J(arr(rng, n, 1, big ? 1000000000 : 30))}`; },
    solve: (inp) => {
      const [, h] = nums(lines(inp)[0]);
      const p = nums(lines(inp)[1]);
      let lo = 1, hi = Math.max(...p);
      const ok = (k) => p.reduce((s, x) => s + Math.ceil(x / k), 0) <= h;
      while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (ok(m)) hi = m; else lo = m + 1; }
      return String(lo);
    },
  },
  {
    problemName: 'Capacity To Ship Packages Within D Days',
    difficulty: 'medium',
    topics: ['binary search', 'array', 'greedy'],
    description: `Packages must be shipped **in the given order** within \`d\` days. Each day the ship carries consecutive packages whose total weight does not exceed its capacity. Find the **least capacity** that works.

**Input Format**

- Line 1: integers \`n\` and \`d\`.
- Line 2: \`n\` package weights.

**Output Format**

Print the minimum ship capacity.`,
    constraints: ['1 <= d <= n <= 5 * 10^4', '1 <= weight <= 500'],
    hints: ['The capacity lies between max(weight) and sum(weight); a bigger capacity never hurts, so binary search it.'],
    tests: ['10 5\n1 2 3 4 5 6 7 8 9 10', '6 3\n3 2 2 4 1 4', '5 4\n1 2 3 1 1', '1 1\n9'],
    gen: (rng, big) => { const n = big ? 1500 : ri(rng, 1, 10); return `${n} ${ri(rng, 1, n)}\n${J(arr(rng, n, 1, big ? 500 : 20))}`; },
    solve: (inp) => {
      const [, d] = nums(lines(inp)[0]);
      const w = nums(lines(inp)[1]);
      const days = (c) => { let n = 1, cur = 0; for (const x of w) { if (cur + x > c) { n++; cur = 0; } cur += x; } return n; };
      let lo = Math.max(...w), hi = w.reduce((a, b) => a + b, 0);
      while (lo < hi) { const m = (lo + hi) >> 1; if (days(m) <= d) hi = m; else lo = m + 1; }
      return String(lo);
    },
  },
  {
    problemName: 'Sort Colors',
    difficulty: 'medium',
    topics: ['array', 'two pointers', 'sorting'],
    description: `An array contains only the values \`0\`, \`1\` and \`2\`. Sort it in one pass without a library sort (the Dutch national flag problem) and print it.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` values from {0, 1, 2}.

**Output Format**

Print the sorted array, space-separated.`,
    constraints: ['1 <= n <= 300'],
    hints: ['Keep three regions with pointers low, mid, high: swap 0s to the front and 2s to the back.'],
    tests: ['6\n2 0 2 1 1 0', '3\n2 0 1', '1\n1', '4\n2 2 2 2'],
    gen: (rng, big) => { const n = big ? 280 : ri(rng, 2, 14); return `${n}\n${J(arr(rng, n, 0, 2))}`; },
    solve: (inp) => J(nums(lines(inp)[1]).sort((a, b) => a - b)),
  },
  {
    problemName: 'Evaluate Reverse Polish Notation',
    difficulty: 'medium',
    topics: ['stack', 'math'],
    description: `Evaluate an arithmetic expression written in **reverse Polish notation** with operators \`+ - * /\`. Division **truncates toward zero**. Every division is valid (no division by zero) and all intermediate values fit in a 32-bit signed integer.

**Input Format**

A single line of space-separated tokens (integers and operators).

**Output Format**

Print the value of the expression.`,
    constraints: ['1 <= tokens <= 10^4'],
    hints: ['Push numbers on a stack; for an operator pop two values (the second popped is the left operand), apply it, push the result.'],
    tests: ['2 1 + 3 *', '4 13 5 / +', '10 6 9 3 + -11 * / * 17 + 5 +', '7', '3 -4 /'],
    gen: (rng) => {
      for (let tries = 0; tries < 200; tries++) {
        const out = [];
        const build = (d) => {
          if (d === 0 || rng() < 0.25) { out.push(String(ri(rng, -9, 9))); return; }
          build(d - 1); build(d - 1); out.push('+-*/'[ri(rng, 0, 3)]);
        };
        build(ri(rng, 1, 4));
        const st = [];
        let ok = true;
        for (const t of out) {
          if (/^-?\d+$/.test(t)) st.push(Number(t));
          else { const b = st.pop(), a = st.pop(); if (t === '/' && b === 0) { ok = false; break; } st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b)); }
        }
        if (ok) return out.join(' ');
      }
      return '1 2 +';
    },
    solve: (inp) => {
      const st = [];
      for (const t of inp.trim().split(/\s+/)) {
        if (/^-?\d+$/.test(t)) st.push(Number(t));
        else { const b = st.pop(), a = st.pop(); st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b)); }
      }
      return String(st[0] === 0 ? 0 : st[0]);
    },
  },
  {
    problemName: 'Next Greater Element',
    difficulty: 'medium',
    topics: ['array', 'stack'],
    description: `For each element, find the **first strictly greater element to its right**. Print \`-1\` for elements that have none.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers.

**Output Format**

Print \`n\` space-separated integers.`,
    constraints: ['1 <= n <= 10^5', '-10^9 <= arr[i] <= 10^9'],
    hints: ['Scan from the right keeping a stack of candidates; pop everything not greater than the current element.'],
    tests: ['4\n4 5 2 25', '4\n13 7 6 12', '1\n3', '4\n4 3 2 1'],
    gen: (rng, big) => { const n = big ? 4000 : ri(rng, 2, 14); return `${n}\n${J(arr(rng, n, -20, 20))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      return J(a.map((x, i) => { for (let j = i + 1; j < a.length; j++) if (a[j] > x) return a[j]; return -1; }));
    },
  },
  {
    problemName: 'Generate Parentheses Count',
    difficulty: 'medium',
    topics: ['backtracking', 'dynamic programming', 'recursion'],
    description: `Count the strings of \`n\` pairs of parentheses that are **well-formed** (for example \`(())\` and \`()()\` for \`n = 2\`).

**Input Format**

A single integer \`n\`.

**Output Format**

Print the number of well-formed strings.`,
    constraints: ['1 <= n <= 15'],
    hints: ['Generate by backtracking: add "(" while fewer than n are open, add ")" while it would not exceed the opens.', 'The counts are the Catalan numbers.'],
    tests: ['1', '2', '3', '4', '8', '15'],
    gen: (rng) => String(ri(rng, 1, 14)),
    solve: (inp) => {
      const n = Number(inp.trim());
      let c = 1n;
      for (let i = 0; i < n; i++) c = (c * BigInt(2 * (2 * i + 1))) / BigInt(i + 2);
      return c.toString();
    },
  },
  {
    problemName: 'Palindromic Substrings Count',
    difficulty: 'medium',
    topics: ['string', 'dynamic programming', 'two pointers'],
    description: `Count the **substrings** (contiguous, identified by position) of a string that are palindromes. Substrings at different positions count separately even if equal.

**Input Format**

A single line with a lowercase string.

**Output Format**

Print the number of palindromic substrings.`,
    constraints: ['1 <= |s| <= 1000'],
    hints: ['Expand around each of the 2n - 1 possible centres.'],
    tests: ['abc', 'aaa', 'a', 'abba', 'aabaa'],
    gen: (rng, big) => word(rng, big ? 300 : ri(rng, 2, 14), 'ab'),
    solve: (inp) => {
      const s = inp.trim();
      let c = 0;
      for (let ctr = 0; ctr < 2 * s.length - 1; ctr++) {
        let l = ctr >> 1, r = l + (ctr & 1);
        while (l >= 0 && r < s.length && s[l] === s[r]) { c++; l--; r++; }
      }
      return String(c);
    },
  },
  {
    problemName: 'Longest Repeating Character Replacement',
    difficulty: 'medium',
    topics: ['string', 'sliding window'],
    description: `You may replace at most \`k\` characters of a string with any other uppercase letter. Find the length of the longest substring containing a single repeated letter you can obtain.

**Input Format**

- Line 1: string \`s\` (uppercase letters).
- Line 2: integer \`k\`.

**Output Format**

Print the maximum length.`,
    constraints: ['1 <= |s| <= 10^5', '0 <= k <= |s|'],
    hints: ['A window is valid when (window length - count of its most frequent letter) <= k. Slide it and track the max frequency.'],
    tests: ['ABAB\n2', 'AABABBA\n1', 'A\n0', 'ABCDE\n1'],
    gen: (rng, big) => `${word(rng, big ? 3000 : ri(rng, 2, 14), 'ABC')}\n${ri(rng, 0, big ? 50 : 4)}`,
    solve: (inp) => {
      const [s, kk] = lines(inp.trim());
      const k = Number(kk);
      let best = 0;
      for (const ch of new Set(s)) { let l = 0, bad = 0; for (let r = 0; r < s.length; r++) { if (s[r] !== ch) bad++; while (bad > k) { if (s[l] !== ch) bad--; l++; } best = Math.max(best, r - l + 1); } }
      return String(best);
    },
  },
  {
    problemName: 'Is Graph Bipartite?',
    difficulty: 'medium',
    topics: ['graph', 'breadth-first search', 'depth-first search'],
    description: `An undirected graph is **bipartite** if its nodes can be split into two sets so that every edge connects a node of one set to a node of the other. The graph may be disconnected.

**Input Format**

- Line 1: integers \`n\` and \`m\` (nodes numbered \`0..n-1\`).
- Next \`m\` lines: edge \`u v\`.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= n <= 100', '0 <= m <= 500', 'No self-loops'],
    hints: ['Try to 2-colour the graph with BFS; an edge between two nodes of the same colour means "false".'],
    tests: ['4 4\n0 1\n1 2\n2 3\n3 0', '3 3\n0 1\n1 2\n2 0', '3 0', '5 4\n0 1\n1 2\n3 4\n4 3'],
    gen: (rng, big) => {
      const n = big ? 60 : ri(rng, 2, 8), m = ri(rng, 0, big ? 70 : n + 1);
      const e = [];
      while (e.length < m) { const u = ri(rng, 0, n - 1), v = ri(rng, 0, n - 1); if (u !== v) e.push(`${u} ${v}`); }
      return `${n} ${m}${e.map((x) => `\n${x}`).join('')}`;
    },
    solve: (inp) => {
      const [h, ...e] = lines(inp.trim());
      const [n] = nums(h);
      const adj = Array.from({ length: n }, () => []);
      e.filter(Boolean).map(nums).forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
      const col = Array(n).fill(-1);
      for (let s = 0; s < n; s++) {
        if (col[s] >= 0) continue;
        col[s] = 0;
        const q = [s];
        for (let i = 0; i < q.length; i++) for (const v of adj[q[i]]) { if (col[v] < 0) { col[v] = 1 - col[q[i]]; q.push(v); } else if (col[v] === col[q[i]]) return 'false'; }
      }
      return 'true';
    },
  },
  {
    problemName: 'Subarray Product Less Than K',
    difficulty: 'medium',
    topics: ['array', 'sliding window'],
    description: `Count the contiguous subarrays whose **product** is strictly less than \`k\`. All numbers are positive.

**Input Format**

- Line 1: integers \`n\` and \`k\`.
- Line 2: \`n\` positive integers.

**Output Format**

Print the number of such subarrays.`,
    constraints: ['1 <= n <= 3 * 10^4', '1 <= arr[i] <= 1000', '0 <= k <= 10^6'],
    hints: ['Slide a window while its product is < k; each new right end adds (window length) valid subarrays.'],
    tests: ['4 100\n10 5 2 6', '3 0\n1 2 3', '1 2\n1', '5 10\n1 1 1 1 1'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 12); return `${n} ${ri(rng, 0, 60)}\n${J(arr(rng, n, 1, big ? 3 : 9))}`; },
    solve: (inp) => {
      const [, k] = nums(lines(inp)[0]);
      const a = nums(lines(inp)[1]);
      if (k <= 1) return '0';
      let p = 1, l = 0, c = 0;
      for (let r = 0; r < a.length; r++) { p *= a[r]; while (p >= k) p /= a[l++]; c += r - l + 1; }
      return String(c);
    },
  },
  {
    problemName: 'Search a 2D Matrix',
    difficulty: 'medium',
    topics: ['array', 'binary search'],
    description: `A matrix has each row sorted left to right, and the first element of each row is greater than the last element of the previous row. Determine whether \`target\` is in the matrix, in O(log(r·c)).

**Input Format**

- Line 1: integers \`r\`, \`c\` and \`target\`.
- Next \`r\` lines: \`c\` integers each.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= r, c <= 100', '-10^4 <= value, target <= 10^4'],
    hints: ['Treat the matrix as one sorted array of r*c items: index k maps to row k / c, column k % c.'],
    tests: ['3 4 3\n1 3 5 7\n10 11 16 20\n23 30 34 60', '3 4 13\n1 3 5 7\n10 11 16 20\n23 30 34 60', '1 1 1\n1', '1 3 2\n1 3 5'],
    gen: (rng, big) => {
      const r = big ? 30 : ri(rng, 1, 5), c = big ? 30 : ri(rng, 1, 5);
      const v = Array.from({ length: r * c }, (_, i) => i * 3 + 1);
      const t = rng() < 0.5 ? v[ri(rng, 0, v.length - 1)] : ri(rng, 0, r * c * 3);
      return `${r} ${c} ${t}\n${Array.from({ length: r }, (_, i) => J(v.slice(i * c, i * c + c))).join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...rows] = lines(inp.trim());
      const [, , t] = nums(h);
      return String(rows.flatMap(nums).includes(t));
    },
  },
  {
    problemName: 'Fruit Into Baskets',
    difficulty: 'medium',
    topics: ['array', 'sliding window', 'hash table'],
    description: `Trees in a row each bear one fruit type. You have two baskets, each holding **one type** of fruit (unlimited quantity). Starting from any tree you pick exactly one fruit from every tree moving right, and must stop when a tree has a type that fits neither basket. Find the maximum number of fruits you can collect.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` fruit types.

**Output Format**

Print the maximum number of fruits.`,
    constraints: ['1 <= n <= 10^5', '0 <= type < n'],
    hints: ['This is the longest subarray containing at most two distinct values — slide a window with a frequency map.'],
    tests: ['3\n1 2 1', '4\n0 1 2 2', '5\n1 2 3 2 2', '1\n0'],
    gen: (rng, big) => { const n = big ? 4000 : ri(rng, 2, 14); return `${n}\n${J(arr(rng, n, 0, big ? 4 : 3))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      const cnt = new Map();
      let l = 0, best = 0;
      for (let r = 0; r < a.length; r++) {
        cnt.set(a[r], (cnt.get(a[r]) || 0) + 1);
        while (cnt.size > 2) { cnt.set(a[l], cnt.get(a[l]) - 1); if (!cnt.get(a[l])) cnt.delete(a[l]); l++; }
        best = Math.max(best, r - l + 1);
      }
      return String(best);
    },
  },
];

module.exports = { problems };
