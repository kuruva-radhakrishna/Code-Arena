const fs = require('fs');
const { PYTHON, withSlot, execute } = require('./sandbox');

const executePython = function (filePath, inputFilePath) {
    const cleanup = () => {
        [filePath, inputFilePath].forEach((file) => fs.rm(file, { force: true }, () => {}));
    };

    return withSlot(async () => {
        try {
            return await execute(`${PYTHON} "${filePath}" < "${inputFilePath}"`, 'python');
        } catch (err) {
            // a Python syntax error is reported on its own, like a compile error
            if (err.type === 'runtime' && /SyntaxError|IndentationError|TabError/.test(err.message || '')) {
                throw { type: 'syntax', message: err.message };
            }
            throw err;
        }
    }).finally(cleanup);
};

module.exports = executePython;
