const fs = require("fs");
const os = require("os");
const path = require("path");

const clientDefaultWorldPath = `C:\\Users\\${
  os.userInfo().username
}\\AppData\\Local\\Pal\\Saved\\SaveGames`;
const serverDefaultWorldPath = `C:\\Program Files (x86)\\Steam\\steamapps\\common\\PalServer\\Pal\\Saved\\SaveGames\\0`;

function listFiles(directoryPath, callback) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, files);
    }
  });
}

function readFile(filePath, callback) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
}

function checkServerWorldFolders(callback) {
  fs.readdir(
    serverDefaultWorldPath,
    { withFileTypes: true },
    (err, entries) => {
      if (err) {
        return callback(err);
      }
      const worldFolders = entries
        .filter((entry) => entry.isDirectory())
        .map((folder) => folder.name);
      callback(null, worldFolders);
    }
  );
}

function doesServerDirectoryExist(callback) {
  fs.stat(serverDefaultWorldPath, (err, stats) => {
    if (err) {
      if (err.code === "ENOENT") {
        callback(null, false);
      } else {
        callback(err, null);
      }
    } else {
      callback(null, stats.isDirectory());
    }
  });
}

function isSteamIdFolder(folderName) {
  return /^\d{17}$/.test(folderName); // Steam ID has 17 digits
}

function checkClientWorldFolders(callback) {
  fs.readdir(
    clientDefaultWorldPath,
    { withFileTypes: true },
    (err, entries) => {
      if (err) {
        return callback(err);
      }

      const steamIdDir = entries.find(
        (entry) => entry.isDirectory() && isSteamIdFolder(entry.name)
      );
      if (!steamIdDir) {
        return callback(new Error("No Steam ID directory found"));
      }

      const steamIdPath = path.join(clientDefaultWorldPath, steamIdDir.name);
      fs.readdir(steamIdPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          return callback(err);
        }

        const worldFolders = files
          .filter((file) => file.isDirectory())
          .map((folder) => folder.name);
        callback(null, worldFolders);
      });
    }
  );
}

function doesClientDirectoryExist(callback) {
  fs.stat(clientDefaultWorldPath, (err, stats) => {
    if (err) {
      if (err.code === "ENOENT") {
        callback(null, false);
      } else {
        callback(err, null);
      }
    } else {
      callback(null, stats.isDirectory());
    }
  });
}

module.exports = {
  clientDefaultWorldPath,
  serverDefaultWorldPath,
  listFiles,
  readFile,
  checkServerWorldFolders,
  doesServerDirectoryExist,
  checkClientWorldFolders,
  doesClientDirectoryExist,
};
