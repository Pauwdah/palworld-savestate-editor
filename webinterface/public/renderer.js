///////////////////////////////////////////////////
// IMPORTS
///////////////////////////////////////////////////
const { ipcRenderer } = require("electron");
const consoleName = "\x1b[38;5;219m Renderer: \x1b[0m";

///////////////////////////////////////////////////
// RENDERER <--IPC--> MAIN PROCESS
///////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function () {
  ///////////////////////////////////////////////////
  // RENDERER OUT
  ///////////////////////////////////////////////////

  //Send Auto Setup
  document.getElementById("autoSetup").addEventListener("click", () => {
    ipcRenderer.send("auto-setup");
    console.log(consoleName, "Sent message to main process.");
  });

  //Send Steam Directory
  document.getElementById("selectSteamDir").addEventListener("click", () => {
    ipcRenderer.send("select-steam-directory"); // Send message to main process
    console.log(consoleName, "Sent message to main process.");
  });

  //Send Steam User
  document.getElementById("confirmSteamUser").addEventListener("click", () => {
    const selectedUser = document.getElementById("steamUserDropdown").value;
    console.log(consoleName, "Selected user:", selectedUser);
    ipcRenderer.send("select-steam-user", selectedUser);
    console.log(consoleName, "Sent selected user to main process.");
  });

  ///////////////////////////////////////////////////
  // RENDERER IN
  ///////////////////////////////////////////////////

  //Recieve & Update User Dropdown
  ipcRenderer.on("steam-users", (event, users) => {
    updateDropdown("steamUserDropdown", users);
    console.log(consoleName, "Received users!", users);
  });

  //Recieve & Update Server Savestate Dropdown
  ipcRenderer.on("worlds", (event, serverSaveStates, localSaveStates) => {
    console.log(consoleName, "Received worlds!");
    console.log(consoleName, "Server:", serverSaveStates);
    console.log(consoleName, "Local:", localSaveStates);
    // if local worlds are found set status of localPathStatus div to ✔️
    // if no local worlds are found set status of localPathStatus div to ❌

    const localPathStatus = document.getElementById("localPathStatus");
    if (localSaveStates.length > 0) {
      localPathStatus.innerHTML = "✔️";
    } else {
      localPathStatus.innerHTML = "❌";
    }

    updateDropdown("serverSaveStateDropdown", serverSaveStates);
    updateDropdown("localSaveStateDropdown", localSaveStates);
    //also recieve local worlds here
  });

  //Recieve & Update Steam Status
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
