const { ipcRenderer } = require("electron");
document.addEventListener("DOMContentLoaded", function () {
  checkDefaultPaths();
});

//Client Directory
document.getElementById("selectClientDir").addEventListener("click", () => {
  ipcRenderer.send("select-client-directory");
});
ipcRenderer.on("client-directory-selected", (event, path) => {
  console.log("Selected directory:", path);
});
//Server Directory
document.getElementById("selectServerDir").addEventListener("click", () => {
  ipcRenderer.send("select-server-directory");
});
ipcRenderer.on("server-directory-selected", (event, path) => {
  console.log("Selected directory:", path);
});

function checkDefaultPaths() {
  fetch("/api/client-directory-exists")
    .then((response) => response.json())
    .then((data) => {
      const clientPathStatus = document.getElementById("clientPathStatus");
      clientPathStatus.textContent = data.exists
        ? "Path found!"
        : "No path found, please select your own.";
      clientPathStatus.className = data.exists
        ? "status-positive"
        : "status-negative";
    });

  fetch("/api/server-directory-exists")
    .then((response) => response.json())
    .then((data) => {
      const serverPathStatus = document.getElementById("serverPathStatus");
      serverPathStatus.textContent = data.exists
        ? "Path found!"
        : "No path found, please select your own.";
      serverPathStatus.className = data.exists
        ? "status-positive"
        : "status-negative";
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const openBtn = document.getElementById("openBtn");
  openBtn.addEventListener("click", function () {
    // Assuming global.selectDirectory is exposed from the main process
    window.selectDirectory();
  });
});

document.getElementById("openBtn").addEventListener("click", () => {
  window.electronAPI.selectDirectory(); // Calling a function exposed from the main process
});

require("electron").ipcRenderer.on("selected-directory", (event, path) => {
  console.log("Selected directory:", path);
  // Update the DOM or perform actions based on the selected path
});

function checkDirectory(path, type) {
  fetch(`/api/${type}-directory-exists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  })
    .then((response) => response.json())
    .then((data) => {
      const statusElement = document.getElementById(`${type}PathStatus`);
      if (data.exists) {
        statusElement.textContent = "Path found!";
        statusElement.className = "path-status path-found";
      } else {
        statusElement.textContent = "No path found, please select your own.";
        statusElement.className = "path-status path-not-found";
      }
    })
    .catch((error) => {
      console.error("Failed to check directory:", error);
    });
}
