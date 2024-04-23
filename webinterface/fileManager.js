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
let palServerWorldsPathArray = [];
let palServerWorldMatrix = [];

///////////////////////////////////////////////////

// Console

///////////////////////////////////////////////////
const consoleName = "\x1b[38;5;219m  File Manager: \x1b[0m";
function consoleErrorPrint(error) {
  console.error(consoleName, "\x1b[31m", error, "\x1b[0m");
}
///////////////////////////////////////////////////

// CLIENT FILE MANAGEMENT

///////////////////////////////////////////////////

///////////////////////////////////////////////////

// SERVER FILE MANAGEMENT

///////////////////////////////////////////////////
function setPalServerWorldsPath(steamPath) {
  const newPath =
    steamPath + "\\steamapps\\common\\PalServer\\Pal\\Saved\\SaveGames\\0\\";
  console.log("PalServerWorldsPath:", newPath);
  palServerWorldsPath = newPath;
}
function getPalServerWorldPath() {
  return palServerWorldsPath;
}

async function getPalServerWorldMatrix() {
  palServerWorldsPathArray = await getPathsOfFileInFirstLevelDirs(
    palServerWorldsPath,
    "LevelMeta.sav"
  );
  console.log(
    consoleName,
    "palServerWorldsPathArray:",
    palServerWorldsPathArray
  );
  palServerWorldMatrix = await solveLevelMeta(palServerWorldsPathArray);
  console.log(consoleName, "palServerWorldMatrix:", palServerWorldMatrix);
  return palServerWorldMatrix;
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

async function solveLevelMeta(pathArray) {
  let worldMatrix = [];
  if (pathArray.length === 0) {
    console.log("No paths found.");
    return [];
  }

  // Convert all files first
  const conversionPromises = pathArray.map((path) => {
    const levelMetaPath = path + "\\LevelMeta.sav";
    return ConvertSavJson(levelMetaPath);
  });

  // Wait for all conversions to complete
  await Promise.all(conversionPromises);

  // Now proceed with reading and parsing JSON files
  for (const path of pathArray) {
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

function ConvertSavJson(filePath) {
  return new Promise((resolve, reject) => {
    console.log(consoleName, `Attempting to access file: ${filePath}`);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(consoleName, `File not found: ${filePath}, skipping...`);
        return resolve(); // Resolve to avoid blocking other operations
      }

      const command = `python palworld_save_tools/convert.py "${filePath}"`;
      console.log(consoleName, `Executing command: ${command}`);
      exec(command, (error, stdout, stderr) => {
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
        resolve();
      });
    });
  });
}

// async function solveLevelMeta(pathArray) {
//   let worldMatrix = [];
//   //check if pathArray is empty
//   if (pathArray.length === 0) {
//     console.log("\x1b[31m", "No paths found.", "\x1b[0m");
//     return [];
//   }

//   // Convert LevelMeta.sav to LevelMeta.sav.json for all paths first
//   for (const path of pathArray) {
//     const levelMetaPath = path + "\\LevelMeta.sav";
//     ConvertSavJson(levelMetaPath); // Assuming this can be promisified or is already async
//   }

//   // Read and parse the JSON files
//   for (const path of pathArray) {
//     const levelMetaJSONPath = path + "\\LevelMeta.sav.json";
//     try {
//       const data = await fs.readFile(levelMetaJSONPath, "utf8");
//       const json = JSON.parse(data);
//       const worldName = json.properties.SaveData.value.WorldName.value;
//       worldMatrix.push([path, worldName]);
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   return worldMatrix;
// }

// function ConvertSavJson(filePath) {
//   // Check if the file exists before attempting to execute the script
//   fs.access(filePath, fs.constants.F_OK, (err) => {
//     if (err) {
//       // console.error(
//       //   "\x1b[33m",
//       //   `File not found: ${filePath}`,
//       //   " skipping...",
//       //   "\x1b[0m"
//       // );
//       return; // Exit if the file does not exist
//     }

//     // File exists, proceed to execute the command
//     const command = `python palworld_save_tools/convert.py "${filePath}"`;

//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         // console.error(`Error: ${error.message}`);
//         return;
//       }
//       if (stderr) {
//         // console.error(`Stderr: ${stderr}`);
//         return;
//       }
//       // console.log(`Output: ${stdout}`);
//     });
//   });
// }

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
};
