const fs = require('fs');
const path = require('path');
const { withSlot, compile, execute } = require('./sandbox');

const outputsPath = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputsPath)) {
    fs.mkdirSync(outputsPath, { recursive: true });
}

const executeC = function (filePath, inputFilePath) {
    const jobId = path.basename(filePath).split('.')[0];
    const outputFilePath = path.join(outputsPath, `${jobId}.exe`);

    const cleanup = () => {
        [filePath, inputFilePath, outputFilePath].forEach((file) => fs.rm(file, { force: true }, () => {}));
    };

    return withSlot(async () => {
        await compile(`gcc -O2 "${filePath}" -o "${outputFilePath}" -lm`);
        return execute(`"${outputFilePath}" < "${inputFilePath}"`);
    }).finally(cleanup);
};

module.exports = executeC;
