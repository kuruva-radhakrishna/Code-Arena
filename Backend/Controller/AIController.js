const Problem = require('../Models/Problems');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.Gemini_api });

exports.generateProblem = async (req, res) => {
    try {
        // Example: expects req.body.prompt
        const { prompt } = req.body;
        // Placeholder for AI logic
        // const aiResult = await someAILibrary.generateProblem(prompt);
        // For now, just echo prompt
        res.json({ message: 'AI generated problem', prompt });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate problem' });
    }
};

exports.reviewCode = async (req, res) => {
    try {
        const { code, problemId } = req.body;
        const prob = await Problem.findById(problemId);

        const prompt = `
            You are a senior software engineer reviewing code submitted for a coding problem.

            ---
            Problem Description:
            ${prob.problemDescription}

            Submitted Code:
            ${code}

            Review Instructions:
            1. Identify logical correctness and whether it solves the problem.
            2. Point out potential edge cases it might fail.
            3. Comment on code readability and structure.
            4. Evaluate performance (time/space complexity).
            5. Suggest improvements (best practices, optimizations, naming, etc.).
            6. Mention if the code is good enough to be accepted or needs fixes.

            Respond in this format:
            - Summary (2-3 lines)
            - Issues Found (if any)
            - Suggestions
            - Overall Verdict (Accept / Needs Fixes)
            -Your review will be displayed using react markdown reply accordingly`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        res.json({ review: response.text });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Issue" });
    }
};


exports.createProblemAI = async (req, res) => {
    try {
        const { problem } = req.body;
        const allowedTopics = [
            "array", "string", "hash table", "dynamic programming", "math", "sorting", "greedy", "tree", "graph", "binary search", "recursion", "backtracking", "stack", "queue", "heap", "linked list", "sliding window", "two pointers", "bit manipulation", "number theory", "geometry", "database", "shell", "javascript", "concurrency", "depth-first search", "breadth-first search", "trie", "segment tree", "disjoint set", "topological sort", "shortest path", "minimum spanning tree", "game theory", "probability", "combinatorics", "implementation", "simulation", "other"
        ];
        const allowedDifficulties = ["easy", "medium", "hard"];
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Assume you are a problem setter.\nCover all edge cases regarding testcases. Ensure the problem is well explained.\nFor all sample inputs and test cases, if the input includes an array, print the array elements on a single line, space-separated, after the array size. For example:\n6\n1 2 3 4 6 7\n13\nDo not print each array element on a separate line. Use the exact input format as described in the problem statement.\nWhen setting the 'topics' field, only use topics from this list: ${allowedTopics.join(", ")}.\nFor the 'difficulty' field, only use one of: ${allowedDifficulties.join(", ")}.\nDo NOT use 'difficult' as a difficulty.\nComplete the problem object: ${JSON.stringify(problem)}. \nGive response in json format.`,
        });
        let review = response.text || '';
        review = review.trim();
        if (review.startsWith('```json')) {
            review = review.slice(7);
        } else if (review.startsWith('```')) {
            review = review.slice(3);
        }
        if (review.endsWith('```')) {
            review = review.slice(0, -3);
        }
        review = review.trim();
        const match = review.match(/\{[\s\S]*\}/);
        if (match) {
            review = match[0];
        }
        let problemObj = null;
        try {
            const parsed = JSON.parse(review);
            problemObj = parsed.problem || parsed;
        } catch (err) {
            return res.status(500).json({ message: "AI did not return valid JSON.", raw: review });
        }
        if (!problemObj) {
            return res.status(500).json({ message: "AI did not return a valid problem object.", raw: review });
        }
        res.json({ problem: problemObj });
    } catch (error) {
        res.status(500).json({ message: "Error creating AI response" });
    }
};

exports.debugCode = async (req, res) => {
    try {
        const { code } = req.body;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a senior software engineer assisting in debugging user-submitted code.
            Instructions:
            - Identify and explain any bugs, logical errors, or edge case failures.
            - Point out any common runtime or syntax issues.
            - Suggest fixes or improvements if necessary.
            - Avoid restating the problem statement or describing what the code is trying to do unless needed to explain a bug.
            - Keep your response concise (4-6 sentences max) and focused only on debugging.

            User Code:
            ${code}`
        });
        res.json({ debug: response.text });
    } catch (error) {
        res.status(500).json({ message: "Server Issue" });
    }
};

exports.generateContestDescription = async (req, res) => {
    try {
        const { contestTitle, problems } = req.body;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert contest setter. Given the contest title and a list of problem IDs or names, generate a concise, engaging contest description for participants. Do not list the problems, but describe the contest's theme, challenge, and what participants can expect.\n\nContest Title: ${contestTitle}\nProblems: ${problems.join(', ')}`,
        });
        res.json({ description: response.text });
    } catch (error) {
        res.status(500).json({ message: "AI contest description generation failed" });
    }
};

