require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();


const { connection } = require('./Database/Connection.js');
const generateFile = require("./generateFile.js");
const executeCpp = require("./executeCpp.js");
const generateInputFile = require("./generateInputFile.js");
const executeC = require("./executeC.js");
const executePython = require("./executePython.js");
const executeJava = require("./executeJava.js");
const generateJavaFile = require("./generateJavaFile.js");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_LOCAL,
    process.env.BACKEND_URL,
    process.env.BACKEND_URL_LOCAL
].filter(Boolean);

console.log(allowedOrigins);

// Exact origins that may call this API (comma-separated FRONTEND_URL_EXTRA adds more, e.g. a Vercel preview).
// FRONTEND_PREVIEW_PATTERN is an optional regex for preview deployments, for example:
//   ^https://code-arena-.*-kuruva-radhakrishnas-projects\.vercel\.app$
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

app.get('/', (req, res) => {
    res.send('Welcome to compiler');
})

const MAX_CODE_CHARS = 200000;
const MAX_INPUT_CHARS = 2000000;

const RUNNERS = {
    c: { run: executeC, ext: 'c' },
    cpp: { run: executeCpp, ext: 'cpp' },
    python: { run: executePython, ext: 'py' },
    java: { run: executeJava },
};

// Make compiler / interpreter output readable:
//  - compile errors: the first few real error lines, with the temporary file path replaced by "Line N"
//  - anything else: the last non-empty line (for example a Python traceback's final line)
function friendlyError(type, message) {
    const lines = String(message || '').replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
    if (!lines.length) return '';
    if (type === 'compilation' || type === 'syntax') {
        const errors = lines
            .filter((l) => /\berror\b|SyntaxError|IndentationError/i.test(l))
            .map((l) => l.replace(/^.*?\.(?:c|cpp|java|py):(\d+)(?::\d+)?:\s*/, 'Line $1: '));
        if (errors.length) return errors.slice(0, 5).join('\n');
        return lines.slice(0, 5).join('\n');
    }
    return lines[lines.length - 1];
}

app.post('/run', async (req, res) => {
    const { language, code } = req.body || {};
    const input = typeof (req.body || {}).input === 'string' ? req.body.input : '';

    if (typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ errorType: 'Bad Request', error: 'Empty code', message: 'Empty code' });
    }
    if (!Object.prototype.hasOwnProperty.call(RUNNERS, language)) {
        return res.status(400).json({ errorType: 'Unsupported Language', error: `Unsupported language "${language}". Use c, cpp, python or java.` });
    }
    if (code.length > MAX_CODE_CHARS || input.length > MAX_INPUT_CHARS) {
        return res.status(413).json({ errorType: 'Bad Request', error: 'Code or input is too large.' });
    }

    try {
        const runner = RUNNERS[language];
        const filePath = language === 'java' ? generateJavaFile(code) : generateFile(runner.ext, code);
        const inputFilePath = generateInputFile(input);
        const output = await runner.run(filePath, inputFilePath);
        return res.status(200).json({ output });
    } catch (err) {
        const type = err && err.type;
        const error = friendlyError(type, err && err.message);
        if (type === 'compilation') return res.json({ errorType: 'Compilation Error', error });
        if (type === 'syntax') return res.json({ errorType: 'Compilation Error', error });
        if (type === 'runtime') return res.json({ errorType: 'Runtime Error', error });
        if (type === 'timeout') return res.json({ errorType: 'Time Limit Exceeded', error: (err && err.message) || '' });
        if (type === 'memory') return res.json({ errorType: 'Memory Limit Exceeded', error: (err && err.message) || '' });
        console.error('Unexpected compiler failure:', err);
        return res.status(500).json({ errorType: 'Internal Error', error: 'The code runner failed unexpectedly. Please try again.' });
    }
});

app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`app listening on port ${process.env.PORT}`);
});

connection();
