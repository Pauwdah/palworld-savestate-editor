const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { fork } = require("child_process");
const axios = require("axios"); // Import axios

const path = require("path");
const fs = require("fs");

// Get the directory name for the current module using __dirname directly available in CommonJS
let mainWindow;
let serverProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Note: This is a security concern for production apps
    },
  });

  mainWindow.loadURL("http://localhost:3000");
  // Uncomment the next line if you want to open the DevTools programmatically
  // mainWindow.webContents.openDevTools();

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

//SERVER

ipcMain.on("select-server-directory", (event, arg) => {
  dialog
    .showOpenDialog(mainWindow, {
      // Ensure you pass the mainWindow as parent
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled) {
        console.log("Server directory selected:", result.filePaths[0]);
        event.sender.send("server-directory-selected", result.filePaths[0]);
      }
    })
    .catch((err) => {
      console.error("Failed to open dialog:", err);
    });
});

//CLIENT

ipcMain.on("select-client-directory", (event, arg) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        console.log("Client directory selected:", result.filePaths[0]);
        // Send the path to the server
        axios
          .post("http://localhost:3000/api/client-directory-exists", {
            path: result.filePaths[0],
          })
          .then((response) => {
            console.log("Server response:", response.data);
          })
          .catch((error) => {
            console.error("Error sending path to server:", error);
          });
        mainWindow.webContents.reload();
      }
    })
    .catch((err) => {
      console.error("Failed to open dialog:", err);
    });
});
