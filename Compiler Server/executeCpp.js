const fs = require('fs');
const path = require('path');
const { withSlot, compile, execute } = require('./sandbox');

const outputsPath = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputsPath)) {
    fs.mkdirSync(outputsPath, { recursive: true });
}

const executeCpp = function (filePath, inputFilePath) {
    const jobId = path.basename(filePath).split('.')[0];
    const outputFilePath = path.join(outputsPath, `${jobId}.exe`);

    // delete the temporary files whatever happens
    const cleanup = () => {
        [filePath, inputFilePath, outputFilePath].forEach((file) => fs.rm(file, { force: true }, () => {}));
    };

    return withSlot(async () => {
        await compile(`g++ -O2 "${filePath}" -o "${outputFilePath}"`);
        return execute(`"${outputFilePath}" < "${inputFilePath}"`, 'cpp', { virtualMemory: true });
    }).finally(cleanup);
};

module.exports = executeCpp;
