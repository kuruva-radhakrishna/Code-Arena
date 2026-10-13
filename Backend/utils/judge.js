// Calls the code-runner (Compiler Server) for one test case.
//
// Problems with the code runner are not the user's fault, so they must not be recorded as a
// wrong verdict. This helper:
//   - times out after 60 s instead of waiting forever
//   - retries once after 4 s when the runner is waking up from idle (a network error / 502 / 503 / 504)
//   - throws a JudgeUnavailable error (error.judgeDown === true) when it still cannot get an answer
// A 4xx answer from the runner (for example an unsupported language) is returned as data.
const axios = require('axios');

const TIMEOUT_MS = 60000;
const RETRY_DELAY_MS = Number(process.env.JUDGE_RETRY_DELAY_MS) || 4000;
const RETRY_STATUSES = new Set([502, 503, 504]);
const RETRY_CODES = new Set(['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']);

class JudgeUnavailable extends Error {
    constructor(message) {
        super(message);
        this.judgeDown = true;
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runOnCompiler({ code, language, input }, attempt = 0) {
    const url = process.env.COMPILER_URL;
    try {
        const res = await axios.post(`${url}/run`, { code, language, input }, { timeout: TIMEOUT_MS });
        return res.data;
    } catch (err) {
        const status = err.response && err.response.status;
        if (status && status >= 400 && status < 500 && err.response.data) return err.response.data;

        const retryable = !status || RETRY_STATUSES.has(status) || RETRY_CODES.has(err.code);
        if (retryable && attempt < 1) {
            await sleep(RETRY_DELAY_MS);
            return runOnCompiler({ code, language, input }, attempt + 1);
        }
        console.error(`Code runner unavailable (${url || 'COMPILER_URL not set'}): ${status || err.code || err.message}`);
        throw new JudgeUnavailable('The code runner is not responding right now. If it was idle it may be waking up, so please try again in a minute.');
    }
}

module.exports = { runOnCompiler, JudgeUnavailable };
