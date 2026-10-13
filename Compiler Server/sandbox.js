// Shared process runner for every language.
//
// - Compile and run steps have time limits, so an infinite loop ends in "Time Limit Exceeded"
//   instead of hanging the request (and the submission) forever.
// - Runs have a memory limit. The program's real memory use (peak resident set, read from
//   /proc on Linux) is watched while it runs; going over the limit ends it with
//   "Memory Limit Exceeded". As a second line of defence C/C++/Python also get a virtual
//   address-space cap (ulimit -v), and the out-of-memory failures each language reports are
//   recognised too (std::bad_alloc, MemoryError, OutOfMemoryError, the kernel OOM killer).
// - stdout/stderr are capped so a program printing endlessly cannot exhaust memory.
// - Only a few jobs run at once; the rest wait in a queue, so a burst of submissions
//   does not run a small (free tier) server out of memory.
const fs = require('fs');
const { exec, execSync } = require('child_process');

const LIMITS = {
    compileMs: Number(process.env.COMPILE_TIME_LIMIT_MS) || 20000,
    maxBuffer: 10 * 1024 * 1024,
    maxConcurrent: Number(process.env.MAX_CONCURRENT_JOBS) || 2,
};

// Per-test time limit (wall clock). Typical judges allow about 1-2 s; the slower languages get
// more room, and a shared free-tier CPU needs some headroom to avoid false "Time Limit Exceeded".
// Override one language with RUN_TIME_LIMIT_<LANG>_MS (e.g. RUN_TIME_LIMIT_PYTHON_MS=6000), or all
// of them with RUN_TIME_LIMIT_MS.
const DEFAULT_RUN_MS = { c: 2000, cpp: 2000, java: 4000, python: 4000 };
function runLimitMs(language) {
    const specific = Number(process.env[`RUN_TIME_LIMIT_${String(language).toUpperCase()}_MS`]);
    if (specific > 0) return specific;
    const all = Number(process.env.RUN_TIME_LIMIT_MS);
    if (all > 0) return all;
    return DEFAULT_RUN_MS[language] || 4000;
}

// Per-test memory limit in MB (peak resident memory). The JVM itself needs a lot more than a
// native program, so Java gets a bigger allowance. Override with MEMORY_LIMIT_<LANG>_MB or
// MEMORY_LIMIT_MB.
const DEFAULT_MEMORY_MB = { c: 256, cpp: 256, python: 256, java: 512 };
function memoryLimitMb(language) {
    const specific = Number(process.env[`MEMORY_LIMIT_${String(language).toUpperCase()}_MB`]);
    if (specific > 0) return specific;
    const all = Number(process.env.MEMORY_LIMIT_MB);
    if (all > 0) return all;
    return DEFAULT_MEMORY_MB[language] || 256;
}

// Debian images ship "python3" (and often "python"); Alpine only has "python3".
const PYTHON = (() => {
    try { execSync('python3 --version', { stdio: 'ignore' }); return 'python3'; } catch { return 'python'; }
})();

// Messages programs print when they run out of memory.
const OUT_OF_MEMORY = /std::bad_alloc|bad_alloc|MemoryError|OutOfMemoryError|Cannot allocate memory|out of memory|memory exhausted/i;

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

/** Peak resident memory in kB from the text of /proc/<pid>/status, or null. */
function parsePeakKb(statusText) {
    const hwm = /VmHWM:\s+(\d+)\s+kB/.exec(statusText || '');
    if (hwm) return Number(hwm[1]);
    const rss = /VmRSS:\s+(\d+)\s+kB/.exec(statusText || '');
    return rss ? Number(rss[1]) : null;
}

// Default memory sampler: Linux only. Elsewhere there is nothing to read and the check is skipped.
function sampleFromProc(pid) {
    return new Promise((resolve) => {
        fs.readFile(`/proc/${pid}/status`, 'utf8', (err, text) => resolve(err ? null : parsePeakKb(text)));
    });
}

/**
 * Runs a shell command with a time limit and (optionally) a memory limit.
 * Never rejects; inspect the returned flags. `sampleKb` is injectable for tests.
 */
function run(command, timeoutMs, { memoryLimitKb = 0, sampleKb = sampleFromProc } = {}) {
    return new Promise((resolve) => {
        let peakKb = 0;
        let memoryExceeded = false;
        let monitor = null;
        let finished = false;

        const child = exec(command, { timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: LIMITS.maxBuffer }, (error, stdout, stderr) => {
            finished = true;
            if (monitor) clearInterval(monitor);
            resolve({
                error,
                stdout,
                stderr,
                peakKb,
                memoryExceeded,
                tooMuchOutput: !!(error && error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'),
                timedOut: !memoryExceeded && !!(error && error.killed && error.code !== 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'),
            });
        });

        if (memoryLimitKb > 0 || sampleKb !== sampleFromProc) {
            let sampling = false;
            monitor = setInterval(async () => {
                if (finished || sampling || !child.pid) return;
                sampling = true;
                const kb = await sampleKb(child.pid);
                sampling = false;
                if (kb && kb > peakKb) peakKb = kb;
                if (!finished && memoryLimitKb > 0 && peakKb > memoryLimitKb) {
                    memoryExceeded = true;
                    child.kill('SIGKILL');
                }
            }, 15);
        }
    });
}

/** Compile step: resolves on success, rejects with a typed error otherwise. */
async function compile(command) {
    const r = await run(command, LIMITS.compileMs);
    if (r.timedOut) throw { type: 'timeout', message: 'Compilation took too long.' };
    if (r.error) throw { type: 'compilation', message: r.stderr || r.error.message };
}

/**
 * Run step. "exec" makes the shell replace itself with the program, so the kill on a time or
 * memory limit hits the program itself and not just the wrapping shell.
 * `options.virtualMemory` adds an address-space cap (ulimit -v) for native programs and Python.
 */
async function execute(command, language, options = {}) {
    const limitMs = runLimitMs(language);
    const limitMb = memoryLimitMb(language);
    const ulimit = options.virtualMemory ? `ulimit -v ${Math.round(limitMb * 2 * 1024)} 2>/dev/null; ` : '';

    const start = process.hrtime();
    const r = await run(`${ulimit}exec ${command}`, limitMs, { memoryLimitKb: limitMb * 1024, sampleKb: options.sampleKb });
    const diff = process.hrtime(start);
    const timeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

    if (r.tooMuchOutput) throw { type: 'runtime', message: 'Output limit exceeded.' };
    if (r.memoryExceeded) throw { type: 'memory', message: `Memory limit exceeded (${limitMb} MB).` };
    if (r.timedOut) throw { type: 'timeout', message: `Time limit exceeded (${limitMs / 1000}s).` };
    if (r.error) {
        // killed from outside (the kernel's out-of-memory killer) or an out-of-memory failure of the language
        const oomKilled = r.error.signal === 'SIGKILL';
        if (oomKilled || OUT_OF_MEMORY.test(r.stderr || '')) {
            throw { type: 'memory', message: `Memory limit exceeded (${limitMb} MB).` };
        }
        throw { type: 'runtime', message: r.stderr || 'The program crashed or exited with an error.' };
    }
    return { output: r.stdout, timeMs, memoryKb: r.peakKb || null };
}

module.exports = { LIMITS, PYTHON, withSlot, compile, execute, runLimitMs, memoryLimitMb, parsePeakKb, run };
