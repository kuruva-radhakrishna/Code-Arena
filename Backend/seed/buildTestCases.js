const problems = [
  ...require('./problemSet').problems,
  ...require('./problemSet2').problems,
  ...require('./problemSet3').problems,
  ...require('./problemSet4').problems,
];

const TOTAL_TESTS = 12; // per problem
const PUBLIC_TESTS = 2; // shown as examples on the problem page

// Deterministic RNG so re-running the seed produces identical test cases.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

function buildTestCases(def) {
  const rng = mulberry32(hash(def.problemName));
  const inputs = [...def.tests];
  const seen = new Set(inputs);
  let guard = 0;
  while (inputs.length < TOTAL_TESTS && guard++ < 400) {
    const big = inputs.length >= TOTAL_TESTS - 2; // last two are the "large" ones
    const inp = def.gen(rng, big);
    if (!seen.has(inp)) { seen.add(inp); inputs.push(inp); }
  }
  return inputs.map((input, i) => {
    const output = def.solve(input);
    if (output === undefined || output === '' || output === 'NaN') {
      throw new Error(`${def.problemName}: reference solver produced "${output}" for input:\n${input}`);
    }
    return { input, output: String(output), isPublic: i < PUBLIC_TESTS };
  });
}

function buildProblemDocs() {
  return problems.map((def) => ({
    problemName: def.problemName,
    problemDescription: def.description,
    Constraints: def.constraints,
    TestCases: buildTestCases(def),
    difficulty: def.difficulty,
    topics: def.topics,
    hints: def.hints,
  }));
}

module.exports = { buildProblemDocs, buildTestCases };
