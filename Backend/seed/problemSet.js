// Seed problem definitions.
// Every test-case output is produced by running the reference `solve` below,
// so expected outputs can never drift from the statement. See seedProblems.js.

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
const grid = (rng, r, c, pOne) =>
  Array.from({ length: r }, () =>
    Array.from({ length: c }, () => (rng() < pOne ? '1' : '0')).join('')
  );

const toRoman = (n) => {
  const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
  return s;
};

const problems = [
  // ───────────────────────────── EASY ─────────────────────────────
  {
    problemName: 'Two Sum',
    difficulty: 'easy',
    topics: ['array', 'hash table'],
    description: `Given an array of integers and a target value, find the two **different** indices \`i < j\` such that \`arr[i] + arr[j] = target\`.

It is guaranteed that exactly one such pair exists.

**Input Format**

- Line 1: two integers \`n\` and \`target\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the two indices (0-based) separated by a space, smaller index first.`,
    constraints: ['2 <= n <= 10^5', '-10^9 <= arr[i], target <= 10^9', 'Exactly one valid pair exists'],
    hints: ['Brute force is O(n^2). Can you remember the numbers you have already seen?', 'For each x, look up (target - x) in a hash map of value → index.'],
    tests: ['4 9\n2 7 11 15', '3 6\n3 2 4', '2 6\n3 3', '5 -8\n-1 -2 -3 -4 -5'],
    gen: (rng, big) => {
      for (;;) {
        const n = big ? 2000 : ri(rng, 3, 12);
        const a = arr(rng, n, big ? -100000 : -20, big ? 100000 : 20);
        const i = ri(rng, 0, n - 2), j = ri(rng, i + 1, n - 1);
        const t = a[i] + a[j];
        let c = 0;
        for (let x = 0; x < n; x++) for (let y = x + 1; y < n; y++) if (a[x] + a[y] === t) c++;
        if (c === 1) return `${n} ${t}\n${J(a)}`;
      }
    },
    solve: (inp) => {
      const [h, l2] = lines(inp);
      const [n, t] = nums(h);
      const a = nums(l2);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (a[i] + a[j] === t) return `${i} ${j}`;
    },
  },
  {
    problemName: 'Reverse a String',
    difficulty: 'easy',
    topics: ['string', 'two pointers'],
    description: `Given a string, print it reversed.

**Input Format**

A single line containing a string \`s\` of lowercase English letters.

**Output Format**

Print the reversed string.`,
    constraints: ['1 <= |s| <= 10^5', 's contains only lowercase English letters'],
    hints: ['Swap the first and last characters, then move both pointers inward.'],
    tests: ['hello', 'a', 'racecar', 'abcdefghijklmnopqrstuvwxyz'],
    gen: (rng, big) => word(rng, big ? 5000 : ri(rng, 2, 30)),
    solve: (inp) => inp.trim().split('').reverse().join(''),
  },
  {
    problemName: 'Palindrome Number',
    difficulty: 'easy',
    topics: ['math'],
    description: `Given an integer \`x\`, determine whether it reads the same forwards and backwards.

Negative numbers are never palindromes (the minus sign only appears at the front).

**Input Format**

A single integer \`x\`.

**Output Format**

Print \`true\` if \`x\` is a palindrome, otherwise \`false\`.`,
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    hints: ['Try it without converting the number to a string: reverse the second half of the digits.'],
    tests: ['121', '-121', '10', '0', '12321', '1000021', '2147447412'],
    gen: (rng) => {
      if (rng() < 0.5) {
        const h = String(ri(rng, 1, 99999));
        const mid = rng() < 0.5 ? '' : String(ri(rng, 0, 9));
        return h + mid + h.split('').reverse().join('');
      }
      return String(ri(rng, -100000, 2000000000));
    },
    solve: (inp) => {
      const s = inp.trim();
      return String(s === s.split('').reverse().join('') && !s.startsWith('-'));
    },
  },
  {
    problemName: 'Contains Duplicate',
    difficulty: 'easy',
    topics: ['array', 'hash table', 'sorting'],
    description: `Given an array of integers, determine whether any value appears **at least twice**.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print \`true\` if some value appears at least twice, otherwise \`false\`.`,
    constraints: ['1 <= n <= 10^5', '-10^9 <= arr[i] <= 10^9'],
    hints: ['A set remembers what you have seen in O(1).', 'Alternatively sort the array and compare neighbours.'],
    tests: ['4\n1 2 3 1', '4\n1 2 3 4', '1\n7', '10\n1 1 1 3 3 4 3 2 4 2'],
    gen: (rng, big) => {
      const n = big ? 5000 : ri(rng, 2, 12);
      const a = big ? shuffle(rng, Array.from({ length: n }, (_, i) => i * 3 - 1000)) : arr(rng, n, -30, 30);
      if (big && rng() < 0.5) a[ri(rng, 0, n - 1)] = a[0];
      return `${n}\n${J(a)}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      return String(new Set(a).size !== a.length);
    },
  },
  {
    problemName: 'Missing Number',
    difficulty: 'easy',
    topics: ['array', 'math', 'bit manipulation'],
    description: `You are given \`n\` **distinct** integers, each in the range \`[0, n]\`. Exactly one number from that range is missing. Find it.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the missing number.`,
    constraints: ['1 <= n <= 10^5', 'All values are distinct and lie in [0, n]'],
    hints: ['The sum of 0..n is n(n+1)/2.', 'XOR-ing all indices and values also cancels everything but the missing number.'],
    tests: ['3\n3 0 1', '2\n0 1', '1\n1', '9\n9 6 4 2 3 5 7 0 1'],
    gen: (rng, big) => {
      const n = big ? 5000 : ri(rng, 2, 15);
      const all = shuffle(rng, Array.from({ length: n + 1 }, (_, i) => i));
      all.pop();
      return `${n}\n${J(all)}`;
    },
    solve: (inp) => {
      const [n] = nums(lines(inp)[0]);
      const a = nums(lines(inp)[1]);
      return String((n * (n + 1)) / 2 - a.reduce((x, y) => x + y, 0));
    },
  },
  {
    problemName: 'Single Number',
    difficulty: 'easy',
    topics: ['array', 'bit manipulation'],
    description: `In an array of integers every value appears **exactly twice**, except for one value that appears once. Find that value.

Aim for linear time and constant extra space.

**Input Format**

- Line 1: odd integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the value that appears once.`,
    constraints: ['1 <= n <= 10^5 (n is odd)', '-10^9 <= arr[i] <= 10^9'],
    hints: ['x ^ x = 0 and x ^ 0 = x.', 'XOR every element together.'],
    tests: ['3\n2 2 1', '5\n4 1 2 1 2', '1\n1', '7\n-3 5 5 -3 9 8 8'],
    gen: (rng, big) => {
      const k = big ? 2000 : ri(rng, 1, 6);
      const vals = shuffle(rng, Array.from({ length: k + 1 }, (_, i) => i * 7 - 40));
      const a = [];
      for (let i = 0; i < k; i++) a.push(vals[i], vals[i]);
      a.push(vals[k]);
      shuffle(rng, a);
      return `${a.length}\n${J(a)}`;
    },
    solve: (inp) => String(nums(lines(inp)[1]).reduce((x, y) => x ^ y, 0)),
  },
  {
    problemName: 'Best Time to Buy and Sell Stock',
    difficulty: 'easy',
    topics: ['array', 'dynamic programming', 'greedy'],
    description: `You are given the price of a stock on each of \`n\` consecutive days. You may buy once and sell once later (selling on a day after buying). Find the **maximum profit**. If no profit is possible, the answer is \`0\`.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated prices.

**Output Format**

Print the maximum profit.`,
    constraints: ['1 <= n <= 10^5', '0 <= prices[i] <= 10^4'],
    hints: ['Track the lowest price seen so far while scanning left to right.'],
    tests: ['6\n7 1 5 3 6 4', '5\n7 6 4 3 1', '1\n5', '2\n1 2', '4\n2 4 1 7'],
    gen: (rng, big) => {
      const n = big ? 5000 : ri(rng, 2, 14);
      return `${n}\n${J(arr(rng, n, 0, big ? 10000 : 50))}`;
    },
    solve: (inp) => {
      let lo = Infinity, best = 0;
      for (const p of nums(lines(inp)[1])) { lo = Math.min(lo, p); best = Math.max(best, p - lo); }
      return String(best);
    },
  },
  {
    problemName: 'Move Zeroes',
    difficulty: 'easy',
    topics: ['array', 'two pointers'],
    description: `Move all \`0\`s of an array to its end while keeping the relative order of the non-zero elements.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the resulting array on a single line, space-separated.`,
    constraints: ['1 <= n <= 10^5', '-10^9 <= arr[i] <= 10^9'],
    hints: ['Keep a write pointer for the next non-zero position.'],
    tests: ['5\n0 1 0 3 12', '1\n0', '4\n1 2 3 4', '6\n0 0 0 0 0 7'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 14);
      const a = Array.from({ length: n }, () => (rng() < 0.4 ? 0 : ri(rng, -9, 9)));
      return `${n}\n${J(a)}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      const nz = a.filter((x) => x !== 0);
      return J(nz.concat(Array(a.length - nz.length).fill(0)));
    },
  },
  {
    problemName: 'Roman to Integer',
    difficulty: 'easy',
    topics: ['string', 'math'],
    description: `Convert a Roman numeral to an integer.

Symbols: \`I=1, V=5, X=10, L=50, C=100, D=500, M=1000\`. When a smaller symbol appears **before** a larger one it is subtracted (e.g. \`IV = 4\`, \`IX = 9\`, \`XL = 40\`, \`XC = 90\`, \`CD = 400\`, \`CM = 900\`).

**Input Format**

A single line with a valid Roman numeral.

**Output Format**

Print its integer value.`,
    constraints: ['1 <= value <= 3999', 'The input is a valid Roman numeral'],
    hints: ['If a symbol is smaller than the one to its right, subtract it; otherwise add it.'],
    tests: ['III', 'LVIII', 'MCMXCIV', 'IV', 'MMMCMXCIX'],
    gen: (rng) => toRoman(ri(rng, 1, 3999)),
    solve: (inp) => {
      const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      const s = inp.trim();
      let r = 0;
      for (let i = 0; i < s.length; i++) r += v[s[i]] < (v[s[i + 1]] || 0) ? -v[s[i]] : v[s[i]];
      return String(r);
    },
  },
  {
    problemName: 'Majority Element',
    difficulty: 'easy',
    topics: ['array', 'hash table', 'sorting'],
    description: `The **majority element** is the value that appears **more than ⌊n / 2⌋ times**. Given an array that is guaranteed to have one, find it.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the majority element.`,
    constraints: ['1 <= n <= 5 * 10^4', '-10^9 <= arr[i] <= 10^9', 'A majority element always exists'],
    hints: ['A frequency map works in O(n) space.', 'Boyer–Moore voting does it in O(1) space.'],
    tests: ['3\n3 2 3', '7\n2 2 1 1 1 2 2', '1\n9', '5\n-1 -1 -1 4 5'],
    gen: (rng, big) => {
      const n = big ? 4001 : ri(rng, 3, 15);
      const m = ri(rng, -20, 20);
      const need = Math.floor(n / 2) + 1;
      const a = Array(need).fill(m);
      while (a.length < n) a.push(ri(rng, -20, 20));
      return `${n}\n${J(shuffle(rng, a))}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      const c = new Map();
      for (const x of a) c.set(x, (c.get(x) || 0) + 1);
      for (const [k, v] of c) if (v > Math.floor(a.length / 2)) return String(k);
    },
  },
  {
    problemName: 'Power of Two',
    difficulty: 'easy',
    topics: ['math', 'bit manipulation'],
    description: `Determine whether an integer \`n\` is a power of two (that is, \`n = 2^k\` for some integer \`k >= 0\`).

**Input Format**

A single integer \`n\`.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['-2^31 <= n <= 2^31 - 1'],
    hints: ['A power of two has exactly one set bit.', 'n & (n - 1) clears the lowest set bit.'],
    tests: ['1', '16', '3', '0', '-16', '1073741824', '2147483647'],
    gen: (rng) => (rng() < 0.5 ? String(2 ** ri(rng, 0, 30)) : String(ri(rng, -1000, 100000))),
    solve: (inp) => {
      const n = Number(inp.trim());
      return String(n > 0 && Number.isInteger(Math.log2(n)));
    },
  },
  {
    problemName: 'Fibonacci Number',
    difficulty: 'easy',
    topics: ['math', 'dynamic programming', 'recursion'],
    description: `The Fibonacci sequence is defined by \`F(0) = 0\`, \`F(1) = 1\` and \`F(n) = F(n-1) + F(n-2)\`.

Given \`n\`, print \`F(n)\`.

**Input Format**

A single integer \`n\`.

**Output Format**

Print \`F(n)\` (it fits in a signed 64-bit integer).`,
    constraints: ['0 <= n <= 90'],
    hints: ['Plain recursion is exponential — memoize or iterate.', 'You only need the previous two values.'],
    tests: ['0', '1', '2', '10', '50', '90'],
    gen: (rng) => String(ri(rng, 3, 89)),
    solve: (inp) => {
      let a = 0n, b = 1n;
      for (let i = 0; i < Number(inp.trim()); i++) [a, b] = [b, a + b];
      return a.toString();
    },
  },
  {
    problemName: 'Number of 1 Bits',
    difficulty: 'easy',
    topics: ['bit manipulation', 'math'],
    description: `Count the number of \`1\` bits in the binary representation of a non-negative integer.

**Input Format**

A single integer \`n\`.

**Output Format**

Print the number of set bits of \`n\`.`,
    constraints: ['0 <= n <= 2^31 - 1'],
    hints: ['Check the lowest bit, then shift right.', 'Brian Kernighan: n & (n - 1) removes the lowest set bit.'],
    tests: ['11', '128', '0', '2147483647', '2147483646'],
    gen: (rng) => String(ri(rng, 0, 2147483647)),
    solve: (inp) => {
      let n = Number(inp.trim()), c = 0;
      while (n > 0) { c += n % 2; n = Math.floor(n / 2); }
      return String(c);
    },
  },
  {
    problemName: 'Count Primes',
    difficulty: 'easy',
    topics: ['math', 'number theory'],
    description: `Count the prime numbers that are **strictly less than** \`n\`.

**Input Format**

A single integer \`n\`.

**Output Format**

Print the number of primes less than \`n\`.`,
    constraints: ['0 <= n <= 5 * 10^6'],
    hints: ['Testing each number separately is too slow for large n.', 'Use the Sieve of Eratosthenes: cross out multiples of every prime.'],
    tests: ['10', '0', '1', '2', '3', '100', '1000000'],
    gen: (rng) => String(ri(rng, 2, 3000000)),
    solve: (inp) => {
      const n = Number(inp.trim());
      if (n < 3) return '0';
      const s = new Uint8Array(n);
      let c = 0;
      for (let i = 2; i < n; i++) {
        if (!s[i]) { c++; for (let j = i * i; j < n; j += i) s[j] = 1; }
      }
      return String(c);
    },
  },

  // ───────────────────────────── MEDIUM ─────────────────────────────
  {
    problemName: 'Maximum Subarray',
    difficulty: 'medium',
    topics: ['array', 'dynamic programming'],
    description: `Find the contiguous, **non-empty** subarray with the largest sum and print that sum.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the maximum subarray sum.`,
    constraints: ['1 <= n <= 10^5', '-10^4 <= arr[i] <= 10^4'],
    hints: ['Let best-ending-here(i) = max(arr[i], best-ending-here(i-1) + arr[i]).', "This is Kadane's algorithm."],
    tests: ['9\n-2 1 -3 4 -1 2 1 -5 4', '1\n1', '5\n5 4 -1 7 8', '3\n-3 -1 -2'],
    gen: (rng, big) => {
      const n = big ? 5000 : ri(rng, 2, 14);
      return `${n}\n${J(arr(rng, n, big ? -10000 : -20, big ? 10000 : 20))}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      let cur = a[0], best = a[0];
      for (let i = 1; i < a.length; i++) { cur = Math.max(a[i], cur + a[i]); best = Math.max(best, cur); }
      return String(best);
    },
  },
  {
    problemName: 'Product of Array Except Self',
    difficulty: 'medium',
    topics: ['array', 'prefix sum'],
    description: `For each index \`i\`, compute the product of **all elements except** \`arr[i]\`. Do it **without using division**.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print \`n\` space-separated integers — the answer for each index.`,
    constraints: ['2 <= n <= 10^5', '-10 <= arr[i] <= 10', 'Every prefix and suffix product fits in a 32-bit signed integer'],
    hints: ['Answer[i] = (product of everything to the left) × (product of everything to the right).', 'Do one pass left-to-right, one right-to-left.'],
    tests: ['4\n1 2 3 4', '5\n-1 1 0 -3 3', '2\n5 -2', '3\n0 0 2'],
    gen: (rng) => {
      for (;;) {
        const n = ri(rng, 2, 10);
        const a = arr(rng, n, -4, 4);
        const total = a.reduce((p, x) => p * BigInt(x), 1n);
        if (total > -2147483648n && total < 2147483647n) return `${n}\n${J(a)}`;
      }
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      return J(a.map((_, i) => a.reduce((p, x, j) => (j === i ? p : p * x), 1)).map((v) => (v === 0 ? 0 : v)));
    },
  },
  {
    problemName: 'Container With Most Water',
    difficulty: 'medium',
    topics: ['array', 'two pointers', 'greedy'],
    description: `You are given \`n\` vertical lines; line \`i\` has height \`h[i]\` and sits at x-coordinate \`i\`. Choose two lines that, together with the x-axis, form a container holding the **most water**.

The water held is \`min(h[i], h[j]) * (j - i)\`.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated heights.

**Output Format**

Print the maximum amount of water.`,
    constraints: ['2 <= n <= 10^5', '0 <= h[i] <= 10^4'],
    hints: ['Start with the widest container and shrink it.', 'Always move the pointer at the shorter line — moving the taller one can never help.'],
    tests: ['9\n1 8 6 2 5 4 8 3 7', '2\n1 1', '4\n1 2 4 3', '5\n0 0 0 0 0'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 14);
      return `${n}\n${J(arr(rng, n, 0, big ? 10000 : 30))}`;
    },
    solve: (inp) => {
      const h = nums(lines(inp)[1]);
      let best = 0;
      for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) best = Math.max(best, Math.min(h[i], h[j]) * (j - i));
      return String(best);
    },
  },
  {
    problemName: '3Sum Count',
    difficulty: 'medium',
    topics: ['array', 'two pointers', 'sorting'],
    description: `Count the **unique triplets of values** \`(a, b, c)\` (taken from three different positions) with \`a + b + c = 0\`.

Two triplets are the same if they contain the same multiset of values, e.g. \`(-1, 0, 1)\` and \`(1, -1, 0)\` count once.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the number of unique triplets.`,
    constraints: ['3 <= n <= 3000', '-10^5 <= arr[i] <= 10^5'],
    hints: ['Sort first, fix one element, then run two pointers on the rest.', 'Skip equal neighbours to avoid counting the same triplet twice.'],
    tests: ['6\n-1 0 1 2 -1 -4', '3\n0 1 1', '3\n0 0 0', '8\n-2 0 0 2 2 -2 0 0'],
    gen: (rng, big) => {
      const n = big ? 400 : ri(rng, 3, 14);
      return `${n}\n${J(arr(rng, n, big ? -100 : -8, big ? 100 : 8))}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]).sort((x, y) => x - y);
      const seen = new Set();
      for (let i = 0; i < a.length; i++) {
        let l = i + 1, r = a.length - 1;
        while (l < r) {
          const s = a[i] + a[l] + a[r];
          if (s === 0) { seen.add(`${a[i]},${a[l]},${a[r]}`); l++; r--; }
          else if (s < 0) l++; else r--;
        }
      }
      return String(seen.size);
    },
  },
  {
    problemName: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    topics: ['string', 'sliding window', 'hash table'],
    description: `Find the length of the longest **substring** (contiguous) that contains no repeated character.

**Input Format**

A single line with a string \`s\` of lowercase letters.

**Output Format**

Print the length of the longest substring without repeating characters.`,
    constraints: ['1 <= |s| <= 10^5', 's contains lowercase English letters'],
    hints: ['Keep a window [l, r] with all distinct characters.', 'When s[r] was already seen inside the window, jump l just past its previous occurrence.'],
    tests: ['abcabcbb', 'bbbbb', 'pwwkew', 'a', 'abcdefghijklmnopqrstuvwxyz', 'dvdf'],
    gen: (rng, big) => word(rng, big ? 4000 : ri(rng, 2, 25), big ? 'abcdefghijklmnopqrstuvwxyz' : 'abcd'),
    solve: (inp) => {
      const s = inp.trim();
      const last = new Map();
      let l = 0, best = 0;
      for (let r = 0; r < s.length; r++) {
        if (last.has(s[r]) && last.get(s[r]) >= l) l = last.get(s[r]) + 1;
        last.set(s[r], r);
        best = Math.max(best, r - l + 1);
      }
      return String(best);
    },
  },
  {
    problemName: 'Coin Change',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `Given coin denominations (unlimited supply of each) and a target amount, find the **fewest coins** that add up to exactly the amount. Print \`-1\` if it is impossible.

**Input Format**

- Line 1: integers \`n\` (number of denominations) and \`amount\`.
- Line 2: \`n\` space-separated coin values.

**Output Format**

Print the minimum number of coins, or \`-1\`.`,
    constraints: ['1 <= n <= 12', '1 <= coin <= 2^31 - 1', '0 <= amount <= 10^4'],
    hints: ['Greedy (largest coin first) fails for coins like {1, 3, 4}.', 'dp[x] = 1 + min(dp[x - c]) over all coins c <= x.'],
    tests: ['3 11\n1 2 5', '1 3\n2', '1 0\n1', '3 6\n1 3 4', '2 7\n2 4'],
    gen: (rng, big) => {
      const n = ri(rng, 1, big ? 10 : 4);
      return `${n} ${big ? ri(rng, 5000, 10000) : ri(rng, 0, 40)}\n${J(arr(rng, n, 1, big ? 500 : 12))}`;
    },
    solve: (inp) => {
      const [, amt] = nums(lines(inp)[0]);
      const coins = nums(lines(inp)[1]);
      const dp = Array(amt + 1).fill(Infinity);
      dp[0] = 0;
      for (let x = 1; x <= amt; x++) for (const c of coins) if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1);
      return String(dp[amt] === Infinity ? -1 : dp[amt]);
    },
  },
  {
    problemName: 'Longest Increasing Subsequence',
    difficulty: 'medium',
    topics: ['dynamic programming', 'binary search', 'array'],
    description: `Find the length of the **longest strictly increasing subsequence** (elements need not be adjacent).

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the length of the LIS.`,
    constraints: ['1 <= n <= 10^5', '-10^9 <= arr[i] <= 10^9'],
    hints: ['O(n^2) DP: dp[i] = 1 + max(dp[j]) for j < i with arr[j] < arr[i].', 'For O(n log n) keep the smallest possible tail of each length and binary-search it.'],
    tests: ['8\n10 9 2 5 3 7 101 18', '6\n0 1 0 3 2 3', '7\n7 7 7 7 7 7 7', '1\n4'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 16);
      return `${n}\n${J(arr(rng, n, big ? -100000 : -20, big ? 100000 : 20))}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      const dp = a.map(() => 1);
      for (let i = 0; i < a.length; i++) for (let j = 0; j < i; j++) if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
      return String(Math.max(...dp));
    },
  },
  {
    problemName: 'House Robber',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `Houses are in a row and house \`i\` holds \`money[i]\`. You cannot rob **two adjacent** houses. Find the maximum amount you can rob.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated non-negative integers.

**Output Format**

Print the maximum amount.`,
    constraints: ['1 <= n <= 10^5', '0 <= money[i] <= 10^4'],
    hints: ['For each house choose: skip it (best so far) or rob it (best two houses ago + its money).'],
    tests: ['4\n1 2 3 1', '5\n2 7 9 3 1', '1\n5', '3\n2 1 2', '6\n0 0 0 0 0 0'],
    gen: (rng, big) => {
      const n = big ? 5000 : ri(rng, 2, 14);
      return `${n}\n${J(arr(rng, n, 0, big ? 10000 : 30))}`;
    },
    solve: (inp) => {
      let a = 0, b = 0;
      for (const m of nums(lines(inp)[1])) [a, b] = [b, Math.max(b, a + m)];
      return String(b);
    },
  },
  {
    problemName: 'Number of Islands',
    difficulty: 'medium',
    topics: ['graph', 'depth-first search', 'breadth-first search'],
    description: `A grid contains \`1\` (land) and \`0\` (water). An **island** is a maximal group of land cells connected **horizontally or vertically**. Count the islands.

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: each a string of \`c\` characters, each \`0\` or \`1\`.

**Output Format**

Print the number of islands.`,
    constraints: ['1 <= r, c <= 300'],
    hints: ['Scan the grid; whenever you find unvisited land, count an island and flood-fill it.', 'Use an explicit stack/queue if recursion depth worries you.'],
    tests: ['4 5\n11000\n11000\n00100\n00011', '1 1\n1', '1 1\n0', '3 3\n101\n010\n101'],
    gen: (rng, big) => {
      const r = big ? 40 : ri(rng, 1, 7), c = big ? 40 : ri(rng, 1, 7);
      return `${r} ${c}\n${grid(rng, r, c, 0.45).join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...g] = lines(inp.trim());
      const [r, c] = nums(h);
      const seen = g.map((row) => row.split('').map(() => false));
      let cnt = 0;
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
        if (g[i][j] !== '1' || seen[i][j]) continue;
        cnt++;
        const st = [[i, j]];
        seen[i][j] = true;
        while (st.length) {
          const [x, y] = st.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < r && ny < c && g[nx][ny] === '1' && !seen[nx][ny]) { seen[nx][ny] = true; st.push([nx, ny]); }
          }
        }
      }
      return String(cnt);
    },
  },
  {
    problemName: 'Rotate Array',
    difficulty: 'medium',
    topics: ['array', 'two pointers'],
    description: `Rotate an array to the **right** by \`k\` positions. \`k\` may be larger than \`n\`.

**Input Format**

- Line 1: integers \`n\` and \`k\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the rotated array on a single line, space-separated.`,
    constraints: ['1 <= n <= 10^5', '0 <= k <= 10^9', '-10^9 <= arr[i] <= 10^9'],
    hints: ['Only k mod n matters.', 'Reverse the whole array, then reverse the first k and the remaining n-k elements.'],
    tests: ['7 3\n1 2 3 4 5 6 7', '4 2\n-1 -100 3 99', '3 0\n1 2 3', '2 5\n1 2', '1 100\n8'],
    gen: (rng, big) => {
      const n = big ? 2000 : ri(rng, 2, 12);
      return `${n} ${ri(rng, 0, big ? 1000000000 : 30)}\n${J(arr(rng, n, -50, 50))}`;
    },
    solve: (inp) => {
      const [n, k] = nums(lines(inp)[0]);
      const a = nums(lines(inp)[1]);
      const s = k % n;
      return J(a.slice(n - s).concat(a.slice(0, n - s)));
    },
  },
  {
    problemName: 'Group Anagrams Count',
    difficulty: 'medium',
    topics: ['string', 'hash table', 'sorting'],
    description: `Words are **anagrams** if one can be rearranged into the other. Split the given words into groups of mutual anagrams and print how many groups there are.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated lowercase words.

**Output Format**

Print the number of anagram groups.`,
    constraints: ['1 <= n <= 10^4', '1 <= |word| <= 100', 'Words contain only lowercase letters'],
    hints: ['Two anagrams share the same sorted-letters key.', 'Put each word in a hash map under its key and count the keys.'],
    tests: ['6\neat tea tan ate nat bat', '1\na', '3\nabc abc abc', '4\nab ba abc cab'],
    gen: (rng, big) => {
      const n = big ? 1500 : ri(rng, 2, 10);
      const w = Array.from({ length: n }, () => word(rng, ri(rng, 1, big ? 6 : 3), 'abc'));
      return `${n}\n${w.join(' ')}`;
    },
    solve: (inp) => String(new Set(lines(inp)[1].trim().split(/\s+/).map((w) => w.split('').sort().join(''))).size),
  },
  {
    problemName: 'Count Subarrays With Sum K',
    difficulty: 'medium',
    topics: ['array', 'hash table', 'prefix sum'],
    description: `Count the **contiguous, non-empty subarrays** whose elements sum to exactly \`K\`. Elements may be negative.

**Input Format**

- Line 1: integers \`n\` and \`K\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the number of subarrays with sum \`K\`.`,
    constraints: ['1 <= n <= 10^5', '-1000 <= arr[i] <= 1000', '-10^7 <= K <= 10^7'],
    hints: ['A subarray (i, j] sums to K when prefix[j] - prefix[i] = K.', 'Count how many earlier prefix sums equal (current prefix - K) using a hash map.'],
    tests: ['3 2\n1 1 1', '3 3\n1 2 3', '5 0\n0 0 0 0 0', '5 -2\n-1 -1 1 -1 1'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 14);
      return `${n} ${ri(rng, -5, 8)}\n${J(arr(rng, n, big ? -5 : -3, big ? 5 : 3))}`;
    },
    solve: (inp) => {
      const [, k] = nums(lines(inp)[0]);
      const a = nums(lines(inp)[1]);
      const m = new Map([[0, 1]]);
      let p = 0, c = 0;
      for (const x of a) { p += x; c += m.get(p - k) || 0; m.set(p, (m.get(p) || 0) + 1); }
      return String(c);
    },
  },
  {
    problemName: 'Minimum Path Sum',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `Starting at the top-left cell of a grid of non-negative numbers, move **only right or down** to reach the bottom-right cell. Find the path with the **minimum sum** of visited cells (including both ends).

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: \`c\` space-separated integers each.

**Output Format**

Print the minimum path sum.`,
    constraints: ['1 <= r, c <= 200', '0 <= cell <= 100'],
    hints: ['dp[i][j] = cell[i][j] + min(dp[i-1][j], dp[i][j-1]).'],
    tests: ['3 3\n1 3 1\n1 5 1\n4 2 1', '2 3\n1 2 3\n4 5 6', '1 1\n7', '1 4\n1 2 3 4'],
    gen: (rng, big) => {
      const r = big ? 60 : ri(rng, 1, 6), c = big ? 60 : ri(rng, 1, 6);
      return `${r} ${c}\n${Array.from({ length: r }, () => J(arr(rng, c, 0, 100))).join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...g] = lines(inp.trim());
      const [r, c] = nums(h);
      const a = g.map(nums);
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
        if (i === 0 && j === 0) continue;
        a[i][j] += Math.min(i ? a[i - 1][j] : Infinity, j ? a[i][j - 1] : Infinity);
      }
      return String(a[r - 1][c - 1]);
    },
  },
  {
    problemName: 'Unique Paths',
    difficulty: 'medium',
    topics: ['dynamic programming', 'math', 'combinatorics'],
    description: `A robot starts at the top-left of an \`m × n\` grid and may only move **right or down**. How many distinct paths lead to the bottom-right corner?

**Input Format**

A single line with integers \`m\` and \`n\`.

**Output Format**

Print the number of unique paths.`,
    constraints: ['1 <= m, n <= 16'],
    hints: ['paths(i, j) = paths(i-1, j) + paths(i, j-1).', 'It is also C(m+n-2, m-1).'],
    tests: ['3 7', '3 2', '1 1', '1 16', '16 16', '7 3'],
    gen: (rng) => `${ri(rng, 1, 16)} ${ri(rng, 1, 16)}`,
    solve: (inp) => {
      const [m, n] = nums(inp);
      const dp = Array.from({ length: m }, () => Array(n).fill(1));
      for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
      return String(dp[m - 1][n - 1]);
    },
  },
  {
    problemName: 'Word Break',
    difficulty: 'medium',
    topics: ['dynamic programming', 'string', 'hash table'],
    description: `Given a string \`s\` and a dictionary of words, decide whether \`s\` can be split into a sequence of one or more dictionary words (words may be reused).

**Input Format**

- Line 1: string \`s\`.
- Line 2: integer \`n\` — number of dictionary words.
- Line 3: \`n\` space-separated words.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= |s| <= 300', '1 <= n <= 1000', '1 <= |word| <= 20', 'Lowercase letters only'],
    hints: ['dp[i] = true if s[0..i) can be segmented.', 'dp[i] is true when some j < i has dp[j] true and s[j..i) is in the dictionary.'],
    tests: ['leetcode\n2\nleet code', 'applepenapple\n2\napple pen', 'catsandog\n5\ncats dog sand and cat', 'a\n1\na', 'aaaaaaa\n2\naaaa aaa'],
    gen: (rng, big) => {
      const n = ri(rng, 2, 5);
      const d = Array.from({ length: n }, () => word(rng, ri(rng, 1, 3), 'ab'));
      let s = '';
      if (rng() < 0.6) {
        const k = big ? 80 : ri(rng, 1, 5);
        for (let i = 0; i < k; i++) s += d[ri(rng, 0, n - 1)];
        if (rng() < 0.3) s = s.slice(0, -1) + (s.slice(-1) === 'a' ? 'b' : 'a');
      } else s = word(rng, ri(rng, 2, big ? 80 : 10), 'ab');
      return `${s}\n${n}\n${d.join(' ')}`;
    },
    solve: (inp) => {
      const [s, , w] = lines(inp);
      const d = new Set(w.trim().split(/\s+/));
      const dp = Array(s.length + 1).fill(false);
      dp[0] = true;
      for (let i = 1; i <= s.length; i++) for (let j = 0; j < i; j++) if (dp[j] && d.has(s.slice(j, i))) { dp[i] = true; break; }
      return String(dp[s.length]);
    },
  },
  {
    problemName: 'Search in Rotated Sorted Array',
    difficulty: 'medium',
    topics: ['array', 'binary search'],
    description: `A sorted array of **distinct** integers was rotated at an unknown pivot (e.g. \`[0,1,2,4,5,6,7]\` → \`[4,5,6,7,0,1,2]\`). Find the index of \`target\`, or print \`-1\` if it is absent. Your solution should run in **O(log n)**.

**Input Format**

- Line 1: integers \`n\` and \`target\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the 0-based index of \`target\`, or \`-1\`.`,
    constraints: ['1 <= n <= 10^5', 'All values are distinct', '-10^9 <= arr[i], target <= 10^9'],
    hints: ['At any midpoint, at least one half of the range is sorted.', 'Check whether target lies inside the sorted half, and discard the other.'],
    tests: ['7 0\n4 5 6 7 0 1 2', '7 3\n4 5 6 7 0 1 2', '1 0\n1', '1 1\n1', '5 5\n5 1 2 3 4'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 14);
      const base = Array.from({ length: n }, (_, i) => i * 3 - 10);
      const k = ri(rng, 0, n - 1);
      const a = base.slice(k).concat(base.slice(0, k));
      const t = rng() < 0.7 ? a[ri(rng, 0, n - 1)] : ri(rng, -12, n * 3);
      return `${n} ${t}\n${J(a)}`;
    },
    solve: (inp) => {
      const [, t] = nums(lines(inp)[0]);
      return String(nums(lines(inp)[1]).indexOf(t));
    },
  },
  {
    problemName: 'Daily Temperatures',
    difficulty: 'medium',
    topics: ['array', 'stack'],
    description: `For each day, find how many days you must wait until a **warmer** temperature. If there is no future warmer day, the answer for that day is \`0\`.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated temperatures.

**Output Format**

Print \`n\` space-separated integers.`,
    constraints: ['1 <= n <= 10^5', '30 <= temp <= 100'],
    hints: ['Keep a stack of indices whose answer is still unknown (temperatures decrease down the stack).', 'When today is warmer than the stack top, pop and record the distance.'],
    tests: ['8\n73 74 75 71 69 72 76 73', '4\n30 40 50 60', '3\n30 60 90', '1\n50', '4\n90 80 70 60'],
    gen: (rng, big) => {
      const n = big ? 4000 : ri(rng, 2, 14);
      return `${n}\n${J(arr(rng, n, 30, 100))}`;
    },
    solve: (inp) => {
      const t = nums(lines(inp)[1]);
      const res = t.map(() => 0);
      for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[j] > t[i]) { res[i] = j - i; break; }
      return J(res);
    },
  },
  {
    problemName: 'Shortest Path in a Binary Grid',
    difficulty: 'medium',
    topics: ['graph', 'breadth-first search', 'shortest path'],
    description: `A grid has open cells (\`0\`) and blocked cells (\`1\`). Starting at the top-left cell, reach the bottom-right cell moving **up, down, left or right** through open cells only.

Print the **minimum number of moves**, or \`-1\` if the destination can't be reached (this includes the case where the start or end cell is blocked).

**Input Format**

- Line 1: integers \`r\` and \`c\`.
- Next \`r\` lines: a string of \`c\` characters, each \`0\` or \`1\`.

**Output Format**

Print the minimum number of moves, or \`-1\`.`,
    constraints: ['1 <= r, c <= 300'],
    hints: ['BFS from the start explores cells in order of distance.', 'Store the distance with each queued cell.'],
    tests: ['3 3\n000\n110\n000', '2 2\n01\n10', '1 1\n0', '1 1\n1', '3 4\n0000\n0110\n0000'],
    gen: (rng, big) => {
      const r = big ? 40 : ri(rng, 1, 7), c = big ? 40 : ri(rng, 1, 7);
      return `${r} ${c}\n${grid(rng, r, c, 0.28).join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...g] = lines(inp.trim());
      const [r, c] = nums(h);
      if (g[0][0] === '1' || g[r - 1][c - 1] === '1') return '-1';
      const d = g.map((row) => row.split('').map(() => -1));
      d[0][0] = 0;
      const q = [[0, 0]];
      for (let qi = 0; qi < q.length; qi++) {
        const [x, y] = q[qi];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < r && ny < c && g[nx][ny] === '0' && d[nx][ny] < 0) { d[nx][ny] = d[x][y] + 1; q.push([nx, ny]); }
        }
      }
      return String(d[r - 1][c - 1]);
    },
  },
  {
    problemName: 'Network Delay Time',
    difficulty: 'medium',
    topics: ['graph', 'shortest path', 'heap'],
    description: `A network has \`n\` nodes numbered \`1..n\` and \`m\` directed edges \`u → v\` with travel time \`w\`. A signal is sent from node \`k\`. How long until **all** nodes have received it? Print \`-1\` if some node is unreachable.

**Input Format**

- Line 1: integers \`n\`, \`m\`, \`k\`.
- Next \`m\` lines: \`u v w\`.

**Output Format**

Print the time at which the last node receives the signal, or \`-1\`.`,
    constraints: ['1 <= n <= 100', '0 <= m <= 6000', '1 <= w <= 100'],
    hints: ['This is single-source shortest path with non-negative weights — use Dijkstra.', 'The answer is the largest shortest-distance.'],
    tests: ['4 3 2\n2 1 1\n2 3 1\n3 4 1', '2 1 1\n1 2 1', '2 1 2\n1 2 1', '1 0 1', '3 3 1\n1 2 5\n1 3 2\n3 2 1'],
    gen: (rng, big) => {
      const n = ri(rng, 2, big ? 80 : 7);
      const m = ri(rng, n - 1, big ? 600 : n * 2);
      const e = Array.from({ length: m }, () => `${ri(rng, 1, n)} ${ri(rng, 1, n)} ${ri(rng, 1, 20)}`);
      return `${n} ${m} ${ri(rng, 1, n)}\n${e.join('\n')}`;
    },
    solve: (inp) => {
      const [h, ...e] = lines(inp.trim());
      const [n, , k] = nums(h);
      const d = Array(n + 1).fill(Infinity);
      d[k] = 0;
      const E = e.filter(Boolean).map(nums);
      for (let i = 0; i < n; i++) for (const [u, v, w] of E) if (d[u] + w < d[v]) d[v] = d[u] + w;
      const mx = Math.max(...d.slice(1));
      return String(mx === Infinity ? -1 : mx);
    },
  },
  {
    problemName: 'Longest Common Subsequence',
    difficulty: 'medium',
    topics: ['dynamic programming', 'string'],
    description: `A **subsequence** keeps the original order of characters but may skip some. Find the length of the longest subsequence common to two strings.

**Input Format**

- Line 1: string \`a\`.
- Line 2: string \`b\`.

**Output Format**

Print the length of their LCS.`,
    constraints: ['1 <= |a|, |b| <= 1000', 'Lowercase letters only'],
    hints: ['dp[i][j] = LCS of the first i chars of a and the first j chars of b.', 'If a[i-1] = b[j-1] take dp[i-1][j-1] + 1, otherwise max(dp[i-1][j], dp[i][j-1]).'],
    tests: ['abcde\nace', 'abc\nabc', 'abc\ndef', 'a\na', 'abcbdab\nbdcaba'],
    gen: (rng, big) => `${word(rng, big ? 600 : ri(rng, 1, 12), 'abcd')}\n${word(rng, big ? 600 : ri(rng, 1, 12), 'abcd')}`,
    solve: (inp) => {
      const [a, b] = lines(inp.trim()).map((s) => s.trim());
      const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      return String(dp[a.length][b.length]);
    },
  },
  {
    problemName: '0/1 Knapsack',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `You have \`n\` items, each with a weight and a value, and a bag of capacity \`W\`. Each item may be taken **at most once**. Maximise the total value without exceeding the capacity.

**Input Format**

- Line 1: integers \`n\` and \`W\`.
- Line 2: \`n\` weights.
- Line 3: \`n\` values.

**Output Format**

Print the maximum total value.`,
    constraints: ['1 <= n <= 100', '1 <= W <= 10^4', '1 <= weight[i] <= W', '1 <= value[i] <= 10^4'],
    hints: ['dp[w] = best value using capacity w.', 'Iterate capacity downwards so each item is used once.'],
    tests: ['3 4\n4 5 1\n1 2 3', '3 50\n10 20 30\n60 100 120', '1 5\n5\n100', '4 7\n1 3 4 5\n1 4 5 7'],
    gen: (rng, big) => {
      const n = big ? 60 : ri(rng, 1, 7);
      const W = big ? ri(rng, 2000, 9000) : ri(rng, 1, 30);
      return `${n} ${W}\n${J(arr(rng, n, 1, big ? 800 : Math.min(W, 15)))}\n${J(arr(rng, n, 1, 1000))}`;
    },
    solve: (inp) => {
      const [n, W] = nums(lines(inp)[0]);
      const w = nums(lines(inp)[1]), v = nums(lines(inp)[2]);
      const dp = Array(W + 1).fill(0);
      for (let i = 0; i < n; i++) for (let c = W; c >= w[i]; c--) dp[c] = Math.max(dp[c], dp[c - w[i]] + v[i]);
      return String(dp[W]);
    },
  },
  {
    problemName: 'Partition Equal Subset Sum',
    difficulty: 'medium',
    topics: ['dynamic programming', 'array'],
    description: `Can the array be split into **two subsets with equal sums**?

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated positive integers.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= n <= 200', '1 <= arr[i] <= 100'],
    hints: ['If the total is odd, the answer is false.', 'Otherwise ask: is there a subset with sum total/2? (subset-sum DP)'],
    tests: ['4\n1 5 11 5', '4\n1 2 3 5', '1\n2', '2\n3 3', '6\n1 1 1 1 1 1'],
    gen: (rng, big) => {
      const n = big ? 60 : ri(rng, 2, 10);
      return `${n}\n${J(arr(rng, n, 1, big ? 100 : 12))}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      const t = a.reduce((x, y) => x + y, 0);
      if (t % 2) return 'false';
      const dp = Array(t / 2 + 1).fill(false);
      dp[0] = true;
      for (const x of a) for (let s = t / 2; s >= x; s--) dp[s] = dp[s] || dp[s - x];
      return String(dp[t / 2]);
    },
  },

  // ───────────────────────────── HARD ─────────────────────────────
  {
    problemName: 'Edit Distance',
    difficulty: 'hard',
    topics: ['dynamic programming', 'string'],
    description: `Find the minimum number of operations to convert \`word1\` into \`word2\`. Allowed operations on a single character: **insert**, **delete**, **replace**.

**Input Format**

- Line 1: \`word1\`.
- Line 2: \`word2\`.

**Output Format**

Print the minimum number of operations.`,
    constraints: ['1 <= |word1|, |word2| <= 500', 'Lowercase letters only'],
    hints: ['dp[i][j] = edit distance between the first i chars of word1 and the first j of word2.', 'Match → dp[i-1][j-1]; otherwise 1 + min(insert, delete, replace).'],
    tests: ['horse\nros', 'intention\nexecution', 'a\na', 'abc\nxyz', 'kitten\nsitting'],
    gen: (rng, big) => `${word(rng, big ? 300 : ri(rng, 1, 10), 'abc')}\n${word(rng, big ? 300 : ri(rng, 1, 10), 'abc')}`,
    solve: (inp) => {
      const [a, b] = lines(inp.trim()).map((s) => s.trim());
      const dp = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      return String(dp[a.length][b.length]);
    },
  },
  {
    problemName: 'Trapping Rain Water',
    difficulty: 'hard',
    topics: ['array', 'two pointers', 'stack', 'dynamic programming'],
    description: `An elevation map is given as bar heights, each bar having width 1. After rain, how many units of water are **trapped** between the bars?

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated heights.

**Output Format**

Print the total trapped water.`,
    constraints: ['1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    hints: ['Water above bar i = min(tallest bar to its left, tallest to its right) - height[i].', 'Two pointers from both ends can do this in O(1) extra space.'],
    tests: ['12\n0 1 0 2 1 0 1 3 2 1 2 1', '6\n4 2 0 3 2 5', '1\n5', '3\n3 0 3', '5\n1 2 3 4 5'],
    gen: (rng, big) => {
      const n = big ? 4000 : ri(rng, 3, 16);
      return `${n}\n${J(arr(rng, n, 0, big ? 100000 : 9))}`;
    },
    solve: (inp) => {
      const h = nums(lines(inp)[1]);
      let tot = 0;
      for (let i = 0; i < h.length; i++) {
        const l = Math.max(...h.slice(0, i + 1)), r = Math.max(...h.slice(i));
        tot += Math.min(l, r) - h[i];
      }
      return String(tot);
    },
  },
  {
    problemName: 'Median of Two Sorted Arrays',
    difficulty: 'hard',
    topics: ['array', 'binary search'],
    description: `Given two **sorted** arrays, find the median of all their elements combined. Aim for \`O(log(min(n, m)))\`.

**Input Format**

- Line 1: integers \`n\` and \`m\`.
- Line 2: \`n\` sorted integers.
- Line 3: \`m\` sorted integers.

**Output Format**

Print the median with **exactly one digit after the decimal point** (for example \`2.0\` or \`2.5\`).`,
    constraints: ['1 <= n, m <= 10^5', '-10^6 <= value <= 10^6'],
    hints: ['Binary-search the partition point in the smaller array.', 'A correct partition has max(left halves) <= min(right halves).'],
    tests: ['2 1\n1 3\n2', '2 2\n1 2\n3 4', '1 1\n5\n5', '3 1\n-5 -3 -1\n10', '1 3\n7\n1 2 3'],
    gen: (rng, big) => {
      const n = big ? 1500 : ri(rng, 1, 7), m = big ? 1200 : ri(rng, 1, 7);
      const s = (k) => arr(rng, k, -1000, 1000).sort((x, y) => x - y);
      return `${n} ${m}\n${J(s(n))}\n${J(s(m))}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]).concat(nums(lines(inp)[2])).sort((x, y) => x - y);
      const n = a.length;
      const med = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
      return med.toFixed(1);
    },
  },
  {
    problemName: 'Longest Valid Parentheses',
    difficulty: 'hard',
    topics: ['string', 'stack', 'dynamic programming'],
    description: `Given a string of only \`(\` and \`)\`, find the length of the longest **contiguous** substring that is a valid (well-formed) parentheses sequence.

**Input Format**

A single line containing the string.

**Output Format**

Print the length of the longest valid substring.`,
    constraints: ['1 <= |s| <= 3 * 10^4'],
    hints: ['Use a stack of indices; push -1 first as a base marker.', 'On ")" pop; if the stack is empty push the current index as the new base, else update the best length with i - stack.top.'],
    tests: ['(()', ')()())', '()', ')))(((', '()(()', '(()())'],
    gen: (rng, big) => word(rng, big ? 3000 : ri(rng, 2, 18), '()'),
    solve: (inp) => {
      const s = inp.trim();
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        let bal = 0;
        for (let j = i; j < s.length; j++) {
          bal += s[j] === '(' ? 1 : -1;
          if (bal < 0) break;
          if (bal === 0) best = Math.max(best, j - i + 1);
        }
      }
      return String(best);
    },
  },
  {
    problemName: 'N-Queens Count',
    difficulty: 'hard',
    topics: ['backtracking', 'recursion'],
    description: `Place \`n\` queens on an \`n × n\` chessboard so that no two queens attack each other (no two share a row, column or diagonal). How many distinct arrangements exist?

**Input Format**

A single integer \`n\`.

**Output Format**

Print the number of distinct solutions.`,
    constraints: ['1 <= n <= 10'],
    hints: ['Place one queen per row, trying each column.', 'Track used columns and both diagonals (r - c and r + c) in sets or bitmasks.'],
    tests: ['1', '2', '4', '5', '8', '10'],
    gen: (rng) => String(ri(rng, 1, 9)),
    solve: (inp) => {
      const n = Number(inp.trim());
      let c = 0;
      const cols = new Set(), d1 = new Set(), d2 = new Set();
      const go = (r) => {
        if (r === n) { c++; return; }
        for (let j = 0; j < n; j++) {
          if (cols.has(j) || d1.has(r - j) || d2.has(r + j)) continue;
          cols.add(j); d1.add(r - j); d2.add(r + j);
          go(r + 1);
          cols.delete(j); d1.delete(r - j); d2.delete(r + j);
        }
      };
      go(0);
      return String(c);
    },
  },
  {
    problemName: 'Largest Rectangle in Histogram',
    difficulty: 'hard',
    topics: ['array', 'stack'],
    description: `A histogram has \`n\` bars of width 1 and given heights. Find the area of the **largest rectangle** that fits entirely inside the histogram.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated heights.

**Output Format**

Print the maximum rectangle area.`,
    constraints: ['1 <= n <= 10^5', '0 <= height[i] <= 10^4'],
    hints: ['For each bar, find how far left and right it can extend before meeting a shorter bar.', 'A monotonic increasing stack finds both boundaries in O(n).'],
    tests: ['6\n2 1 5 6 2 3', '2\n2 4', '1\n0', '5\n3 3 3 3 3', '5\n5 4 3 2 1'],
    gen: (rng, big) => {
      const n = big ? 4000 : ri(rng, 2, 14);
      return `${n}\n${J(arr(rng, n, 0, big ? 10000 : 12))}`;
    },
    solve: (inp) => {
      const h = nums(lines(inp)[1]);
      let best = 0;
      for (let i = 0; i < h.length; i++) {
        let l = i, r = i;
        while (l > 0 && h[l - 1] >= h[i]) l--;
        while (r < h.length - 1 && h[r + 1] >= h[i]) r++;
        best = Math.max(best, h[i] * (r - l + 1));
      }
      return String(best);
    },
  },
  {
    problemName: 'Sliding Window Maximum',
    difficulty: 'hard',
    topics: ['array', 'sliding window', 'queue', 'heap'],
    description: `A window of size \`k\` slides from the left of the array to the right, one position at a time. For every window position, report the **maximum** element inside it.

**Input Format**

- Line 1: integers \`n\` and \`k\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the \`n - k + 1\` window maximums, space-separated.`,
    constraints: ['1 <= k <= n <= 10^5', '-10^4 <= arr[i] <= 10^4'],
    hints: ['A heap works in O(n log n).', 'A deque of indices with decreasing values gives O(n): drop smaller values from the back, expired indices from the front.'],
    tests: ['8 3\n1 3 -1 -3 5 3 6 7', '1 1\n1', '5 5\n9 8 7 6 5', '6 1\n4 -2 0 3 1 1', '7 2\n1 -1 -1 -1 2 2 2'],
    gen: (rng, big) => {
      const n = big ? 4000 : ri(rng, 2, 14);
      return `${n} ${ri(rng, 1, big ? 50 : n)}\n${J(arr(rng, n, big ? -10000 : -12, big ? 10000 : 12))}`;
    },
    solve: (inp) => {
      const [n, k] = nums(lines(inp)[0]);
      const a = nums(lines(inp)[1]);
      const out = [];
      for (let i = 0; i + k <= n; i++) out.push(Math.max(...a.slice(i, i + k)));
      return J(out);
    },
  },
];

module.exports = { problems };
