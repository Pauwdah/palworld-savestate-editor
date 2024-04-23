///////////////////////////////////////////////////

// IMPORTS

///////////////////////////////////////////////////
const { ipcRenderer } = require("electron");
const { stat } = require("original-fs");
const consoleName = "\x1b[38;5;219m Renderer: \x1b[0m";

///////////////////////////////////////////////////

// EVENT LISTENERS

///////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function () {
  setupDirSelectListeners();
});

function setupDirSelectListeners() {
  //SteamDirOut
  document.getElementById("selectSteamDir").addEventListener("click", () => {
    ipcRenderer.send("select-steam-directory"); // Send message to main process
    console.log(consoleName, "Sent message to main process.");
  });
  //SteamDirIn
  ipcRenderer.on("steam-users", (event, users) => {
    updateSteamUserDropdown(users);
    console.log(consoleName, "Received users!", users);
  });
  ipcRenderer.on("pal-server-worlds", (event, worlds) => {
    console.log(consoleName, "Recieved Server Worlds", worlds);
    updateServerWorldDropdown(worlds);
  });
  //SteamStatus
  ipcRenderer.on("steam-user-status", (event, success) => {
    const status = document.getElementById("steamUserStatus");
    const pathStatus = document.getElementById("steamPathStatus");

    status.innerHTML = "❓";
    pathStatus.innerHTML = "❓";

    if (success) {
      document
        .getElementById("confirmSteamUser")
        .addEventListener("click", () => {
          status.innerHTML = "✔️";
        });
      pathStatus.innerHTML = "✔️";
    } else {
      status.innerHTML = "❌";
      pathStatus.innerHTML = "❌";
    }
  });
}

function updateSteamUserDropdown(users) {
  const dropdown = document.getElementById("steamUserDropdown");

  dropdown.innerHTML = "";
  const usersArray = JSON.parse(users);

  usersArray.forEach((user) => {
    const option = document.createElement("option");
    option.textContent = user[1]; // user[1] should be the name
    option.value = user[0]; // user[0] should be the ID
    dropdown.appendChild(option);
  });
}
function updateServerWorldDropdown(worlds) {
  const dropdown = document.getElementById("serverWorldDropdown");

  dropdown.innerHTML = "";
  const worldsArray = JSON.parse(worlds);

  worldsArray.forEach((world) => {
    const option = document.createElement("option");
    option.textContent = world[1]; // user[1] should be the name
    option.value = world[0]; // user[0] should be the ID
    dropdown.appendChild(option);
  });
}

//add event listener to the button next to the dropdown with id confirmSteamUser
document.getElementById("confirmSteamUser").addEventListener("click", () => {
  const selectedUser = document.getElementById("steamUserDropdown").value;
  console.log(consoleName, "Selected user:", selectedUser);
  ipcRenderer.send("select-steam-user", selectedUser);
  console.log(consoleName, "Sent selected user to main process.");
});
