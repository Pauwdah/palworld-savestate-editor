///////////////////////////////////////////////////
// IMPORTS
///////////////////////////////////////////////////
const { ipcRenderer } = require("electron");
const consoleName = "\x1b[38;5;219m Renderer: \x1b[0m";

///////////////////////////////////////////////////
// RENDERER <--IPC--> MAIN PROCESS
///////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  createSingleEntryField();

  ///////////////////////////////////////////////////
  // RENDERER OUT
  ///////////////////////////////////////////////////
  // Send Auto Setup
  document.getElementById("autoSetup").addEventListener("click", () => {
    ipcRenderer.send("auto-setup");
    console.log(consoleName, "Sent message to main process.");
  });

  // Send Steam Directory
  document.getElementById("selectSteamDir").addEventListener("click", () => {
    ipcRenderer.send("select-steam-directory"); // Send message to main process
    console.log(consoleName, "Sent message to main process.");
  });

  // Send Steam User
  document.getElementById("confirmSteamUser").addEventListener("click", () => {
    const selectedUser = document.getElementById("steamUserDropdown").value;
    console.log(consoleName, "Selected user:", selectedUser);
    ipcRenderer.send("select-steam-user", selectedUser);
    console.log(consoleName, "Sent selected user to main process.");
  });

  // Send Client Save State
  document
    .getElementById("confirmClientSavestate")
    .addEventListener("click", () => {
      const selectedWorld = document.getElementById(
        "localSaveStateDropdown"
      ).value;
      console.log(consoleName, "Selected world:", selectedWorld);
      ipcRenderer.send("select-client-world", selectedWorld);
      const localPathStatus = document.getElementById("clientWorldStatus");

      localPathStatus.innerHTML = "⌛️";
      startRotation("clientWorldStatus");
      //rotate loading icon

      console.log(consoleName, "Sent selected world to main process.");
    });

  ///////////////////////////////////////////////////
  // RENDERER IN
  ///////////////////////////////////////////////////
  // Recieve & Update User Dropdown
  ipcRenderer.on("steam-users", (event, users, steamPathStatus) => {
    updateDropdown("steamUserDropdown", users);
    const steamStatus = document.getElementById("steamPathStatus");
    if (steamPathStatus) {
      steamStatus.innerHTML = "✔️";
    } else {
      steamStatus.innerHTML = "❌";
    }
    console.log(consoleName, "Received users!", users);
  });

  // Recieve & Update Server Savestate Dropdown
  ipcRenderer.on("worlds", (event, serverSaveStates, localSaveStates) => {
    console.log(consoleName, "Received worlds!");
    console.log(consoleName, "Server:", serverSaveStates);
    console.log(consoleName, "Local:", localSaveStates);
    const steamUserStatus = document.getElementById("steamUserStatus");
    if (localSaveStates.length > 0) {
      steamUserStatus.innerHTML = "✔️";
    } else {
      steamUserStatus.innerHTML = "❌";
    }
    updateDropdown("serverSaveStateDropdown", serverSaveStates);
    updateDropdown("localSaveStateDropdown", localSaveStates);
    //also recieve local worlds here
  });

  // Recieve & Update Steam Status
  ipcRenderer.on("steam-user-status", (event, success) => {
    const status = document.getElementById("steamUserStatus");
    status.innerHTML = "❓";

    if (success) {
      document
        .getElementById("confirmSteamUser")
        .addEventListener("click", () => {
          status.innerHTML = "✔️";
        });
    } else {
      status.innerHTML = "❌";
    }
  });

  // Recieve & Update Client World Status
  ipcRenderer.on("client-world", (event, success) => {
    stopRotation("clientWorldStatus");
    const status = document.getElementById("clientWorldStatus");
    if (success) {
      status.innerHTML = "✔️";
    } else {
      status.innerHTML = "❌";
    }
  });

  // Recieve & Update Loading Bar
  ipcRenderer.on("update-loading-bar", (event, barID, percentComplete) => {
    updateLoadingBar(barID, percentComplete);
  });
});

///////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////

function updateDropdown(dropdownID, itemArray) {
  const dropdown = document.getElementById(dropdownID);
  if (itemArray.length === 0) {
    dropdown.innerHTML = "No entries found.";
    return;
  }

  dropdown.innerHTML = "";
  itemArray.forEach((item) => {
    const option = document.createElement("option");
    option.textContent = item[1];
    option.value = item[0];
    dropdown.appendChild(option);
  });
}

function updateLoadingBar(barID, percentComplete) {
  const bar = document.getElementById(barID);

  if (percentComplete <= 0) {
    bar.style = "display: none;";
  } else {
    bar.style = "display: block;";
  }
  bar.style.width = percentComplete + "%";
}

var rotationIntervals = {};

function startRotation(elementId) {
  var element = document.getElementById(elementId);
  if (!rotationIntervals[elementId]) {
    let degree = 0;
    rotationIntervals[elementId] = setInterval(() => {
      degree += 180;
      element.style.transform = `rotate(${degree}deg)`;
    }, 2000); // Rotation speed adjusted to 1 second for clear visibility
  }
}

function stopRotation(elementId) {
  clearInterval(rotationIntervals[elementId]);
  delete rotationIntervals[elementId];
  var element = document.getElementById(elementId);
  element.style.transition = "transform 1s"; // Add a smooth transition effect
  element.style.transform = "rotate(0deg)"; // Reset rotation to 0 degrees
}

function createSingleEntryField() {
  const dataTransferRows = document.getElementById("dataTransferRows");
  const row = document.createElement("div");
  row.className = "data-transfer-row";
  const header = document.createElement("h5");
  header.className = "data-transfer-row-entry-header";
  header.textContent = "Entry";
  const control = document.createElement("div");
  control.className = "data-transfer-row-control";
  const inputLocal = document.createElement("input");
  inputLocal.className = "world-data-input-field local-world-data-input-field";
  inputLocal.type = "text";
  const buttonToServer = document.createElement("button");
  buttonToServer.className =
    "data-transfer-button data-transfer-button-to-server";
  buttonToServer.textContent = "🡆";
  const buttonToLocal = document.createElement("button");
  buttonToLocal.className =
    "data-transfer-button data-transfer-button-to-local";
  buttonToLocal.textContent = "🡄";
  const inputServer = document.createElement("input");
  inputServer.className =
    "world-data-input-field server-world-data-input-field";
  inputServer.type = "text";
  control.appendChild(inputLocal);
  control.appendChild(buttonToServer);
  control.appendChild(buttonToLocal);
  control.appendChild(inputServer);
  row.appendChild(header);
  row.appendChild(control);
  row.appendChild(document.createElement("hr"));
  dataTransferRows.appendChild(row);
  return row.id;
}
