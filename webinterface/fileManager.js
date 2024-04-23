///////////////////////////////////////////////////

// IMPORTS

///////////////////////////////////////////////////
const originalFs = require("fs");
const fs = originalFs.promises;
const { get } = require("http");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");
const steamIdUtils = require("./steamUtils");

///////////////////////////////////////////////////

// VARIABLES

///////////////////////////////////////////////////

let clientWorldPath = "";
let palServerWorldsPath = "";

///////////////////////////////////////////////////

// CLIENT FILE MANAGEMENT

///////////////////////////////////////////////////

function setClientWorldPath(newPath) {
  clientWorldPath = newPath;
}
function getClientWorldPath() {
  return clientWorldPath;
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
        (entry) =>
          entry.isDirectory() && steamIdUtils.isSteamIdFolder(entry.name)
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
    // console.error("Failed to get client subfolders:", error);
    return []; // Return an empty array to safely handle downstream expectations
  }
}

///////////////////////////////////////////////////

// SERVER FILE MANAGEMENT

///////////////////////////////////////////////////
function setPalServerWorldsPath(steamPath, steamId) {
  const newPath =
    steamPath +
    "\\steamapps\\common\\PalServer\\Pal\\Saved\\SaveGames\\0\\" +
    steamId;
  console.log("PalServerWorldsPath:", newPath);
  palServerWorldsPath = newPath;
}
function getServerWorldPath() {
  return palServerWorldsPath;
}
function checkServerWorldFolders(callback) {
  //if serverWorldPath is not set, set it to the default path
  if (!palServerWorldsPath) {
    palServerWorldsPath = serverDefaultWorldPath;
  }

  originalFs.readdir(
    palServerWorldsPath,
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
  if (!palServerWorldsPath) {
    palServerWorldsPath = serverDefaultWorldPath;
  }
  originalFs.stat(palServerWorldsPath, (err, stats) => {
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
async function getServerDirectorySaveFolders() {
  try {
    if (!palServerWorldsPath) {
      palServerWorldsPath = serverDefaultWorldPath;
    }

    // Read the directory and get subfolders
    const subfolderPaths = await new Promise((resolve, reject) => {
      originalFs.readdir(
        palServerWorldsPath,
        { withFileTypes: true },
        (err, files) => {
          if (err) {
            reject(err);
          } else {
            const folders = files
              .filter((file) => file.isDirectory())
              .map((dir) => path.join(palServerWorldsPath, dir.name));
            resolve(folders);
          }
        }
      );
    });

    return subfolderPaths; // Return the array of subfolder paths
  } catch (error) {
    // console.error("Failed to get subfolders:", error);
    return []; // Return an empty array in case of an error
  }
}

///////////////////////////////////////////////////

// GENERAL FILE MANAGEMENT

///////////////////////////////////////////////////
function getPathsOfFileInFirstLevelDirs(directoryPath, fileName) {
  let pathsWithFile = [];

  // Check if the current path exists and is a directory
  if (
    originalFs.existsSync(directoryPath) &&
    originalFs.statSync(directoryPath).isDirectory()
  ) {
    // Read all items in the directory
    const items = originalFs.readdirSync(directoryPath);

    // Check each item in the directory
    items.forEach((item) => {
      const fullPath = path.join(directoryPath, item);
      if (originalFs.statSync(fullPath).isDirectory()) {
        // Check directly inside this directory for the specified file
        const potentialFile = path.join(fullPath, fileName);
        if (
          originalFs.existsSync(potentialFile) &&
          originalFs.statSync(potentialFile).isFile()
        ) {
          // If the file is found, store the directory path
          pathsWithFile.push(fullPath);
        }
      }
    });
  }
  if (pathsWithFile.length > 0) {
    console.log("\x1b[32m", fileName, "(s) found.", "\x1b[0m");
    return pathsWithFile;
  } else {
    console.log("\x1b[31m", "No such file in ", directoryPath, "\x1b[0m");
    return false;
  }
}
async function solveLevelMeta(pathArray) {
  let worldMatrix = [];

  // Convert LevelMeta.sav to LevelMeta.sav.json for all paths first
  for (const path of pathArray) {
    const levelMetaPath = path + "\\LevelMeta.sav";
    await palworldSaveToolsConvert(levelMetaPath); // Assuming this can be promisified or is already async
  }

  // Read and parse the JSON files
  for (const path of pathArray) {
    const levelMetaJSONPath = path + "\\LevelMeta.sav.json";
    try {
      const data = await fs.readFile(levelMetaJSONPath, "utf8");
      const json = JSON.parse(data);
      const worldName = json.properties.SaveData.value.WorldName.value;
      worldMatrix.push([path, worldName]);
    } catch (err) {
      console.error(err);
    }
  }

  return worldMatrix;
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
function palworldSaveToolsConvert(filePath) {
  // Check if the file exists before attempting to execute the script
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // console.error(
      //   "\x1b[33m",
      //   `File not found: ${filePath}`,
      //   " skipping...",
      //   "\x1b[0m"
      // );
      return; // Exit if the file does not exist
    }

    // File exists, proceed to execute the command
    const command = `python palworld_save_tools/convert.py "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        // console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        // console.error(`Stderr: ${stderr}`);
        return;
      }
      // console.log(`Output: ${stdout}`);
    });
  });
}

///////////////////////////////////////////////////

// DEBUG

///////////////////////////////////////////////////

// solveLevelMeta(
//   getPathsOfFileInFirstLevelDirs(serverDefaultWorldPath, "LevelMeta.sav")
// ).then((worldMatrix) => {
//   console.log(worldMatrix);
// });
// solveLevelMeta(
//   getPathsOfFileInFirstLevelDirs(clientDefaultWorldPath, "LevelMeta.sav")
// ).then((worldMatrix) => {
//   console.log("\x1b[34m", "\x1b[5m", worldMatrix, "\x1b[0m");
// });

///////////////////////////////////////////////////

// EXPORTS

///////////////////////////////////////////////////

module.exports = {
  getClientWorldPath,
  getServerWorldPath,
  getClientDirectorySaveFolders,
  getServerDirectorySaveFolders,
  setClientWorldPath,
  setPalServerWorldsPath,
  clientWorldPath,
  listFiles,
  readFile,
  checkServerWorldFolders,
  doesServerDirectoryExist,
  checkClientWorldFolders,
  doesClientDirectoryExist,
};
