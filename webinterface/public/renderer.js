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
  //SteamStatus
  ipcRenderer.on("steam-user-status", (event, success) => {
    const status = document.getElementById("steamUserStatus");
    status.innerHTML = "";

    if (success) {
      // status.classList.add("status-positive");
      // status.innerHTML = "Steam is ready to go!";
      status.innerHTML = "✔️";
    } else {
      status.innerHTML = "❌";
    }
  });
}

function updateSteamUserDropdown(users) {
  const dropdown = document.getElementById("steamUserDropdown");
  // Clear existing options
  dropdown.innerHTML = "";

  // Parse the JSON string back to an array
  const usersArray = JSON.parse(users);

  // Populate the dropdown with new options
  usersArray.forEach((user) => {
    const option = document.createElement("option");
    option.textContent = user[1]; // user[1] should be the name
    option.value = user[0]; // user[0] should be the ID
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
