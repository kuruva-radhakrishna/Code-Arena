// Creates three sample contests so the contest pages can be tried out:
//   [Sample] Weekly Contest - Ended    ended 3 days ago, with a leaderboard
//   [Sample] Weekly Contest - Live     started 1 hour ago, ends in 2 hours
//   [Sample] Weekly Contest - Upcoming starts in 2 days
//
// Usage (from Backend/):
//   npm run seed:contests              create the samples (skips ones that exist)
//   npm run seed:contests -- --remove  delete them again
//   npm run seed:contests -- --email=you@example.com   author (default: first admin user)
//
// Run `npm run seed` first: contests need at least 3 problems each.
// Note: while the "Live" sample is running, its three problems are hidden from the
// public problem list (that is how contests work) - use --remove when you are done.
require('dotenv').config();
const mongoose = require('mongoose');
const Contest = require('../Models/Contests');
const Problem = require('../Models/Problems');
const User = require('../Models/user');

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];

const PREFIX = '[Sample] ';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

// Distinct problem triples (easy / medium / hard) per contest.
const PROBLEM_SETS = {
  ended: ['Two Sum', 'Longest Substring Without Repeating Characters', 'Edit Distance'],
  live: ['Valid Palindrome', 'Coin Change', 'Trapping Rain Water'],
  upcoming: ['Missing Number', 'Number of Islands', 'Largest Rectangle in Histogram'],
};
const POINTS = [3, 5, 8];

async function main() {
  if (!process.env.MONGOOSE_URL) throw new Error('MONGOOSE_URL is not set (check Backend/.env)');
  await mongoose.connect(process.env.MONGOOSE_URL);

  if (flag('remove')) {
    const r = await Contest.deleteMany({ contestTitle: new RegExp(`^${PREFIX.replace(/[[\]]/g, '\\$&')}`) });
    console.log(`Removed ${r.deletedCount} sample contest(s).`);
    return;
  }

  const email = opt('email');
  const author = email ? await User.findOne({ email }) : await User.findOne({ role: 'admin' });
  if (!author) throw new Error(email ? `No user with email ${email}` : 'No admin user found - pass --email=<existing user>');
  const participants = await User.find({}).limit(5);
  const now = Date.now();

  const defs = [
    { key: 'ended', title: 'Weekly Contest - Ended', start: now - 3 * DAY, end: now - 3 * DAY + 2 * HOUR,
      description: 'A finished contest with a leaderboard. Good for checking the results and ranking views.' },
    { key: 'live', title: 'Weekly Contest - Live', start: now - 1 * HOUR, end: now + 2 * HOUR,
      description: 'A contest that is running right now. Good for checking the timer and submissions.' },
    { key: 'upcoming', title: 'Weekly Contest - Upcoming', start: now + 2 * DAY, end: now + 2 * DAY + 2 * HOUR,
      description: 'A contest that has not started yet.' },
  ];

  for (const d of defs) {
    const title = PREFIX + d.title;
    if (await Contest.findOne({ contestTitle: title })) { console.log(`exists:  ${title}`); continue; }

    const found = await Problem.find({ problemName: { $in: PROBLEM_SETS[d.key] } });
    const byName = Object.fromEntries(found.map((p) => [p.problemName, p]));
    const missing = PROBLEM_SETS[d.key].filter((n) => !byName[n]);
    if (missing.length) { console.log(`skipped: ${title} (run "npm run seed" first - missing ${missing.join(', ')})`); continue; }

    const problems = PROBLEM_SETS[d.key].map((n, i) => ({ problem_id: byName[n]._id, points: POINTS[i] }));
    const leaderBoard = d.key === 'upcoming' ? [] : participants.map((u, rank) => {
      const solved = Math.max(0, 3 - rank); // first user solved all three, then 2, 1, 0...
      return {
        user_id: u._id,
        points: problems.map((p, i) => (i < solved ? p.points : 0)),
        submissions: problems.map(() => []),
      };
    });

    await Contest.create({
      contestTitle: title,
      createdBy: author._id,
      problems,
      startTime: new Date(d.start),
      endTime: new Date(d.end),
      description: d.description,
      leaderBoard,
    });
    console.log(`created: ${title}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
