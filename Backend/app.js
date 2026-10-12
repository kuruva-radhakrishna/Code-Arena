require("dotenv").config();

const express = require("express");
const app = express();
const { connection } = require("./Database/Connection.js");
const mongoose = require("mongoose");
const port = process.env.PORT;

const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const session = require("express-session");
const MongoStore = require('connect-mongo');

const User = require("./Models/user.js");
const UserRoute = require("./Routes/UserRoute.js");
const ProblemRoute = require("./Routes/ProblemRoute.js");
const { SubmissionRouter } = require("./Routes/SubmissionRoute.js");
const ContestRoute = require("./Routes/ContestRoute.js");
const AdminRoute = require("./Routes/AdminRoute.js");
const AIRoute = require("./Routes/AIRoute.js");
const Problem = require("./Models/Problems.js");
const Submission = require("./Models/Submissions.js");
const Contest = require("./Models/Contests.js");

const cors = require("cors");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_LOCAL
].filter(Boolean);

// Exact origins that may call this API (comma-separated FRONTEND_URL_EXTRA adds more, e.g. a Vercel preview).
// FRONTEND_PREVIEW_PATTERN is an optional regex for preview deployments, for example:
//   ^https://code-arena-.*-kuruva-radhakrishnas-projects.vercel.app$
// Only origins matching the list or the pattern get CORS headers; anything else is still blocked.
const extraOrigins = (process.env.FRONTEND_URL_EXTRA || '').split(',').map((s) => s.trim()).filter(Boolean);
const previewPattern = process.env.FRONTEND_PREVIEW_PATTERN ? new RegExp(process.env.FRONTEND_PREVIEW_PATTERN) : null;
const corsOptions = {
  origin(origin, callback) {
    // no Origin header = same-origin / curl / server-to-server
    if (!origin) return callback(null, true);
    const ok = allowedOrigins.includes(origin) || extraOrigins.includes(origin) || (previewPattern && previewPattern.test(origin));
    return callback(null, !!ok);
  },
  credentials: true,
};

app.use(cors(corsOptions));


connection();

passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate())
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//JSON  parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

app.use(
  session({
    secret: "yourSecretKey",
    store: MongoStore.create({ mongoUrl: process.env.MONGOOSE_URL }),
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days, optional
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", UserRoute); // Handles /register, /login, /auth/check, etc.

app.use('/ai', AIRoute);

app.use("/problems", ProblemRoute);

app.use("/submissions", SubmissionRouter);

app.use("/contests", ContestRoute);

app.use("/admin", AdminRoute);

app.get('/api/profile/summary', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user._id;
    const userRole = req.user.role;

    // Fetch all problems
    const problems = await Problem.find({});
    // Fetch last 20 submissions by user
    const submissionsByUser = await Submission.find({ user_id: userId })
      .sort({ submittedAt: -1 })
      .limit(20)
      .populate('problem_id');

    // Solved stats must come from ALL of the user's accepted submissions, not just the
    // 20 most recent ones shown in the table below.
    const solvedIds = await Submission.find({ user_id: userId, verdict: 'Accepted' }).distinct('problem_id');
    const solvedSet = new Set(solvedIds.map(id => id.toString()));
    const [totalSubmissions, acceptedSubmissions] = await Promise.all([
      Submission.countDocuments({ user_id: userId }),
      Submission.countDocuments({ user_id: userId, verdict: 'Accepted' }),
    ]);
    let solvedStats = { easy: 0, medium: 0, hard: 0, total: 0 };
    let problemTotals = { easy: 0, medium: 0, hard: 0 };
    problems.forEach(prob => {
      if (!prob || !prob._id) return;
      if (prob.difficulty === 'easy') problemTotals.easy++;
      else if (prob.difficulty === 'medium') problemTotals.medium++;
      else if (prob.difficulty === 'hard') problemTotals.hard++;
      if (solvedSet.has(prob._id.toString())) {
        if (prob.difficulty === 'easy') solvedStats.easy++;
        else if (prob.difficulty === 'medium') solvedStats.medium++;
        else if (prob.difficulty === 'hard') solvedStats.hard++;
        solvedStats.total++;
      }
    });

    // Problems created by user (if admin)
    let problemsByUser = [];
    if (userRole === 'admin') {
      problemsByUser = await Problem.find({ CreatedBy: userId });
    }

    // Contests created by user
    const createdContests = await Contest.find({ createdBy: userId });

    // Contests attended by user (with rank, points, solvedProblems)
    const allContests = await Contest.find({ 'leaderBoard.user_id': userId });
    const attendedContests = allContests.map(contest => {
      const sorted = [...contest.leaderBoard].map(entry => {
        const totalPoints = (entry.points || []).reduce((sum, val) => sum + val, 0);
        const uid = entry.user_id?._id?.toString?.() || entry.user_id?.toString?.();

        // Get latest accepted submission timestamp
        let lastSubmission = null;
        for (const problemSubs of entry.submissions || []) {
          for (let i = problemSubs.length - 1; i >= 0; i--) {
            if (problemSubs[i].verdict === 'Accepted') {
              const submittedAt = new Date(problemSubs[i].submittedAt);
              if (!lastSubmission || submittedAt > lastSubmission) {
                lastSubmission = submittedAt;
              }
              break; // only last AC per problem needed
            }
          }
        }

        return {
          ...entry,
          uid,
          totalPoints,
          lastSubmission
        };
      }).sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (!a.lastSubmission) return 1;
        if (!b.lastSubmission) return -1;
        return new Date(a.lastSubmission) - new Date(b.lastSubmission);
      });

      const idx = sorted.findIndex(e => e.uid === userId.toString());

      let userStats = null;
      if (idx !== -1) {
        const entry = sorted[idx];
        userStats = {
          rank: idx + 1,
          totalPoints: entry.totalPoints,
          solvedProblems: (entry.points || []).filter(p => p > 0).length
        };
      }

      return {
        _id: contest._id,
        contestTitle: contest.contestTitle,
        startTime: contest.startTime,
        userStats,
      };
    });
    res.json({
      user: req.user,
      solvedStats,
      submissionStats: { total: totalSubmissions, accepted: acceptedSubmissions },
      problemTotals,
      problemsByUser,
      submissionsByUser,
      createdContests,
      attendedContests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/debug/session', (req, res) => {
  res.json({
    session: req.session,
    user: req.user
  });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
