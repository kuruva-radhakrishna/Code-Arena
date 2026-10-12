const Problem = require('../Models/Problems.js');
const Contest = require('../Models/Contests.js');

exports.getAllProblems = async (req, res) => {
    try {
        const allProblems = await Problem.find({}).lean();
        res.json(allProblems);
    } catch (error) {
        console.error('Error in /problems/all:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getAvailableProblems = async (req, res) => {
    try {
        const now = new Date();
        const activeContests = await Contest.find({
            startTime: { $lte: now },
            endTime: { $gte: now },
        });
        const activeProblems = new Set();
        for (const contest of activeContests) {
            contest.problems.forEach(problem => {
                activeProblems.add(problem.problem_id.toString());
            });
        }
        const allProblems = await Problem.find({}).lean();
        const availableProblems = allProblems.filter(
            problem => !activeProblems.has(problem._id.toString())
        );
        res.json(availableProblems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getProblemById = async (req, res) => {
    try {
        const id = req.params.id;
        const problem = await Problem.findById(id);
        if (!problem) {
            return res.status(500).json({ message: "The problem You are search for is not present" });
        }
        // Hidden test cases (isPublic: false) must not reach regular users; admins need them for editing.
        const body = problem.toObject();
        if (!req.user || req.user.role !== 'admin') {
            body.TestCases = (body.TestCases || []).filter((t) => t.isPublic !== false);
        }
        res.status(200).json(body);
    } catch (error) {
        return res.status(500).json({ message: "Internal Serve Issue" });
    }
};

exports.getProblemDiscussions = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id).populate('Discussions.user', 'firstname lastname email');
        if (!problem) return res.status(404).json({ error: 'Problem not found.' });
        res.json(problem.Discussions || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch discussions.' });
    }
};

exports.addProblemDiscussion = async (req, res) => {
    try {
        const { comment } = req.body;
        if (!comment) return res.status(400).json({ error: 'Comment is required.' });
        const problem = await Problem.findById(req.params.id);
        if (!problem) return res.status(404).json({ error: 'Problem not found.' });
        const newDiscussion = {
            user: req.user._id,
            comment,
            likes: 0,
            dislikes: 0
        };
        problem.Discussions.unshift(newDiscussion);
        await problem.save();
        await problem.populate('Discussions.user', 'firstname lastname email');
        res.status(201).json(problem.Discussions[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add discussion.' });
    }
}; 