const fs = require('fs');
const path = require('path');
const { withSlot, compile, execute, memoryLimitMb } = require('./sandbox');

// filePath is <jobdir>/Main.java (see generateJavaFile)
const executeJava = function (filePath, inputFilePath) {
    const jobDir = path.dirname(filePath);

    const cleanup = () => {
        fs.rm(jobDir, { recursive: true, force: true }, () => {});
        fs.rm(inputFilePath, { force: true }, () => {});
    };

    return withSlot(async () => {
        await compile(`javac -d "${jobDir}" "${filePath}"`);
        // heap stays below the limit: the JVM adds metaspace, thread stacks and code cache on top of it
        const heapMb = Math.max(64, Math.floor(memoryLimitMb('java') * 0.75));
        return execute(`java -Xmx${heapMb}m -cp "${jobDir}" Main < "${inputFilePath}"`, 'java');
    }).finally(cleanup);
};

module.exports = executeJava;
