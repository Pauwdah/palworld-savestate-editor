///////////////////////////////////////////////////

// IMPORTS

///////////////////////////////////////////////////
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { fork } = require("child_process");
const axios = require("axios"); // Import axios
const path = require("path");
const fs = require("fs");
const steamUtils = require("./webinterface/steamUtils");
// const renderer = require("./webinterface/public/renderer");

///////////////////////////////////////////////////

// VARIABLES

///////////////////////////////////////////////////
let mainWindow;
let serverProcess = null;

///////////////////////////////////////////////////

// Console

///////////////////////////////////////////////////
const consoleName = "\x1b[38;5;110m Electron: \x1b[0m";
function consoleErrorPrint(error) {
  console.error(consoleName, "\x1b[31m", error, "\x1b[0m");
}

///////////////////////////////////////////////////

// SERVER STARTUP

///////////////////////////////////////////////////
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Note: This is a security concern for production apps
    },
  });

  mainWindow.loadURL("http://localhost:3000");
  // Uncomment the next line if you want to open the DevTools programmatically
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (serverProcess !== null) {
      serverProcess.kill();
    }
  });
}

function startServer() {
  serverProcess = fork(path.join(__dirname, "webinterface", "server.js"), [], {
    silent: false,
  });

  serverProcess.on("message", (msg) => {
    console.log("Server Process:", msg);
  });
}

app.on("ready", () => {
  startServer();
  createWindow();
  //selectServerDirectory();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

///////////////////////////////////////////////////
// MAIN PROCESS <--AXIOS--> EXPRESS SERVER
///////////////////////////////////////////////////
ipcMain.on("auto-setup", (event) => {
  console.log(consoleName, "Attempting to send path to server...");
  if (fs.existsSync(steamUtils.getSteamPath())) {
    handleSteamDir(steamUtils.getSteamPath(), "/api/steam-directory-path")
      .then((users) => {
        // Send back to the renderer
        event.reply("steam-users", users);
        event.reply("steam-user-status", true);
      })
      .catch((err) => {
        console.error("Failed to handle steam directory:", err);
        event.reply("steam-users", JSON.stringify([])); // Send an empty array for consistency
        event.reply("steam-user-status", false);
      });
  } else {
    throw new Error("Steam not found at default path.");
  }
  if (fs.existsSync()) {
  }
});

ipcMain.on("select-steam-directory", (event) => {
  dialog
    .showOpenDialog({
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        console.log(consoleName, "Attempting to send path to server...");
        handleSteamDir(result.filePaths[0], "/api/steam-directory-path")
          .then((users) => {
            // Send back to the renderer
            event.reply("steam-users", users, true);
          })
          .catch((err) => {
            console.error("Failed to handle steam directory:", err);
            event.reply("steam-users", JSON.stringify([])); // Send an empty array for consistency
            event.reply("steam-user-status", false);
          });

        //here handle local directory
      } else {
        // Handle the case where the user cancels the dialog or selects no directory
        event.reply("steam-users", JSON.stringify([]));
        event.reply("steam-user-status", false);
      }
    })
    .catch((err) => {
      console.log("Error with open dialog:", err);
      event.reply("steam-user-status", false);
    });
});

ipcMain.on("select-steam-user", (event, selectedUser) => {
  console.log(consoleName, "Sending User: ", selectedUser);

  //send selected user to server
  axios
    .post("http://localhost:3000/api/steam-user", { selectedUser })
    .then((response) => {
      event.reply(
        "worlds",
        response.data.serverSaveStates,
        response.data.localSaveStates
      );
    })
    .catch((error) => {
      console.error("Error sending selected user to server:", error);
    });
});

ipcMain.on("select-client-world", (event, selectedWorld) => {
  console.log(consoleName, "Sending World: ", selectedWorld);
  event.reply("update-loading-bar", "clientWorldLoadingBar", 50);

  axios
    .post("http://localhost:3000/api/client-world", { selectedWorld })
    .then((response) => {
      event.reply("client-world", true);
      event.reply("update-loading-bar", "clientWorldLoadingBar", 0);
    })
    .catch((error) => {
      event.reply("client-world", false);
      event.reply("update-loading-bar", "clientWorldLoadingBar", 0);
      consoleErrorPrint(
        "Error sending selected world to server:",
        selectedWorld
      );
    });
});

///////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////

function handleSteamDir(folderPath, apiPath) {
  //add check if path is valid

  return axios
    .post(`http://localhost:3000${apiPath}`, { path: folderPath })
    .then((response) => {
      console.log(consoleName, response.data);
      if (
        response.data &&
        response.data.users &&
        response.data.users.length > 0
      ) {
        return response.data.users; // Return the users if they exist
      } else {
        throw new Error("No users found"); // Throw an error if no users
      }
    })
    .catch((error) => {
      console.error("Error sending path to server:", error);
      throw error; // Re-throw the error to be caught by the calling function
    });
}
