// Usage (from Backend/):
//   npm run seed              add every problem that doesn't exist yet
//   npm run seed -- --dry     build + validate the problems, don't touch the DB
//   npm run seed -- --update  also overwrite problems that already exist (matched by name)
//   npm run seed -- --email=you@example.com   author to attribute problems to
//                             (default: first admin user)
require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('../Models/Problems');
const User = require('../Models/user');
const { buildProblemDocs } = require('./buildTestCases');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1];

async function main() {
  const docs = buildProblemDocs();
  const byDifficulty = docs.reduce((m, d) => ({ ...m, [d.difficulty]: (m[d.difficulty] || 0) + 1 }), {});
  console.log(`Built ${docs.length} problems`, byDifficulty);

  if (flag('dry')) {
    docs.forEach((d) => console.log(` - [${d.difficulty}] ${d.problemName} (${d.TestCases.length} tests)`));
    return;
  }

  if (!process.env.MONGOOSE_URL) throw new Error('MONGOOSE_URL is not set (check Backend/.env)');
  await mongoose.connect(process.env.MONGOOSE_URL);

  const email = opt('email');
  const author = email ? await User.findOne({ email }) : await User.findOne({ role: 'admin' });
  if (!author) throw new Error(email ? `No user with email ${email}` : 'No admin user found - pass --email=<existing user>');
  console.log(`Author: ${author.email}`);

  let added = 0, updated = 0, skipped = 0;
  for (const doc of docs) {
    const existing = await Problem.findOne({ problemName: doc.problemName });
    if (existing && !flag('update')) { skipped++; continue; }
    if (existing) {
      Object.assign(existing, doc);
      await existing.save();
      updated++;
    } else {
      await Problem.create({ ...doc, CreatedBy: author._id });
      added++;
    }
  }
  console.log(`Done. added=${added} updated=${updated} skipped(existing)=${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
