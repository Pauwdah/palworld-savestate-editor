const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const fileManager = require("./fileManager");

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log("Please don't close this window, as it will end the software.");
});

// Serve index.html from the public directory
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./webinterface/public" });
});

// Setup middleware
console.log("Setting up static middleware.");
app.use(express.static("webinterface/public"));
app.use(bodyParser.json());
console.log("Static files are set to be served from the public directory.");

// Check server folders
fileManager.checkServerWorldFolders((err, folders) => {
  if (err) {
    console.error("Error checking server folders:", err);
  } else {
    console.log("Server World Folders:", folders);
  }
});

// API to check if the server directory exists
app.get("/api/server-directory-exists", (req, res) => {
  fileManager.doesServerDirectoryExist((err, exists) => {
    if (err) {
      res.status(500).json({ error: "Error checking server directory" });
    } else {
      res.json({ exists });
    }
  });
});

app.post("/api/server-directory-exists", (req, res) => {
  const { path } = req.body;
  fs.stat(path, (err, stats) => {
    if (err) {
      res.status(404).json({ exists: false });
    } else {
      res.json({ exists: stats.isDirectory() });
    }
  });
});

// Check client folders
fileManager.checkClientWorldFolders((err, folders) => {
  if (err) {
    console.error("Error checking client folders:", err);
  } else {
    console.log("Client World Folders:", folders);
  }
});

// API to check if the client directory exists
app.get("/api/client-directory-exists", (req, res) => {
  fileManager.doesClientDirectoryExist((err, exists) => {
    if (err) {
      res.status(500).json({ error: "Error checking client directory" });
    } else {
      res.json({ exists });
    }
  });
});

app.post("/api/client-directory-exists", (req, res) => {
  const { path } = req.body;
  fs.stat(path, (err, stats) => {
    if (err) {
      res.status(404).json({ exists: false });
    } else {
      res.json({ exists: stats.isDirectory() });
    }
  });
});
