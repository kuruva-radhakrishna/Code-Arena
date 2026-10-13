// Shared process runner for every language.
//
// - Compile and run steps have time limits, so an infinite loop ends in "Time Limit Exceeded"
//   instead of hanging the request (and the submission) forever.
// - stdout/stderr are capped so a program printing endlessly cannot exhaust memory.
// - Only a few jobs run at once; the rest wait in a queue, so a burst of submissions
//   does not run a small (free tier) server out of memory.
const { exec, execSync } = require('child_process');

const LIMITS = {
    compileMs: Number(process.env.COMPILE_TIME_LIMIT_MS) || 20000,
    runMs: Number(process.env.RUN_TIME_LIMIT_MS) || 10000,
    maxBuffer: 10 * 1024 * 1024,
    maxConcurrent: Number(process.env.MAX_CONCURRENT_JOBS) || 2,
};

// Debian images ship "python3" (and often "python"); Alpine only has "python3".
const PYTHON = (() => {
    try { execSync('python3 --version', { stdio: 'ignore' }); return 'python3'; } catch { return 'python'; }
})();

let active = 0;
const waiting = [];
function acquire() {
    return new Promise((resolve) => {
        const start = () => {
            active++;
            resolve(() => {
                active--;
                const next = waiting.shift();
                if (next) next();
            });
        };
        if (active < LIMITS.maxConcurrent) start(); else waiting.push(start);
    });
}

/** Runs fn while holding one of the concurrency slots. */
async function withSlot(fn) {
    const release = await acquire();
    try { return await fn(); } finally { release(); }
}

/** Runs a shell command with a time limit. Never rejects; inspect the returned flags. */
function run(command, timeoutMs) {
    return new Promise((resolve) => {
        exec(command, { timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: LIMITS.maxBuffer }, (error, stdout, stderr) => {
            resolve({
                error,
                stdout,
                stderr,
                tooMuchOutput: !!(error && error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'),
                timedOut: !!(error && error.killed && error.code !== 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'),
            });
        });
    });
}

/** Compile step: resolves on success, rejects with a typed error otherwise. */
async function compile(command) {
    const r = await run(command, LIMITS.compileMs);
    if (r.timedOut) throw { type: 'timeout', message: 'Compilation took too long.' };
    if (r.error) throw { type: 'compilation', message: r.stderr || r.error.message };
}

/**
 * Run step. "exec" makes the shell replace itself with the program, so the time-limit kill
 * hits the program itself and not just the wrapping shell.
 */
async function execute(command) {
    const start = process.hrtime();
    const r = await run(`exec ${command}`, LIMITS.runMs);
    const diff = process.hrtime(start);
    const timeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
    if (r.tooMuchOutput) throw { type: 'runtime', message: 'Output limit exceeded.' };
    if (r.timedOut) throw { type: 'timeout', message: `Time limit exceeded (${LIMITS.runMs / 1000}s).` };
    if (r.error) throw { type: 'runtime', message: r.stderr || 'The program crashed or exited with an error.' };
    return { output: r.stdout, timeMs };
}

module.exports = { LIMITS, PYTHON, withSlot, compile, execute };
