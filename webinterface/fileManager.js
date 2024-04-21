const originalFs = require("fs");
const fs = originalFs.promises;
const { get } = require("http");
const os = require("os");
const path = require("path");

const clientDefaultWorldPath = `C:\\Users\\${
  os.userInfo().username
}\\AppData\\Local\\Pal\\Saved\\SaveGames\\76561198044441945`;
const serverDefaultWorldPath = `C:\\Program Files (x86)\\Steam\\steamapps\\common\\PalServer\\Pal\\Saved\\SaveGames\\0`;
let clientWorldPath;
let serverWorldPath;
function setClientWorldPath(newPath) {
  clientWorldPath = newPath;
}

function setServerWorldPath(newPath) {
  serverWorldPath = newPath;
}

function listFiles(directoryPath, callback) {
  originalFs.readdir(directoryPath, (err, files) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, files);
    }
  });
}

function readFile(filePath, callback) {
  originalFs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
}

function checkServerWorldFolders(callback) {
  //if serverWorldPath is not set, set it to the default path
  if (!serverWorldPath) {
    serverWorldPath = serverDefaultWorldPath;
  }

  originalFs.readdir(
    serverWorldPath,
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
  if (!serverWorldPath) {
    serverWorldPath = serverDefaultWorldPath;
  }
  originalFs.stat(serverWorldPath, (err, stats) => {
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

async function isSteamIdFolder(folderName) {
  // Add logic to check if the folder name matches a Steam ID pattern
  return /^\d{17}$/.test(folderName); // Example pattern: Steam ID is usually a 17-digit number
}

function checkClientWorldFolders(callback) {
  if (!clientWorldPath) {
    clientWorldPath = clientDefaultWorldPath;
  }
  originalFs.readdir(
    clientWorldPath,
    { withFileTypes: true },
    (err, entries) => {
      if (err) {
        return callback(err);
      }

      const steamIdDir = entries.find(
        (entry) => entry.isDirectory() && isSteamIdFolder(entry.name)
      );
      if (!steamIdDir) {
        return callback(
          { customError: "NoSteamID", message: "No Steam ID directory found" },
          false
        );
      }

      const steamIdPath = path.join(clientWorldPath, steamIdDir.name);
      originalFs.readdir(steamIdPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          return callback(err, false);
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
  if (!clientWorldPath) {
    clientWorldPath = clientDefaultWorldPath;
  }
  originalFs.stat(clientWorldPath, (err, stats) => {
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

async function getClientDirectorySaveFolders() {
  if (!clientWorldPath) {
    clientWorldPath = clientDefaultWorldPath;
  }

  try {
    const entries = await originalFs.promises.readdir(clientWorldPath, {
      withFileTypes: true,
    });
    const folders = entries
      .filter((file) => file.isDirectory())
      .map((dir) => path.join(clientWorldPath, dir.name));
    return folders;
  } catch (error) {
    console.error("Failed to get client subfolders:", error);
    return []; // Return an empty array to safely handle downstream expectations
  }
}

async function getServerDirectorySaveFolders() {
  try {
    if (!serverWorldPath) {
      serverWorldPath = serverDefaultWorldPath;
    }

    // Read the directory and get subfolders
    const subfolderPaths = await new Promise((resolve, reject) => {
      originalFs.readdir(
        serverWorldPath,
        { withFileTypes: true },
        (err, files) => {
          if (err) {
            reject(err);
          } else {
            const folders = files
              .filter((file) => file.isDirectory())
              .map((dir) => path.join(serverWorldPath, dir.name));
            resolve(folders);
          }
        }
      );
    });

    return subfolderPaths; // Return the array of subfolder paths
  } catch (error) {
    console.error("Failed to get subfolders:", error);
    return []; // Return an empty array in case of an error
  }
}

module.exports = {
  getClientDirectorySaveFolders,
  getServerDirectorySaveFolders,
  setClientWorldPath,
  setServerWorldPath,
  clientWorldPath,
  serverWorldPath,
  listFiles,
  readFile,
  checkServerWorldFolders,
  doesServerDirectoryExist,
  checkClientWorldFolders,
  doesClientDirectoryExist,
};
