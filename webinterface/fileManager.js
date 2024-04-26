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
//defualt path starts at %localappdata%\Pal\Saved\SaveGames
let localSaveStatesPath =
  os.homedir() + "\\AppData\\Local\\Pal\\Saved\\SaveGames\\";
let localSaveStatesPathArray = [];
let localWorldMatrix = [];
let palServerSaveStatePath = "";
let palServerSaveStatePathArray = [];
let palServerWorldMatrix = [];

///////////////////////////////////////////////////
// CONSOLE
///////////////////////////////////////////////////

const consoleName = "\x1b[38;5;219m  File Manager: \x1b[0m";
function consoleErrorPrint(error) {
  console.error(consoleName, "\x1b[31m", error, "\x1b[0m");
}
///////////////////////////////////////////////////
// CLIENT FILE MANAGEMENT
///////////////////////////////////////////////////
async function getLocalWorldMatrix() {
  let localSaveStatesPathWithUser =
    localSaveStatesPath + steamIdUtils.getSteamUser() + "\\";

  console.log(
    consoleName,
    "localSaveStatesPathWithUser:",
    localSaveStatesPathWithUser
  );

  localSaveStatesPathArray = await getPathsOfFileInFirstLevelDirs(
    localSaveStatesPathWithUser,
    "LevelMeta.sav"
  );

  localWorldMatrix = await solveLocalWorldMeta(localSaveStatesPathArray);
  return localWorldMatrix;
}
async function solveLocalWorldMeta(pathArrayOfLocalSaveStates) {
  let worldMatrix = [];
  if (pathArrayOfLocalSaveStates.length === 0) {
    console.log("No paths found.");
    return [];
  }

  // Convert all files first
  const conversionPromises = pathArrayOfLocalSaveStates.map((path) => {
    const levelMetaPath = path + "\\LevelMeta.sav";
    return ConvertSavJson(levelMetaPath);
  });

  // Wait for all conversions to complete
  await Promise.all(conversionPromises);

  // Now proceed with reading and parsing JSON files
  for (const path of pathArrayOfLocalSaveStates) {
    const levelMetaJSONPath = path + "\\LevelMeta.sav.json";
    try {
      const data = await fs.readFile(levelMetaJSONPath, "utf8");
      const json = JSON.parse(data);
      const worldName = json.properties.SaveData.value.WorldName.value;
      worldMatrix.push([path, worldName]);
    } catch (err) {
      console.error(`Error reading or parsing JSON: ${err}`);
    }
  }

  return worldMatrix;
}

///////////////////////////////////////////////////
// SERVER FILE MANAGEMENT
///////////////////////////////////////////////////
function setPalServerWorldsPath(steamPath) {
  const newPath =
    steamPath + "\\steamapps\\common\\PalServer\\Pal\\Saved\\SaveGames\\0\\";
  console.log("PalServerWorldsPath:", newPath);
  palServerSaveStatePath = newPath;
}
function getPalServerWorldPath() {
  return palServerSaveStatePath;
}

async function getPalServerWorldMatrix() {
  palServerSaveStatePathArray = await getPathsOfFileInFirstLevelDirs(
    palServerSaveStatePath,
    "LevelMeta.sav"
  );
  console.log(
    consoleName,
    "palServerWorldsPathArray:",
    palServerSaveStatePathArray
  );
  // palServerWorldMatrix = await solveLevelMeta(palServerWorldsPathArray); //this only works for local worlds since the name is stored in the PalWorldSettings.ini for the server
  palServerWorldMatrix = await solveServerWorldMeta(
    palServerSaveStatePathArray
  );
  console.log(consoleName, "palServerWorldMatrix:", palServerWorldMatrix);
  return palServerWorldMatrix;
}

async function solveServerWorldMeta(pathsOfServerSaveStates) {
  let worldMatrix = [];
  if (pathsOfServerSaveStates.length === 0) {
    console.log("No paths found.");
    return [];
  }

  // Convert all files first
  const conversionPromises = pathsOfServerSaveStates.map((path) => {
    const levelMetaPath = path + "\\LevelMeta.sav";
    return ConvertSavJson(levelMetaPath);
  });

  // Wait for all conversions to complete
  await Promise.all(conversionPromises);

  // Now proceed with reading and parsing JSON files
  for (const path of pathsOfServerSaveStates) {
    const levelMetaJSONPath = path + "\\LevelMeta.sav.json";
    try {
      const data = await fs.readFile(levelMetaJSONPath, "utf8");
      const json = JSON.parse(data);
      const timeTicks = json.properties.Timestamp.value;
      //add conversion from .NET's DateTime.Ticks to JS Date
      const savedTime = convertTicksToDateTime(timeTicks);
      worldMatrix.push([path, savedTime]);
    } catch (err) {
      console.error(`Error reading or parsing JSON: ${err}`);
    }
  }

  return worldMatrix;
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
    console.log("\x1b[31m", "No file or dir found", "\x1b[0m");
    return [];
  }
}

function convertTicksToDateTime(ticks) {
  const baseDate = new Date("0001-01-01T00:00:00Z");
  const milliseconds = ticks / 10000;
  const date = new Date(baseDate.getTime() + milliseconds);
  const dateString =
    date.getUTCFullYear().toString().padStart(4, "0") +
    "-" +
    (date.getUTCMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getUTCDate().toString().padStart(2, "0");

  // Create a time string in the format "HH:MM:SS"
  const timeString =
    date.getUTCHours().toString().padStart(2, "0") +
    ":" +
    date.getUTCMinutes().toString().padStart(2, "0") +
    ":" +
    date.getUTCSeconds().toString().padStart(2, "0");

  return dateString + " " + timeString;
}

// Example usage
const ticks = 638497340614460000;
console.log(convertTicksToDateTime(ticks));

function ConvertSavJson(filePath) {
  return new Promise((resolve, reject) => {
    const command = `python palworld_save_tools/convert.py "${filePath}" --force`;
    console.log(consoleName, `Executing command: ${command}`);

    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(
          consoleName,
          `Error executing conversion: ${error.message}`
        );
        return reject(error);
      }
      if (stderr) {
        console.error(consoleName, `Conversion stderr: ${stderr}`);
        return reject(new Error(stderr));
      }
      console.log(consoleName, `Conversion output: ${stdout}`);
      resolve(stdout); // resolve with stdout to debug output if necessary
    });

    // To handle cases where the Python script might be waiting for input:
    process.stdin.end();
  });
}

///////////////////////////////////////////////////

// DEBUG

///////////////////////////////////////////////////

///////////////////////////////////////////////////

// EXPORTS

///////////////////////////////////////////////////

module.exports = {
  setPalServerWorldsPath,
  getPalServerWorldPath,
  getPalServerWorldMatrix,
  getLocalWorldMatrix,
};
