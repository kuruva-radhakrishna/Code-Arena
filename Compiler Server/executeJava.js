const fs = require('fs');
const path = require('path');
const { withSlot, compile, execute } = require('./sandbox');

// filePath is <jobdir>/Main.java (see generateJavaFile)
const executeJava = function (filePath, inputFilePath) {
    const jobDir = path.dirname(filePath);

    const cleanup = () => {
        fs.rm(jobDir, { recursive: true, force: true }, () => {});
        fs.rm(inputFilePath, { force: true }, () => {});
    };

    return withSlot(async () => {
        await compile(`javac -d "${jobDir}" "${filePath}"`);
        return execute(`java -Xmx256m -cp "${jobDir}" Main < "${inputFilePath}"`);
    }).finally(cleanup);
};

module.exports = executeJava;
