require('dotenv').config();
const Submission = require('../Models/Submissions');
const Problem = require('../Models/Problems');
const axios = require('axios');
const { runOnCompiler } = require('../utils/judge');
const Contest = require('../Models/Contests');

const COMPILER_URL = process.env.COMPILER_URL;

exports.allSubmissionsByUser = async (req, res) => {
    //return all submissions of User

    try {
        const submissionsByUser = await Submission.find({ user_id: req.user._id }).populate('problem_id');
        if (!submissionsByUser) {
            return res.status(500).json({ message: "Database Issue" });
        }
        submissionsByUser.sort((s1, s2) => new Date(s2.submittedAt) - new Date(s1.submittedAt));

        return res.json(submissionsByUser);
    } catch (error) {
        res.status(500).json({ message: "Internal Sever Issue" });
    }
};

exports.problemSubmissionsByUSer = async (req, res) => {
    //return submissions made by the current user on the specific problem
    try {
        const id = req.params.id;
        const submissionsByUser = await Submission.find({ user_id: req.user._id, problem_id: id });
        if (!submissionsByUser) {
            return res.status(500).json({ message: "Database Issue" });
        }
        submissionsByUser.sort((s1, s2) => new Date(s2.submittedAt) - new Date(s1.submittedAt));
        console.log(submissionsByUser);
        return res.json(submissionsByUser);
    } catch (error) {
        res.status(500).json({ message: "Internal Sever Issue" });
    }
};

exports.createSubmission = async (req, res) => {
    try {
        console.log('creating new submission');
        const { problem_id, code, language } = req.body;
        const newSubmission = {
            problem_id,
            code,
            language,
            user_id: req.user._id,
        };

        const verdicts = [];
        let failedCase = null;

        const problem = await Problem.findById(problem_id);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        for (const tc of problem.TestCases) {
            const result = { data: await runOnCompiler({ code, language, input: tc.input }) };

            const output = result.data.output?.output;

            if (output !== undefined) {
                if (output.trim() === tc.output.trim()) {
                    verdicts.push('Accepted');
                } else {
                    verdicts.push('Wrong Answer');
                    failedCase = {
                        input: tc.input,
                        expected: tc.output,
                        actual: output
                    };
                    break;
                }
            } else {
                console.log(result);
                verdicts.push(result.data.errorType || 'Runtime Error');
                failedCase = {
                    input: tc.input,
                    expected: tc.output,
                    actual: result.data.output?.output || result.data.errorType || 'No Output'
                };
                break;
            }
        }

        const n = verdicts.length;
        newSubmission.verdict = verdicts[n - 1] || 'Unknown';

        const submissionResult = await Submission.create(newSubmission);

        if (submissionResult) {
            console.log('Created Submission');
            if (newSubmission.verdict === 'Accepted') {
                return res.status(200).json({verdicts});
            } else {
                return res.status(200).json({ verdicts, failedCase });
            }
        } else {
            return res.status(500).json({ message: "Issue in creating submission" });
        }

    } catch (error) {
        console.error('Error while creating submission:', error);
        if (error && error.judgeDown) {
            // the code runner is down / waking up: not the user's fault, nothing is recorded
            return res.status(503).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        const now = new Date();
        // Find all ongoing contests that include this problem
        const ongoingContests = await Contest.find({
            startTime: { $lte: now },
            endTime: { $gte: now },
            'problems.problem_id': submission.problem_id
        });

        if (ongoingContests.length > 0) {
            // If submission is for a contest, only allow if contest_id matches an ongoing contest
            if (submission.contest_id) {
                const allowed = ongoingContests.some(contest =>
                    submission.contest_id && submission.contest_id.toString() === contest._id.toString()
                );
                if (!allowed) {
                    return res.status(403).json({ message: 'You are not allowed to view this submission during the contest.' });
                }
            } else {
                // Submission is NOT for a contest, but problem is in an ongoing contest
                return res.status(403).json({ message: 'You are not allowed to view this submission during the contest.' });
            }
        }
        // If not in any ongoing contest, or allowed, show the submission
        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

