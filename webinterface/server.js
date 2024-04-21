const express = require("express");
const bodyParser = require("body-parser");
const originalFs = require("fs");
const fs = originalFs.promises;
const fileManager = require("./fileManager");

const app = express();
const port = 3000;

// Setup middleware
console.log("Setting up static middleware.");
app.use(express.static("webinterface/public"));
app.use(bodyParser.json());
app.listen(port, () => {
  console.log(
    "\x1b[32m",
    "\x1b[1m",
    `Server running on http://localhost:${port}`,
    "\x1b[0m"
  );
  console.log(
    "\x1b[31m",
    "Please don't close this window, as it will end the software.",
    "\x1b[0m"
  );
});

// Serve index.html from the public directory
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./webinterface/public" });
});

// Check server folders

// API SERVER DIRECTORY EXISTS
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
  originalFs.stat(path, (err, stats) => {
    if (err) {
      res.status(404).json({ exists: false });
    } else {
      res.json({ exists: stats.isDirectory() });
    }
  });
});

// API CLIENT DIRECTORY EXISTS
app.get("/api/client-directory-exists", (req, res) => {
  fileManager.doesClientDirectoryExist((err, exists) => {
    if (err) {
      res
        .status(500)
        .json({ error: err.customError || err.message, exists: false });
    } else {
      res.json({ exists });
    }
  });
});

app.post("/api/client-directory-exists", (req, res) => {
  const { path } = req.body;
  originalFs.stat(path, (err, stats) => {
    if (err) {
      res.status(404).json({ exists: false });
    } else {
      res.json({ exists: stats.isDirectory() });
    }
  });

  // API CHECK CLIENT STEAM ID FOLDERS
  app.get("/api/check-client-world-folders", (req, res) => {
    fileManager.checkClientWorldFolders((err, folders) => {
      if (err) {
        res.status(500).json({ error: err.customError || err.message });
      } else {
        res.json({ folders });
      }
    });
  });

  fileManager.checkClientWorldFolders((err, folders) => {
    if (err) {
      console.error("Error checking client folders:", err);
    } else {
      console.log("Client World Folders:", folders);
    }
  });

  fileManager.setClientWorldPath(path);
  console.log("Client World Path set to:", fileManager.clientWorldPath);
  fileManager.checkClientWorldFolders((err, folders) => {
    if (err) {
      console.error("Error checking client folders:", err);
    } else {
      console.log("Client World Folders:", folders);
    }
  });
});

// CONVERT FILE WITH palworld_save_tools

const { exec } = require("child_process");
const path = require("path");

function convertFile(filePath) {
  // Check if the file exists before attempting to execute the script
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(
        "\x1b[33m",
        `File not found: ${filePath}`,
        " skipping...",
        "\x1b[0m"
      );
      return; // Exit if the file does not exist
    }

    // File exists, proceed to execute the command
    const command = `python palworld_save_tools/convert.py "${filePath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
      }
      console.log(`Output: ${stdout}`);
    });
  });
}

// GET CLIENT LEVEL META

async function getClientLevelMeta(paths) {
  console.log("Reading world(s) name(s) from path(s):", paths);

  // Convert each file before reading its JSON metadata
  for (const path of paths) {
    const levelMetaPath = path + "\\LevelMeta.sav";
    await convertFile(levelMetaPath); // Ensuring conversion is completed for each file
  }

  // Create a results array to store the paths and world names
  let results = [];

  // Use Promise.all to handle asynchronous reading and parsing of JSON files
  const worldIdentifier = await Promise.all(
    paths.map(async (path) => {
      const levelMetaJsonPath = path + "\\LevelMeta.sav.json";
      try {
        // Check if the JSON file exists before reading
        await originalFs.promises.access(
          levelMetaJsonPath,
          originalFs.constants.F_OK
        );
        const data = await originalFs.promises.readFile(
          levelMetaJsonPath,
          "utf8"
        );
        const json = JSON.parse(data);
        const worldName = json.properties.SaveData.value.WorldName.value;
        if (worldName) {
          // Check if worldName is not null
          results.push([path, worldName]); // Only add if worldName is not null
        }
        return worldName; // Return the world name for inclusion in the worldIdentifier array
      } catch (error) {
        console.error(
          "\x1b[33m",
          "Error reading or parsing file:",
          levelMetaJsonPath,
          " skipping...",
          "\x1b[0m"
        );
        return null; // Return null as the result for this path
      }
    })
  );

  return results; // Return the 2D array containing paths and world names, excluding any with null world names
}

// GET SERVER LEVEL META
async function getServerLevelMeta(paths) {
  console.log("Reading server world(s) name(s) from path(s):", paths);

  for (const path of paths) {
    const levelMetaPath = path + "\\LevelMeta.sav";
    await convertFile(levelMetaPath);
  }

  let results = []; // Initialize an array to store the paths and world names

  // Use Promise.all to handle asynchronous reading and parsing of JSON files
  const worldNames = await Promise.all(
    paths.map(async (path) => {
      const levelMetaJsonPath = path + "\\LevelMeta.sav.json";
      try {
        const data = await originalFs.promises.readFile(
          levelMetaJsonPath,
          "utf8"
        );
        const json = JSON.parse(data);
        const worldName = json.properties.SaveData.value.WorldName.value;
        if (worldName) {
          // Only add results if worldName is not null
          results.push([path, worldName]);
        }
        return worldName;
      } catch (error) {
        console.error(
          "\x1b[33m",
          "Error reading or parsing file:",
          levelMetaJsonPath,
          " skipping...",
          "\x1b[0m"
        );
        return null;
      }
    })
  );

  return results;
}

// Get server directory save matrics
fileManager
  .getServerDirectorySaveFolders()
  .then(async (paths) => {
    const serverWorldData = await getServerLevelMeta(paths);
    console.log("\nServer World Data (Path, Name):\n", serverWorldData);
  })
  .catch((error) => {
    console.error("Error in processing server directories:", error);
  });
// Get client directory save matrics
fileManager
  .getClientDirectorySaveFolders()
  .then(async (paths) => {
    const clientWorldData = await getClientLevelMeta(paths);
    console.log("\nClient World Data (Path, Name):\n", clientWorldData);
  })
  .catch((error) => {
    console.error("Error in processing client directories:", error);
  });
