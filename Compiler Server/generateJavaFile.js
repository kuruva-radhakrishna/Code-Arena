const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const codesDir = path.join(__dirname, 'codes');
if (!fs.existsSync(codesDir)) {
    fs.mkdirSync(codesDir, { recursive: true });
}

// Every Java job gets its own folder containing Main.java, so the public class can keep the
// name Main (java requires the file name to match) without any renaming of the user's code.
const generateJavaFile = (code) => {
    const dir = path.join(codesDir, uuid());
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, 'Main.java');
    fs.writeFileSync(filePath, code);
    return filePath;
};

module.exports = generateJavaFile;
