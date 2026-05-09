const fs = require("fs");

const createFolder = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};

module.exports = createFolder;