const GENERAL_CHAT_PROMPT = `You are the programming assistant of an online judge (CodeArena). You help with data structures and algorithms, competitive programming, interview preparation, debugging, language questions (C++, Java, Python) and general software engineering.

How to answer:
- Lead with the direct answer in the first sentence, then add detail only if it helps. No greetings, no filler, no restating the question.
- Keep it short: usually under 120 words. Go longer only when the user asks for depth or code.
- Structure for scanning: short paragraphs, bullet lists for steps or options, **bold** for key terms. Use a numbered list for step-by-step procedures.
- Put code in fenced markdown code blocks with a language tag (cpp, python or java). Use inline code for identifiers and complexities such as O(n log n).
- For algorithm questions give: the idea in one line, the steps, then time and space complexity.
- When the user pastes code, point to the specific line or idea that is wrong and why, then show the minimal fix instead of rewriting everything.
- If a question is ambiguous, answer the most likely reading and say what you assumed. If you are not sure, say so - never invent facts, APIs or test results.
- Stay on programming and computer science; politely redirect anything else in one sentence.`;

exports.chat = async (req, res) => {
    try {
        const { message, chatHistory } = req.body || {};
        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ message: 'A message is required.' });
        }

        // The client sends the whole history including the message it is asking about;
        // drop that last entry (we append `message` ourselves) and keep the most recent turns.
        let history = (Array.isArray(chatHistory) ? chatHistory : [])
            .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'));
        if (history.length && history[history.length - 1].role === 'user' && history[history.length - 1].content === message) {
            history = history.slice(0, -1);
        }
        const turns = history.slice(-12).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content.slice(0, 4000) }],
        }));
        turns.push({ role: 'user', parts: [{ text: message.trim().slice(0, 4000) }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: turns,
            config: {
                systemInstruction: GENERAL_CHAT_PROMPT,
                temperature: 0.4,
                maxOutputTokens: 1200,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        res.json({ response: response.text || "I couldn't come up with a reply - try rephrasing your question." });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ message: 'AI chat failed. Please try again.' });
    }
};

// ---------------------------------------------------------------------------
// Problem-specific tutor chat. Unlike /ai/chat, the server loads the problem
// itself (the client only sends an id) so the model always has real context,
// and it refuses while the problem is part of a running contest.
// ---------------------------------------------------------------------------
const Contest = require('../Models/Contests');

const MAX_MESSAGE_CHARS = 2000;
const MAX_CODE_CHARS = 8000;
const MAX_HISTORY_TURNS = 12;

function buildProblemTutorPrompt(problem, code, language) {
    const samples = (problem.TestCases || [])
        .filter((t) => t.isPublic !== false)
        .slice(0, 2)
        .map((t, i) => `Example ${i + 1}\nInput:\n${t.input}\nOutput:\n${t.output}`)
        .join('\n\n');

    let prompt = `You are the AI tutor inside an online judge, discussing ONE specific problem with a student who is trying to solve it.

# The problem
Title: ${problem.problemName}
Difficulty: ${problem.difficulty}
Topics: ${(problem.topics || []).join(', ') || 'n/a'}

${problem.problemDescription}

Constraints:
${(problem.Constraints || []).map((c) => `- ${c}`).join('\n') || '- n/a'}

${samples}
`;

    if ((problem.hints || []).length) {
        prompt += `\n# Author hints (reveal progressively, never all at once)\n${problem.hints.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`;
    }
    if (code && code.trim()) {
        prompt += `\n# The student's current code (${language || 'unknown language'})\n\`\`\`\n${code}\n\`\`\`\n`;
    }

    prompt += `
# How to behave
- Stay on this problem. If asked about something unrelated, briefly steer back.
- Teach, don't hand over answers. Default to a ladder: clarify the problem -> nudge toward the key observation -> name the technique -> outline the approach -> complexity. Move down the ladder only as far as the student needs.
- Do NOT write a full working solution unless the student explicitly asks for the solution or says they are stuck after hints. Even then, explain the idea first and keep code minimal and in the student's language.
- When the student's code is provided, point at the specific line/idea that is wrong and why, rather than rewriting everything.
- Be concise (usually under 150 words). Use markdown; put code in fenced blocks and use inline code for identifiers and complexities.
- Never invent test results. If you are unsure whether something is correct, say so.`;
    return prompt;
}

exports.problemChat = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Please log in to use the AI tutor.' });

        const { problemId, message, history, code, language } = req.body || {};
        if (!problemId || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ message: 'problemId and message are required.' });
        }
        if (message.length > MAX_MESSAGE_CHARS) {
            return res.status(400).json({ message: `Message is too long (max ${MAX_MESSAGE_CHARS} characters).` });
        }

        const problem = await Problem.findById(problemId).lean();
        if (!problem) return res.status(404).json({ message: 'Problem not found.' });

        const now = new Date();
        const liveContest = await Contest.findOne({
            startTime: { $lte: now },
            endTime: { $gte: now },
            'problems.problem_id': problem._id,
        }).select('_id');
        if (liveContest) {
            return res.status(403).json({ message: 'The AI tutor is disabled for problems that are part of a running contest.' });
        }

        const turns = (Array.isArray(history) ? history : [])
            .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
            .slice(-MAX_HISTORY_TURNS)
            .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content.slice(0, MAX_MESSAGE_CHARS * 2) }],
            }));
        turns.push({ role: 'user', parts: [{ text: message.trim() }] });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: turns,
            config: {
                systemInstruction: buildProblemTutorPrompt(problem, typeof code === 'string' ? code.slice(0, MAX_CODE_CHARS) : '', language),
                temperature: 0.5,
                maxOutputTokens: 1024,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        res.json({ response: response.text || "I couldn't come up with a reply - try rephrasing your question." });
    } catch (error) {
        console.error('Problem chat error:', error);
        res.status(500).json({ message: 'AI tutor failed. Please try again.' });
    }
};
