require('dotenv').config();
const Contest = require('../Models/Contests');
const Submission = require('../Models/Submissions');
const Problem = require('../Models/Problems');
const axios = require('axios');
const { runOnCompiler } = require('../utils/judge');

const COMPILER_URL = process.env.COMPILER_URL;

exports.getContests = async (req, res) => {
    //return all contests
    try {
        const contests = await Contest.find({});
        if (!contests) {
            return res.status(500).json({ message: "Issue in Database" });
        }
        return res.status(200).json(contests);
    } catch (error) {
        return res.status(500).json({ message: "Internal Sever Issue" });
    }

};

exports.getContestById = async (req, res) => {
    try {
        const now = new Date();
        const id = req.params.id;

        const result = await Contest.findById(id)
            .populate({
                path: 'problems.problem_id',
                select: 'problemName',
            })
            .populate({
                path: 'leaderBoard.user_id',
                select: 'firstname lastname email',
            });

        if (!result) {
            return res.status(404).json({ message: "Contest not found" });
        }

        const isCreator = req.user && result.createdBy.toString() === req.user._id.toString();

        // Only allow viewing if contest is live or ended, or user is creator
        if (!isCreator && result.startTime > now) {
            return res.status(400).json({ message: "The contest is not live yet" });
        }

        // Sort problems by points (ascending)
        result.problems.sort((a, b) => a.points - b.points);

        // Add totalPoints to each leaderboard entry
        const leaderboard = result.leaderBoard.map(entry => ({
            ...entry._doc,
            totalPoints: (entry.points || []).reduce((sum, p) => sum + p, 0),
        }));

        // Sort leaderboard: totalPoints descending, then earliest lastSubmission
        leaderboard.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (!a.lastSubmission) return 1;
            if (!b.lastSubmission) return -1;
            return new Date(a.lastSubmission) - new Date(b.lastSubmission);
        });

        // Replace original leaderboard
        result.leaderBoard = leaderboard;

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.contestSubmission = async (req, res) => {
    try {
        const { contest_id, problem_id } = req.params;
        const { code, language } = req.body.submission;
        const userId = req.user._id;
        const now = new Date();
        // Create the submission object
        const newSubmission = {
            user_id: userId,
            problem_id,
            contest_id,
            code,
            language,
            isInContest: true,
        };

        // Validate contest and problem existence
        const contest = await Contest.findById(contest_id);
        const problem = await Problem.findById(problem_id);
        if (!contest || !problem) {
            return res.status(400).json({ message: "Contest or problem doesn't exist" });
        }

        // Validate contest timing
        if (now < contest.startTime || now > contest.endTime) {
            return res.status(403).json({ message: "Contest is not active" });
        }

        // Identify problem index in contest
        const problemIndex = contest.problems.findIndex(
            p => p.problem_id.toString() === problem_id.toString()
        );
        if (problemIndex === -1) {
            return res.status(400).json({ message: "Problem is not part of this contest" });
        }

        const problemEntry = contest.problems[problemIndex];

        // Run test cases
        const verdicts = [];
        for (const tc of problem.TestCases) {
            const result = { data: await runOnCompiler({ code, language, input: tc.input }) };

            const output = result.data.output?.output;
            if (output !== undefined) {

                if (output.trim() === tc.output.trim()) {
                    
                    verdicts.push('Accepted');
                } else {
                    verdicts.push('Wrong Answer');
                    break;
                }
            } else {
                verdicts.push(result.data.errorType || 'Runtime Error');
                break;
            }
        }

        const verdict = verdicts[verdicts.length - 1] || 'Unknown';
        newSubmission.verdict = verdict;

        // Save the submission
        const savedSubmission = await Submission.create(newSubmission);
        if (!savedSubmission) {
            return res.status(500).json({ message: "Unable to upload submission" });
        }

        // Find leaderboard entry for the user
        const userIdStr = userId.toString();
        const userEntry = contest.leaderBoard.find(entry => entry.user_id.toString() === userIdStr);

        // CASE 1: User is not in leaderboard yet
        if (!userEntry) {
            const submissionsArray = contest.problems.map(() => []);
            const pointsArray = contest.problems.map(() => 0);

            // Add this submission to correct problem index
            submissionsArray[problemIndex].push(savedSubmission);

            // If Accepted, award points
            if (verdict === 'Accepted') {
                pointsArray[problemIndex] = problemEntry.points;
            }

            await Contest.findByIdAndUpdate(contest_id, {
                $push: {
                    leaderBoard: {
                        user_id: userId,
                        submissions: submissionsArray,
                        points: pointsArray,
                        lastSubmission: now
                    }
                }
            });
        }

        // CASE 2: User already has a leaderboard entry
        else {
            const userLBIndex = contest.leaderBoard.findIndex(
                entry => entry.user_id.toString() === userIdStr
            );

            // Clone current arrays
            const updatedPoints = [...contest.leaderBoard[userLBIndex].points];
            const updatedSubmissions = [...contest.leaderBoard[userLBIndex].submissions];

            // Ensure the problem index exists
            if (!Array.isArray(updatedSubmissions[problemIndex])) {
                updatedSubmissions[problemIndex] = [];
            }

            // Push current submission
            updatedSubmissions[problemIndex].push(savedSubmission);

            // If first AC, give points
            if (verdict === 'Accepted' && updatedPoints[problemIndex] === 0) {
                updatedPoints[problemIndex] = problemEntry.points;
            }

            // Update leaderboard entry safely
            await Contest.updateOne(
                {
                    _id: contest_id,
                    "leaderBoard.user_id": userId
                },
                {
                    $set: {
                        "leaderBoard.$.submissions": updatedSubmissions,
                        "leaderBoard.$.points": updatedPoints,
                        "leaderBoard.$.lastSubmission": now
                    }
                }
            );
        }

        // Final response
        return res.status(200).json(verdicts);
    } catch (error) {
        console.error(error);
        if (error && error.judgeDown) {
            // the code runner is down / waking up: not the user's fault, nothing is recorded
            return res.status(503).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


exports.getLeaderBoard = async (req, res) => {
    try {
        const { id } = req.params;

        const contest = await Contest.findById(id)
            .populate({
                path: 'leaderBoard.user_id',
                select: 'firstname lastname email',
            });

        if (!contest) {
            return res.status(400).json({ message: "This contest doesn't exist" });
        }

        const problemCount = contest.problems.length;

        // Transform leaderboard entries
        const transformed = contest.leaderBoard.map(entry => {
            const totalPoints = (entry.points || []).reduce((sum, val) => sum + val, 0);

            // For each problem, get submissions and find last accepted
            const problemSubmissions = contest.problems.map((_, index) => {
                const subs = (entry.submissions && entry.submissions[index]) || [];
                const lastAccepted = [...subs].reverse().find(s => s.verdict === 'Accepted');
                return lastAccepted || null;
            });

            // Get the latest timestamp from all accepted submissions
            let lastSubmissionTime = null;
            for (const subList of entry.submissions || []) {
                for (let i = subList.length - 1; i >= 0; i--) {
                    if (subList[i].verdict === 'Accepted') {
                        if (!lastSubmissionTime || new Date(subList[i].submittedAt) > new Date(lastSubmissionTime)) {
                            lastSubmissionTime = subList[i].submittedAt;
                        }
                    }
                }
            }

            return {
                user: entry.user_id,
                totalPoints,
                submissions: problemSubmissions,
                lastSubmission: lastSubmissionTime,
            };
        });

        // Sort leaderboard by total points desc, then by earliest last submission
        const sorted = transformed.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (!a.lastSubmission) return 1;
            if (!b.lastSubmission) return -1;
            return new Date(a.lastSubmission) - new Date(b.lastSubmission);
        });

        // Add rank (1-based)
        const ranked = sorted.map((entry, index) => ({
            rank: index + 1,
            user: entry.user,
            totalPoints: entry.totalPoints,
            lastSubmission: entry.lastSubmission,
            problems: entry.submissions, // Q1 to Qn (latest AC or null)
        }));

        res.status(200).json(ranked);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

