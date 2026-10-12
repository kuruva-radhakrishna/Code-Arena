// Seed set 2: more easy problems, linked lists and binary trees.
const {
  ri, arr, word, shuffle, lines, nums, J, sortedArr, distinct,
  randomTree, bstFrom, treeInput, parseTreeInput,
} = require('./helpers');

const LL_NOTE = 'The linked list is given by its node values from head to tail.';
const TREE_NOTE = `The tree is given in **level order** (as on LeetCode): \`null\` marks a missing child, and trailing \`null\`s are omitted.`;

const problems = [
  // ───────────── easy ─────────────
  {
    problemName: 'Sum of Digits',
    difficulty: 'easy',
    topics: ['math'],
    description: `Print the sum of the decimal digits of an integer (ignore the sign).

**Input Format**

A single integer \`n\`.

**Output Format**

Print the sum of the digits of \`|n|\`.`,
    constraints: ['-10^15 <= n <= 10^15'],
    hints: ['Repeatedly take n % 10 and divide by 10, or read the digits as characters.'],
    tests: ['123', '-905', '0', '1000000000000000'],
    gen: (rng) => String(ri(rng, -999999999999999, 999999999999999)),
    solve: (inp) => String([...inp.trim().replace('-', '')].reduce((s, c) => s + Number(c), 0)),
  },
  {
    problemName: 'Reverse Integer',
    difficulty: 'easy',
    topics: ['math'],
    description: `Reverse the digits of a 32-bit signed integer. If the reversed value does not fit in the 32-bit signed range \`[-2^31, 2^31 - 1]\`, print \`0\`.

**Input Format**

A single integer \`x\`.

**Output Format**

Print the reversed integer, or \`0\` on overflow.`,
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    hints: ['Build the answer digit by digit, but check for overflow before each step (or use a 64-bit type).'],
    tests: ['123', '-123', '120', '1534236469', '0', '-2147483648'],
    gen: (rng) => String(ri(rng, -2147483648, 2147483647)),
    solve: (inp) => {
      const x = Number(inp.trim());
      const r = Number(String(Math.abs(x)).split('').reverse().join('')) * Math.sign(x);
      return String(r < -(2 ** 31) || r > 2 ** 31 - 1 ? 0 : r);
    },
  },
  {
    problemName: 'Valid Palindrome',
    difficulty: 'easy',
    topics: ['string', 'two pointers'],
    description: `A phrase is a palindrome if, after converting all letters to lowercase and removing every character that is not a letter or digit, it reads the same forwards and backwards.

**Input Format**

A single line containing the phrase (it may contain spaces and punctuation).

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= length <= 2 * 10^5'],
    hints: ['Use two pointers, skipping non-alphanumeric characters on each side.'],
    tests: ['A man, a plan, a canal: Panama', 'race a car', ' ', '0P', 'No lemon, no melon'],
    gen: (rng, big) => {
      const base = word(rng, big ? 800 : ri(rng, 1, 6), 'abAB1');
      const mirror = base.split('').reverse().join('');
      const s = rng() < 0.5 ? `${base}, ${mirror}` : `${base} ${word(rng, 2, 'ab')}${mirror}`;
      return s.replace(/^\s+|\s+$/g, '') || 'a';
    },
    solve: (inp) => {
      const t = inp.replace(/\n$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return String(t === t.split('').reverse().join(''));
    },
  },
  {
    problemName: 'Longest Common Prefix',
    difficulty: 'easy',
    topics: ['string'],
    description: `Find the longest string that is a prefix of **every** word in a list.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated lowercase words.

**Output Format**

Print the longest common prefix, or \`-1\` if there is none.`,
    constraints: ['1 <= n <= 200', '1 <= |word| <= 100'],
    hints: ['Compare the first word with each other word, shrinking the candidate prefix.'],
    tests: ['3\nflower flow flight', '3\ndog racecar car', '1\nalone', '3\nabc abc abc'],
    gen: (rng) => {
      const n = ri(rng, 2, 6);
      const p = word(rng, ri(rng, 0, 3), 'ab');
      return `${n}\n${Array.from({ length: n }, () => p + word(rng, ri(rng, 1, 4), 'abc')).join(' ')}`;
    },
    solve: (inp) => {
      const w = lines(inp)[1].trim().split(/\s+/);
      let p = w[0];
      for (const x of w) while (!x.startsWith(p)) p = p.slice(0, -1);
      return p === '' ? '-1' : p;
    },
  },
  {
    problemName: 'Remove Duplicates from Sorted Array',
    difficulty: 'easy',
    topics: ['array', 'two pointers'],
    description: `Given a **sorted** array, print its distinct elements in order.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers in non-decreasing order.

**Output Format**

Print the distinct values on one line, space-separated.`,
    constraints: ['1 <= n <= 10^5', '-10^9 <= arr[i] <= 10^9'],
    hints: ['Keep a write index; copy an element only when it differs from the previous one.'],
    tests: ['3\n1 1 2', '10\n0 0 1 1 1 2 2 3 3 4', '1\n5', '4\n7 7 7 7'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 14);
      return `${n}\n${J(sortedArr(rng, n, -20, 20))}`;
    },
    solve: (inp) => J([...new Set(nums(lines(inp)[1]))]),
  },
  {
    problemName: 'Find Pivot Index',
    difficulty: 'easy',
    topics: ['array', 'prefix sum'],
    description: `The **pivot index** is an index where the sum of all numbers strictly to its left equals the sum of all numbers strictly to its right (an empty side has sum 0). Print the **leftmost** pivot index, or \`-1\` if none exists.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the pivot index or \`-1\`.`,
    constraints: ['1 <= n <= 10^4', '-1000 <= arr[i] <= 1000'],
    hints: ['Keep the running left sum; the right sum is total - left - arr[i].'],
    tests: ['6\n1 7 3 6 5 6', '3\n1 2 3', '3\n2 1 -1', '1\n4'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 12);
      return `${n}\n${J(arr(rng, n, -5, 5))}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      const t = a.reduce((x, y) => x + y, 0);
      let l = 0;
      for (let i = 0; i < a.length; i++) { if (l === t - l - a[i]) return String(i); l += a[i]; }
      return '-1';
    },
  },
  {
    problemName: 'Running Sum of Array',
    difficulty: 'easy',
    topics: ['array', 'prefix sum'],
    description: `Print the running (prefix) sums: element \`i\` of the output is \`arr[0] + ... + arr[i]\`.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print \`n\` space-separated prefix sums.`,
    constraints: ['1 <= n <= 10^5', '-10^4 <= arr[i] <= 10^4'],
    hints: ['Each prefix sum is the previous one plus the current element.'],
    tests: ['4\n1 2 3 4', '5\n1 1 1 1 1', '1\n-7', '5\n3 1 2 10 1'],
    gen: (rng, big) => {
      const n = big ? 4000 : ri(rng, 2, 12);
      return `${n}\n${J(arr(rng, n, -100, 100))}`;
    },
    solve: (inp) => { let s = 0; return J(nums(lines(inp)[1]).map((x) => (s += x))); },
  },
  {
    problemName: 'Max Consecutive Ones',
    difficulty: 'easy',
    topics: ['array'],
    description: `Given a binary array, find the maximum number of consecutive \`1\`s.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` values, each \`0\` or \`1\`.

**Output Format**

Print the longest run of \`1\`s.`,
    constraints: ['1 <= n <= 10^5'],
    hints: ['Count the current run; reset it on every 0 and track the maximum.'],
    tests: ['6\n1 1 0 1 1 1', '5\n1 0 1 1 0', '3\n0 0 0', '4\n1 1 1 1'],
    gen: (rng, big) => {
      const n = big ? 4000 : ri(rng, 2, 16);
      return `${n}\n${J(arr(rng, n, 0, 1))}`;
    },
    solve: (inp) => {
      let best = 0, cur = 0;
      for (const x of nums(lines(inp)[1])) { cur = x ? cur + 1 : 0; best = Math.max(best, cur); }
      return String(best);
    },
  },
  {
    problemName: 'Squares of a Sorted Array',
    difficulty: 'easy',
    topics: ['array', 'two pointers', 'sorting'],
    description: `Given a sorted array (it may contain negatives), print the squares of its elements **in sorted order**.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` integers in non-decreasing order.

**Output Format**

Print the sorted squares, space-separated.`,
    constraints: ['1 <= n <= 10^5', '-10^4 <= arr[i] <= 10^4'],
    hints: ['The largest square is at one of the two ends — fill the result from the back using two pointers.'],
    tests: ['5\n-4 -1 0 3 10', '5\n-7 -3 2 3 11', '1\n-2', '3\n1 2 3'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 12);
      return `${n}\n${J(sortedArr(rng, n, -50, 50))}`;
    },
    solve: (inp) => J(nums(lines(inp)[1]).map((x) => x * x).sort((a, b) => a - b)),
  },
  {
    problemName: 'Second Largest Element',
    difficulty: 'easy',
    topics: ['array'],
    description: `Find the **second largest distinct** value in an array. Print \`-1\` if all elements are equal.

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated integers.

**Output Format**

Print the second largest distinct value, or \`-1\`.`,
    constraints: ['1 <= n <= 10^5', '0 <= arr[i] <= 10^9'],
    hints: ['Track the largest and second largest while scanning once.'],
    tests: ['5\n12 35 1 10 34', '3\n10 10 10', '1\n5', '4\n1 2 2 2'],
    gen: (rng, big) => {
      const n = big ? 3000 : ri(rng, 2, 10);
      return `${n}\n${J(arr(rng, n, 0, big ? 1000000 : 9))}`;
    },
    solve: (inp) => {
      const s = [...new Set(nums(lines(inp)[1]))].sort((a, b) => b - a);
      return String(s.length < 2 ? -1 : s[1]);
    },
  },
  {
    problemName: 'Is Subsequence',
    difficulty: 'easy',
    topics: ['string', 'two pointers'],
    description: `Check whether string \`s\` is a **subsequence** of string \`t\` (\`s\` can be obtained from \`t\` by deleting some characters without reordering the rest).

**Input Format**

- Line 1: string \`s\`.
- Line 2: string \`t\`.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= |s|, |t| <= 10^5', 'Lowercase letters only'],
    hints: ['Walk through t once, advancing a pointer in s whenever the characters match.'],
    tests: ['abc\nahbgdc', 'axc\nahbgdc', 'a\na', 'abc\nab'],
    gen: (rng, big) => `${word(rng, ri(rng, 1, big ? 40 : 4), 'abc')}\n${word(rng, big ? 3000 : ri(rng, 2, 14), 'abc')}`,
    solve: (inp) => {
      const [s, t] = lines(inp.trim());
      let i = 0;
      for (const c of t) if (i < s.length && c === s[i]) i++;
      return String(i === s.length);
    },
  },
  {
    problemName: 'Ransom Note',
    difficulty: 'easy',
    topics: ['string', 'hash table'],
    description: `Can the ransom note be written using the letters of the magazine? Each letter in the magazine may be used **at most once**.

**Input Format**

- Line 1: the ransom note.
- Line 2: the magazine.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= length <= 10^5', 'Lowercase letters only'],
    hints: ['Count the letters of the magazine, then subtract the letters needed for the note.'],
    tests: ['a\nb', 'aa\nab', 'aa\naab', 'abc\ncba'],
    gen: (rng, big) => `${word(rng, ri(rng, 1, big ? 500 : 5), 'abc')}\n${word(rng, big ? 800 : ri(rng, 2, 12), 'abc')}`,
    solve: (inp) => {
      const [a, b] = lines(inp.trim());
      const c = {};
      for (const x of b) c[x] = (c[x] || 0) + 1;
      for (const x of a) if (!c[x]--) return 'false';
      return 'true';
    },
  },
  {
    problemName: 'First Unique Character',
    difficulty: 'easy',
    topics: ['string', 'hash table'],
    description: `Find the index of the first character that appears **exactly once** in the string. Print \`-1\` if there is none.

**Input Format**

A single line with a lowercase string.

**Output Format**

Print the 0-based index, or \`-1\`.`,
    constraints: ['1 <= |s| <= 10^5'],
    hints: ['One pass to count characters, a second pass to find the first with count 1.'],
    tests: ['leetcode', 'loveleetcode', 'aabb', 'z'],
    gen: (rng, big) => word(rng, big ? 3000 : ri(rng, 2, 14), big ? 'abcdefghijklmnopqrstuvwxyz' : 'abcd'),
    solve: (inp) => {
      const s = inp.trim();
      for (let i = 0; i < s.length; i++) if (s.indexOf(s[i]) === i && s.lastIndexOf(s[i]) === i) return String(i);
      return '-1';
    },
  },
  {
    problemName: 'Add Binary',
    difficulty: 'easy',
    topics: ['string', 'math', 'bit manipulation'],
    description: `Given two binary strings, print their sum as a binary string (no leading zeros unless the answer is \`0\`).

**Input Format**

- Line 1: binary string \`a\`.
- Line 2: binary string \`b\`.

**Output Format**

Print the binary sum.`,
    constraints: ['1 <= |a|, |b| <= 10^4', 'Strings contain only 0 and 1 and have no leading zeros (except "0" itself)'],
    hints: ['Add from the least significant bit, carrying as you go.'],
    tests: ['11\n1', '1010\n1011', '0\n0', '1111\n1111'],
    gen: (rng, big) => {
      const m = () => '1' + word(rng, ri(rng, 0, big ? 200 : 8), '01');
      return `${m()}\n${m()}`;
    },
    solve: (inp) => {
      const [a, b] = lines(inp.trim());
      return (BigInt('0b' + a) + BigInt('0b' + b)).toString(2);
    },
  },
  {
    problemName: 'Excel Sheet Column Number',
    difficulty: 'easy',
    topics: ['string', 'math'],
    description: `Spreadsheet columns are named \`A, B, ..., Z, AA, AB, ...\`. Given a column title, print its column number (\`A = 1\`, \`Z = 26\`, \`AA = 27\`).

**Input Format**

A single line with the column title (uppercase letters).

**Output Format**

Print the column number.`,
    constraints: ['1 <= |title| <= 7'],
    hints: ['It is a base-26 number where the digits run from 1 to 26.'],
    tests: ['A', 'AB', 'ZY', 'FXSHRXW', 'Z'],
    gen: (rng) => word(rng, ri(rng, 1, 6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    solve: (inp) => String([...inp.trim()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0)),
  },
  {
    problemName: 'Happy Number',
    difficulty: 'easy',
    topics: ['math', 'hash table', 'two pointers'],
    description: `Repeatedly replace a number by the sum of the squares of its digits. If the process reaches \`1\` the number is **happy**; if it loops forever it is not.

**Input Format**

A single integer \`n\`.

**Output Format**

Print \`true\` if \`n\` is happy, otherwise \`false\`.`,
    constraints: ['1 <= n <= 2^31 - 1'],
    hints: ['Remember the values you have seen — a repeat means a cycle.', 'Floyd cycle detection works too.'],
    tests: ['19', '2', '1', '7', '4'],
    gen: (rng) => String(ri(rng, 1, 2147483647)),
    solve: (inp) => {
      let n = Number(inp.trim());
      const seen = new Set();
      while (n !== 1 && !seen.has(n)) { seen.add(n); n = [...String(n)].reduce((s, d) => s + d * d, 0); }
      return String(n === 1);
    },
  },
  {
    problemName: 'Merge Two Sorted Arrays',
    difficulty: 'easy',
    topics: ['array', 'two pointers', 'sorting'],
    description: `Merge two sorted arrays into one sorted array.

**Input Format**

- Line 1: integers \`n\` and \`m\`.
- Line 2: \`n\` sorted integers.
- Line 3: \`m\` sorted integers.

**Output Format**

Print the merged array, space-separated.`,
    constraints: ['1 <= n, m <= 10^5', '-10^9 <= value <= 10^9'],
    hints: ['Keep one pointer in each array and always take the smaller current element.'],
    tests: ['3 3\n1 2 3\n2 5 6', '1 1\n1\n1', '2 3\n-5 0\n-6 -1 7', '2 2\n1 2\n3 4'],
    gen: (rng, big) => {
      const n = big ? 2000 : ri(rng, 1, 8), m = big ? 1500 : ri(rng, 1, 8);
      return `${n} ${m}\n${J(sortedArr(rng, n, -50, 50))}\n${J(sortedArr(rng, m, -50, 50))}`;
    },
    solve: (inp) => J(nums(lines(inp)[1]).concat(nums(lines(inp)[2])).sort((a, b) => a - b)),
  },
  {
    problemName: 'Factorial Trailing Zeroes',
    difficulty: 'easy',
    topics: ['math', 'number theory'],
    description: `Count the trailing zeroes of \`n!\` (the factorial of \`n\`).

**Input Format**

A single integer \`n\`.

**Output Format**

Print the number of trailing zeroes in \`n!\`.`,
    constraints: ['0 <= n <= 10^9'],
    hints: ['Every trailing zero comes from a factor pair 2 × 5; factors of 2 are plentiful.', 'Count multiples of 5, 25, 125, … up to n.'],
    tests: ['3', '5', '0', '100', '1000000000'],
    gen: (rng) => String(ri(rng, 0, 1000000000)),
    solve: (inp) => { let n = Number(inp.trim()), c = 0; while (n >= 5) { n = Math.floor(n / 5); c += n; } return String(c); },
  },
  {
    problemName: "Pascal's Triangle Row",
    difficulty: 'easy',
    topics: ['math', 'dynamic programming', 'combinatorics'],
    description: `Row \`k\` (0-indexed) of Pascal's triangle starts with \`1\`, and each inner entry is the sum of the two entries above it. Print row \`k\`.

**Input Format**

A single integer \`k\`.

**Output Format**

Print the \`k + 1\` entries of row \`k\`, space-separated.`,
    constraints: ['0 <= k <= 30'],
    hints: ['Build the row from the previous row, or use C(k, j+1) = C(k, j) * (k - j) / (j + 1).'],
    tests: ['0', '1', '3', '4', '30'],
    gen: (rng) => String(ri(rng, 2, 30)),
    solve: (inp) => {
      let row = [1];
      for (let i = 0; i < Number(inp.trim()); i++) row = [1, ...row.slice(1).map((x, j) => x + row[j]), 1];
      return J(row);
    },
  },
  {
    problemName: 'GCD and LCM',
    difficulty: 'easy',
    topics: ['math', 'number theory'],
    description: `Given two positive integers, print their greatest common divisor and least common multiple.

**Input Format**

A single line with integers \`a\` and \`b\`.

**Output Format**

Print \`gcd lcm\` separated by a space (the LCM fits in a signed 64-bit integer).`,
    constraints: ['1 <= a, b <= 10^9'],
    hints: ['Euclid: gcd(a, b) = gcd(b, a mod b).', 'lcm = a / gcd * b — divide first to limit overflow.'],
    tests: ['12 18', '7 13', '1 1', '1000000000 999999999', '100 25'],
    gen: (rng) => `${ri(rng, 1, 1000000000)} ${ri(rng, 1, 1000000)}`,
    solve: (inp) => {
      const [a, b] = nums(inp);
      const g = (x, y) => (y ? g(y, x % y) : x);
      const d = g(a, b);
      return `${d} ${(BigInt(a) / BigInt(d)) * BigInt(b)}`;
    },
  },

  // ───────────── linked lists ─────────────
  {
    problemName: 'Reverse Linked List',
    difficulty: 'easy',
    topics: ['linked list', 'recursion'],
    description: `Reverse a singly linked list. ${LL_NOTE}

**Input Format**

- Line 1: integer \`n\` (number of nodes).
- Line 2: \`n\` space-separated node values.

**Output Format**

Print the values of the reversed list, space-separated.`,
    constraints: ['1 <= n <= 5000', '-5000 <= value <= 5000'],
    hints: ['Keep prev / current pointers and flip each next pointer as you walk the list.'],
    tests: ['5\n1 2 3 4 5', '2\n1 2', '1\n9', '4\n4 3 3 1'],
    gen: (rng, big) => { const n = big ? 3000 : ri(rng, 2, 10); return `${n}\n${J(arr(rng, n, -50, 50))}`; },
    solve: (inp) => J(nums(lines(inp)[1]).reverse()),
  },
  {
    problemName: 'Middle of the Linked List',
    difficulty: 'easy',
    topics: ['linked list', 'two pointers'],
    description: `Return the **middle node** of a linked list. If there are two middle nodes, return the second one. ${LL_NOTE}

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated node values.

**Output Format**

Print the values from the middle node to the end of the list, space-separated.`,
    constraints: ['1 <= n <= 100', '1 <= value <= 100'],
    hints: ['Move one pointer one step and another two steps at a time; when the fast one ends, the slow one is in the middle.'],
    tests: ['5\n1 2 3 4 5', '6\n1 2 3 4 5 6', '1\n7', '2\n1 2'],
    gen: (rng) => { const n = ri(rng, 2, 40); return `${n}\n${J(arr(rng, n, 1, 100))}`; },
    solve: (inp) => { const a = nums(lines(inp)[1]); return J(a.slice(Math.floor(a.length / 2))); },
  },
  {
    problemName: 'Palindrome Linked List',
    difficulty: 'easy',
    topics: ['linked list', 'two pointers'],
    description: `Check whether a linked list reads the same from head to tail and from tail to head. ${LL_NOTE}

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` space-separated node values.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= n <= 10^5', '0 <= value <= 9'],
    hints: ['Find the middle, reverse the second half, then compare the halves.'],
    tests: ['4\n1 2 2 1', '2\n1 2', '1\n3', '5\n1 2 3 2 1'],
    gen: (rng) => {
      const h = arr(rng, ri(rng, 1, 5), 0, 3);
      const a = rng() < 0.5 ? [...h, ...(rng() < 0.5 ? [ri(rng, 0, 3)] : []), ...[...h].reverse()] : arr(rng, ri(rng, 2, 9), 0, 3);
      return `${a.length}\n${J(a)}`;
    },
    solve: (inp) => { const a = nums(lines(inp)[1]); return String(a.join() === [...a].reverse().join()); },
  },
  {
    problemName: 'Remove Nth Node From End of List',
    difficulty: 'medium',
    topics: ['linked list', 'two pointers'],
    description: `Remove the \`k\`-th node from the **end** of a linked list (\`k = 1\` is the last node) and print the resulting list. ${LL_NOTE}

**Input Format**

- Line 1: integers \`n\` and \`k\`.
- Line 2: \`n\` space-separated node values.

**Output Format**

Print the remaining values, space-separated.`,
    constraints: ['2 <= n <= 30', '1 <= k <= n', '0 <= value <= 100'],
    hints: ['Advance a fast pointer k nodes ahead, then move both pointers together until fast reaches the end.'],
    tests: ['5 2\n1 2 3 4 5', '2 1\n1 2', '3 3\n1 2 3', '4 2\n9 8 7 6'],
    gen: (rng) => { const n = ri(rng, 2, 25); return `${n} ${ri(rng, 1, n)}\n${J(arr(rng, n, 0, 100))}`; },
    solve: (inp) => { const [n, k] = nums(lines(inp)[0]); const a = nums(lines(inp)[1]); a.splice(n - k, 1); return J(a); },
  },
  {
    problemName: 'Remove All Duplicates from Sorted List',
    difficulty: 'medium',
    topics: ['linked list', 'two pointers'],
    description: `In a **sorted** linked list, delete **every** node whose value appears more than once (not just the extra copies), and print what remains. ${LL_NOTE}

**Input Format**

- Line 1: integer \`n\`.
- Line 2: \`n\` sorted values.

**Output Format**

Print the remaining values, space-separated, or \`EMPTY\` if no node remains.`,
    constraints: ['1 <= n <= 300', '-100 <= value <= 100'],
    hints: ['Use a dummy head and skip every run of equal values longer than one.'],
    tests: ['7\n1 2 3 3 4 4 5', '5\n1 1 1 2 3', '3\n1 1 1', '1\n8'],
    gen: (rng) => { const n = ri(rng, 2, 14); return `${n}\n${J(sortedArr(rng, n, 0, 8))}`; },
    solve: (inp) => {
      const a = nums(lines(inp)[1]);
      const out = a.filter((x) => a.indexOf(x) === a.lastIndexOf(x));
      return out.length ? J(out) : 'EMPTY';
    },
  },
  {
    problemName: 'Add Two Numbers (Linked Lists)',
    difficulty: 'medium',
    topics: ['linked list', 'math'],
    description: `Two non-negative integers are stored as linked lists of digits in **reverse order** (the head is the ones digit). Add them and print the sum in the same format.

**Input Format**

- Line 1: integers \`n\` and \`m\` (lengths of the two lists).
- Line 2: \`n\` digits of the first number (reversed).
- Line 3: \`m\` digits of the second number (reversed).

**Output Format**

Print the digits of the sum in reverse order, space-separated.`,
    constraints: ['1 <= n, m <= 100', 'Each digit is 0-9', 'No leading zeros except for the number 0 itself'],
    hints: ['Add digit by digit and carry; do not forget a final carry.'],
    tests: ['3 3\n2 4 3\n5 6 4', '1 1\n0\n0', '7 4\n9 9 9 9 9 9 9\n9 9 9 9', '1 1\n5\n5'],
    gen: (rng, big) => {
      const mk = () => { const n = ri(rng, 1, big ? 60 : 6); const d = arr(rng, n, 0, 9); if (n > 1 && d[n - 1] === 0) d[n - 1] = 1; return d; };
      const a = mk(), b = mk();
      return `${a.length} ${b.length}\n${J(a)}\n${J(b)}`;
    },
    solve: (inp) => {
      const a = nums(lines(inp)[1]), b = nums(lines(inp)[2]);
      const out = [];
      let c = 0;
      for (let i = 0; i < Math.max(a.length, b.length) || c; i++) { const s = (a[i] || 0) + (b[i] || 0) + c; out.push(s % 10); c = Math.floor(s / 10); }
      return J(out);
    },
  },

  // ───────────── binary trees ─────────────
  {
    problemName: 'Maximum Depth of Binary Tree',
    difficulty: 'easy',
    topics: ['tree', 'depth-first search', 'breadth-first search'],
    description: `Find the maximum depth of a binary tree — the number of nodes on the longest path from the root down to a leaf. ${TREE_NOTE}

**Input Format**

- Line 1: integer \`n\` (number of tokens on the next line).
- Line 2: \`n\` space-separated tokens (integers or \`null\`).

**Output Format**

Print the maximum depth.`,
    constraints: ['1 <= nodes <= 10^4'],
    hints: ['depth(node) = 1 + max(depth(left), depth(right)), with depth(null) = 0.'],
    tests: ['7\n3 9 20 null null 15 7', '3\n1 null 2', '1\n5', '5\n1 2 3 4 5'],
    gen: (rng, big) => treeInput(randomTree(rng, big ? 800 : ri(rng, 1, 12), -9, 9)),
    solve: (inp) => {
      const d = (n) => (n ? 1 + Math.max(d(n.l), d(n.r)) : 0);
      return String(d(parseTreeInput(inp)));
    },
  },
  {
    problemName: 'Symmetric Tree',
    difficulty: 'easy',
    topics: ['tree', 'depth-first search', 'breadth-first search'],
    description: `Check whether a binary tree is a mirror image of itself (symmetric around its centre). ${TREE_NOTE}

**Input Format**

- Line 1: integer \`n\` (number of tokens).
- Line 2: \`n\` space-separated tokens (integers or \`null\`).

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= nodes <= 1000'],
    hints: ['Two subtrees mirror each other if their roots match and left mirrors right and right mirrors left.'],
    tests: ['7\n1 2 2 3 4 4 3', '7\n1 2 2 null 3 null 3', '1\n1', '3\n1 2 3'],
    gen: (rng) => {
      const half = randomTree(rng, ri(rng, 1, 5), 0, 2);
      const mirror = (n) => (n ? { v: n.v, l: mirror(n.r), r: mirror(n.l) } : null);
      const root = rng() < 0.6 ? { v: 1, l: half, r: mirror(half) } : randomTree(rng, ri(rng, 2, 9), 0, 2);
      return treeInput(root);
    },
    solve: (inp) => {
      const m = (a, b) => (!a || !b ? a === b : a.v === b.v && m(a.l, b.r) && m(a.r, b.l));
      const r = parseTreeInput(inp);
      return String(m(r.l, r.r));
    },
  },
  {
    problemName: 'Path Sum',
    difficulty: 'easy',
    topics: ['tree', 'depth-first search'],
    description: `Is there a **root-to-leaf** path whose node values add up to \`target\`? ${TREE_NOTE}

**Input Format**

- Line 1: integers \`n\` (number of tokens) and \`target\`.
- Line 2: \`n\` space-separated tokens.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= nodes <= 5000', '-1000 <= value, target <= 1000'],
    hints: ['Subtract the node value from the target while going down; at a leaf check whether it reaches 0.'],
    tests: ['7 22\n5 4 8 11 null 13 4', '3 5\n1 2 3', '1 1\n1', '3 3\n1 2 null'],
    gen: (rng, big) => {
      const root = randomTree(rng, big ? 500 : ri(rng, 1, 10), -3, 6);
      const t = serializeSums(root);
      const target = rng() < 0.5 ? t[ri(rng, 0, t.length - 1)] : ri(rng, -5, 20);
      const [cnt, toks] = treeInput(root).split('\n');
      return `${cnt} ${target}\n${toks}`;
    },
    solve: (inp) => {
      const [, target] = nums(lines(inp)[0]);
      const root = require('./helpers').buildTree(lines(inp)[1].trim().split(/\s+/));
      const go = (n, s) => (!n ? false : !n.l && !n.r ? s + n.v === target : go(n.l, s + n.v) || go(n.r, s + n.v));
      return String(go(root, 0));
    },
  },
  {
    problemName: 'Diameter of Binary Tree',
    difficulty: 'easy',
    topics: ['tree', 'depth-first search'],
    description: `The **diameter** of a binary tree is the number of **edges** on the longest path between any two nodes (the path need not pass through the root). ${TREE_NOTE}

**Input Format**

- Line 1: integer \`n\` (number of tokens).
- Line 2: \`n\` space-separated tokens.

**Output Format**

Print the diameter.`,
    constraints: ['1 <= nodes <= 10^4'],
    hints: ['For each node the best path through it is height(left) + height(right).'],
    tests: ['5\n1 2 3 4 5', '3\n1 2 null', '1\n1', '7\n1 2 3 4 null null 5'],
    gen: (rng, big) => treeInput(randomTree(rng, big ? 800 : ri(rng, 1, 14), 0, 9)),
    solve: (inp) => {
      let best = 0;
      const h = (n) => { if (!n) return 0; const l = h(n.l), r = h(n.r); best = Math.max(best, l + r); return 1 + Math.max(l, r); };
      h(parseTreeInput(inp));
      return String(best);
    },
  },
  {
    problemName: 'Binary Tree Right Side View',
    difficulty: 'medium',
    topics: ['tree', 'breadth-first search'],
    description: `Imagine standing on the right side of a binary tree. Print the values you can see, from top to bottom (the last node of each level). ${TREE_NOTE}

**Input Format**

- Line 1: integer \`n\` (number of tokens).
- Line 2: \`n\` space-separated tokens.

**Output Format**

Print the visible values, space-separated.`,
    constraints: ['1 <= nodes <= 100', '0 <= value <= 100'],
    hints: ['Do a level-order traversal and keep the last node of every level.'],
    tests: ['7\n1 2 3 null 5 null 4', '3\n1 null 3', '1\n9', '5\n1 2 3 4 null'],
    gen: (rng, big) => treeInput(randomTree(rng, big ? 300 : ri(rng, 1, 14), 0, 99)),
    solve: (inp) => {
      const out = [];
      let level = [parseTreeInput(inp)];
      while (level.length) { out.push(level[level.length - 1].v); level = level.flatMap((n) => [n.l, n.r]).filter(Boolean); }
      return J(out);
    },
  },
  {
    problemName: 'Validate Binary Search Tree',
    difficulty: 'medium',
    topics: ['tree', 'depth-first search'],
    description: `Check whether a binary tree is a valid **binary search tree**: for every node, all values in its left subtree are **strictly smaller** and all values in its right subtree are **strictly larger**. ${TREE_NOTE}

**Input Format**

- Line 1: integer \`n\` (number of tokens).
- Line 2: \`n\` space-separated tokens.

**Output Format**

Print \`true\` or \`false\`.`,
    constraints: ['1 <= nodes <= 10^4', '-2^31 <= value <= 2^31 - 1'],
    hints: ['Checking only parent/child pairs is not enough — pass down a (low, high) range for every subtree.', 'An in-order traversal of a BST is strictly increasing.'],
    tests: ['3\n2 1 3', '7\n5 1 4 null null 3 6', '1\n1', '3\n2 2 2'],
    gen: (rng) => {
      const root = bstFrom(require('./helpers').distinct(rng, ri(rng, 2, 10), 0, 40));
      if (rng() < 0.5) { const nodes = []; const walk = (n) => { if (n) { nodes.push(n); walk(n.l); walk(n.r); } }; walk(root); nodes[ri(rng, 0, nodes.length - 1)].v = ri(rng, 0, 40); }
      return treeInput(root);
    },
    solve: (inp) => {
      const ok = (n, lo, hi) => !n || (n.v > lo && n.v < hi && ok(n.l, lo, n.v) && ok(n.r, n.v, hi));
      return String(ok(parseTreeInput(inp), -Infinity, Infinity));
    },
  },
  {
    problemName: 'Lowest Common Ancestor in a BST',
    difficulty: 'medium',
    topics: ['tree', 'binary search'],
    description: `A binary search tree is built by inserting distinct values one by one, in the given order, into an initially empty tree (smaller values go left, larger go right). Find the **lowest common ancestor** of two values \`p\` and \`q\` that are both in the tree. A node may be its own ancestor.

**Input Format**

- Line 1: integers \`n\`, \`p\`, \`q\`.
- Line 2: \`n\` distinct insertion values.

**Output Format**

Print the value of the lowest common ancestor.`,
    constraints: ['2 <= n <= 10^4', 'All values are distinct', 'p and q are present in the tree'],
    hints: ['Starting at the root: if both p and q are smaller go left, if both are larger go right, otherwise the current node is the answer.'],
    tests: ['9 2 8\n6 2 8 0 4 7 9 3 5', '9 2 4\n6 2 8 0 4 7 9 3 5', '2 1 2\n2 1', '5 3 5\n4 3 5 1 2'],
    gen: (rng) => {
      const n = ri(rng, 2, 14);
      const v = distinct(rng, n, 0, 60);
      const [p, q] = [v[ri(rng, 0, n - 1)], v[ri(rng, 0, n - 1)]];
      return `${n} ${p} ${q}\n${J(v)}`;
    },
    solve: (inp) => {
      const [, p, q] = nums(lines(inp)[0]);
      let c = bstFrom(nums(lines(inp)[1]));
      while (c) { if (p < c.v && q < c.v) c = c.l; else if (p > c.v && q > c.v) c = c.r; else return String(c.v); }
    },
  },
];

// all root-to-leaf sums, used to pick interesting targets for "Path Sum"
function serializeSums(root) {
  const out = [];
  const go = (n, s) => { if (!n) return; if (!n.l && !n.r) out.push(s + n.v); go(n.l, s + n.v); go(n.r, s + n.v); };
  go(root, 0);
  return out;
}

module.exports = { problems };
