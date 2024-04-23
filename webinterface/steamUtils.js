///////////////////////////////////////////////////

// IMPORTS

///////////////////////////////////////////////////

const fs = require("fs").promises;
const originalFs = require("fs");
const vdf = require("vdf-parser");

///////////////////////////////////////////////////

// VARIABLES

///////////////////////////////////////////////////
let steamPath = "C:\\Program Files (x86)\\Steam";
let steamUsers = [];

///////////////////////////////////////////////////

// Console

///////////////////////////////////////////////////
const consoleName = "\x1b[38;5;25m Steam Utils: \x1b[0m";
function consoleErrorPrint(error) {
  console.error(consoleName, "\x1b[31m", error, "\x1b[0m");
}
///////////////////////////////////////////////////

// FUNCTIONS

///////////////////////////////////////////////////

function setSteamPath(path) {
  if (isSteamPathValid(path)) {
    console.log(consoleName, "Setting Steam path...");
    steamPath = path;
    console.log(consoleName, "Success!");
    return true;
  } else {
    consoleErrorPrint("Could not set Steam path.");
    return false;
  }
}
//check if the input steam path has 1. loginusers.vdf 2. Palworld server
function isSteamPathValid(path) {
  console.log(consoleName, "Checking Steam path...");
  //check if path exists then check if loginusers.vdf exists
  // check for loginusers.vdf
  if (originalFs.existsSync(path + "\\config\\loginusers.vdf")) {
    //check for the palworld server
    if (originalFs.existsSync(path + "\\steamapps\\common\\PalServer")) {
      console.log(consoleName, "Success!");
      return true;
    } else {
      consoleErrorPrint("Palworld server not found.");
      return false;
    }
  } else {
    consoleErrorPrint("loginusers.vdf not found.");
    return false;
  }
}

async function getSteamUsers(path) {
  try {
    const loginUsersVdfPath = path + "\\config\\loginusers.vdf";
    const data = await fs.readFile(loginUsersVdfPath, "utf8");
    const parsedData = vdf.parse(data);

    let usersArray = [];

    // Extracting the Steam IDs and corresponding account names
    for (let id in parsedData.users) {
      if (parsedData.users.hasOwnProperty(id)) {
        let accountName = parsedData.users[id].AccountName;
        usersArray.push([id, accountName]);
      }
    }

    return usersArray;
  } catch (err) {
    console.error("Error reading or parsing the loginusers.vdf file:", err);
    return [];
  }
}

///////////////////////////////////////////////////

// DEBUG

///////////////////////////////////////////////////

///////////////////////////////////////////////////

// EXPORTS

///////////////////////////////////////////////////

module.exports = {
  getSteamUsers,
  setSteamPath,
  steamPath,
};
