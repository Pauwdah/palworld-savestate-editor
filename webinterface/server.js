///////////////////////////////////////////////////

// IMPORTS

///////////////////////////////////////////////////
const express = require("express");
const bodyParser = require("body-parser");
const originalFs = require("fs");
const fs = originalFs.promises;
const fileManager = require("./fileManager");
const steamUtils = require("./steamUtils");
const { get } = require("http");

const app = express();
const port = 3000;

///////////////////////////////////////////////////

// Console

///////////////////////////////////////////////////
const consoleName = "\x1b[38;5;156m Express: \x1b[0m";
function consoleErrorPrint(error) {
  console.error(consoleName, "\x1b[31m", error, "\x1b[0m");
}

///////////////////////////////////////////////////

// SETUP MIDDLEWARE

///////////////////////////////////////////////////

console.log("Setting up static middleware.");
app.use(express.static("webinterface/public"));
app.use(bodyParser.json());
app.listen(port, () => {
  console.log(consoleName, `Server running on http://localhost:${port}`);
  console.log(
    consoleName,
    "Please don't close this window, as it will end the software."
  );
});

///////////////////////////////////////////////////
// EXPRESS SERVER <--AXIOS--> ELECTRON
///////////////////////////////////////////////////
// App Get (SERVER OUTPUT/SENDING DATA TO CLIENT)
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./webinterface/public" });
});

// App Post (SERVER INPUT/RECEIVING DATA FROM CLIENT)
app.post("/api/steam-directory-path", async (req, res) => {
  console.log(consoleName, "Received path. Sending it to steamUtils.");
  let users = [];

  if (steamUtils.setSteamPath(req.body.path)) {
    users = await steamUtils.getSteamUsers(req.body.path);
  }
  fileManager.setPalServerWorldsPath(req.body.path);

  res.send({
    status: " Steam is ready to go!",
    path: req.body.path,
    users: users,
  });
});
//save selected user, get worlds & save them, send them back client
app.post("/api/steam-user", async (req, res) => {
  console.log(consoleName, "Received user. ");
  steamUtils.setSteamUser(req.body.selectedUser);

  let serverSaveStates = [];
  serverSaveStates = await fileManager.getPalServerWorldMatrix();
  let localSaveStates = [];
  localSaveStates = await fileManager.getLocalWorldMatrix(); // function doesn exisit yet
  res.send({
    status: "Steam user is ready to go!",
    user: req.body.selectedUser,
    serverSaveStates: serverSaveStates,
    localSaveStates: localSaveStates,
  });
});
