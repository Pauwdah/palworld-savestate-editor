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
    return convertSavJson(levelMetaPath);
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

  const conversionPromises = pathsOfServerSaveStates.map((path) => {
    const levelMetaPath = path + "\\LevelMeta.sav";
    return convertSavJson(levelMetaPath);
  });

  await Promise.all(conversionPromises);

  for (const path of pathsOfServerSaveStates) {
    const levelMetaJSONPath = path + "\\LevelMeta.sav.json";
    try {
      const data = await fs.readFile(levelMetaJSONPath, "utf8");
      const json = JSON.parse(data);
      const timeTicks = json.properties.Timestamp.value;
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

function convertPlayerSaveStatesToJson(pathToPlayerSavFolder) {
  //takes in a folder path pathToPlayerSavFolder
  //gets all files of type .sav in that folder
  //converts them to json with convertSavToJson(pathToFile)
  //returns an array of paths to the json files
  console.log(consoleName, `Converting player save states to JSON...`);
  return new Promise((resolve, reject) => {
    fs.readdir(pathToPlayerSavFolder, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      const jsonFiles = files
        .filter((file) => file.endsWith(".sav")) // Filter to get only .sav files
        .map((file) => path.join(pathToPlayerSavFolder, file)) // Create full path
        .map(convertSavToJson); // Convert each .sav file to .json

      resolve(jsonFiles);
    });
  });
}
function getPlayerSaveStateMatrix(pathArray) {
  //takes in an array of paths to player save states in json format
  //then reads and parses the json files
  //returns for each savestate teh path + the name of the player for frontend identification
  let playerSaveStateMatrix = [];
  for (const path of pathArray) {
    const playerSaveState = parseJsonFile(path);
    playerSaveStateMatrix.push([path, playerSaveState]);
  }
  return playerSaveStateMatrix;
}

function getJsonAsArray(json) {
  let jsonArray = [];
  for (const key in json) {
    jsonArray.push([key, json[key]]);
  }
  return jsonArray;
}
function parseJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8")
      .then((data) => {
        const json = JSON.parse(data);
        resolve(json);
      })
      .catch((err) => {
        console.error(consoleName, `Error reading or parsing JSON: ${err}`);
        reject(err);
      });
  });
}

///////////////////////////////////////////////////
// CONVERSION FUNCTIONS
///////////////////////////////////////////////////
function convertTicksToDateTime(ticks) {
  //Convert .NET's DateTime.Ticks to JS Date
  const baseDate = new Date("0001-01-01T00:00:00Z");
  const milliseconds = ticks / 10000;
  const date = new Date(baseDate.getTime() + milliseconds);
  const dateString =
    date.getUTCFullYear().toString().padStart(4, "0") +
    "-" +
    (date.getUTCMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getUTCDate().toString().padStart(2, "0");

  const timeString =
    date.getUTCHours().toString().padStart(2, "0") +
    ":" +
    date.getUTCMinutes().toString().padStart(2, "0") +
    ":" +
    date.getUTCSeconds().toString().padStart(2, "0");

  return dateString + " " + timeString;
}

function convertSavJson(pathToFile) {
  return new Promise((resolve, reject) => {
    const command = `python palworld_save_tools/convert.py "${pathToFile}" --force`;
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

    process.stdin.end();
  });
}

async function convertSavToJson(pathToFile) {
  await convertSavJson(pathToFile);
  const levelSavJsonPath = pathToFile + ".json";
  return levelSavJsonPath;
}
async function convertJsonToSav(pathToFile) {
  await convertSavJson(levelSavJsonPath);
  const levelSavPath = pathToFile.replace(".json", "");
  return levelSavPath;
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
  convertPlayerSaveStatesToJson,
  convertSavToJson,
  convertJsonToSav,
};
