///////////////////////////////////////////////////

// IMPORTS

///////////////////////////////////////////////////
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { fork } = require("child_process");
const axios = require("axios"); // Import axios
const path = require("path");
const fs = require("fs");

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

// IPC LISTENERS

///////////////////////////////////////////////////

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
            users = JSON.stringify(users);
            event.reply("steam-users", users);
            event.reply("steam-user-status", true);
          })
          .catch((err) => {
            console.error("Failed to handle steam directory:", err);
            event.reply("steam-users", JSON.stringify([])); // Send an empty array for consistency
            event.reply("steam-user-status", false);
          });
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
      console.log(consoleName, response.data);
    })
    .catch((error) => {
      console.error("Error sending selected user to server:", error);
    });
});

///////////////////////////////////////////////////

// FUNCTIONS

///////////////////////////////////////////////////

function handleSteamDir(folderPath, apiPath) {
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
