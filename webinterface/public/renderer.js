const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", function () {
  checkDefaultPaths();
  const openBtn = document.getElementById("openBtn");
  openBtn.addEventListener("click", function () {
    window.selectDirectory();
  });
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
      if (data.error) {
        clientPathStatus.textContent = "No Steam ID directory found.";
        clientPathStatus.className = "status-negative";
      } else {
        clientPathStatus.textContent = data.exists
          ? "Path found!"
          : "No path found, please select Palworld Client directory.";
        clientPathStatus.className = data.exists
          ? "status-positive"
          : "status-negative";
      }
    });

  fetch("/api/server-directory-exists")
    .then((response) => response.json())
    .then((data) => {
      const serverPathStatus = document.getElementById("serverPathStatus");
      serverPathStatus.textContent = data.exists
        ? "Path found!"
        : "No path found, please select Palworld Server directory.";
      serverPathStatus.className = data.exists
        ? "status-positive"
        : "status-negative";
    });
}

require("electron").ipcRenderer.on("selected-directory", (event, path) => {
  console.log("Selected directory:", path);
  // Update the DOM or perform actions based on the selected path
});
