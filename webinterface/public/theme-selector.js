// Initialize current theme setting
let currentThemeSetting = localStorage.getItem("theme") || "light";

// Function to toggle theme
function toggleTheme() {
  const newTheme = currentThemeSetting === "dark" ? "light" : "dark";
  currentThemeSetting = newTheme;

  // Update icons
  document.getElementById("light-icon").style.display = newTheme === "light" ? "inline" : "none";
  document.getElementById("dark-icon").style.display = newTheme === "dark" ? "inline" : "none";

  // Update theme attribute on HTML to switch theme in CSS
  document.querySelector("html").setAttribute("data-theme", newTheme);

  // Update in local storage
  localStorage.setItem("theme", newTheme);
}

function loadThemeFromLocalStorage() {
  const theme = localStorage.getItem("theme");
  if (theme) {
    document.querySelector("html").setAttribute("data-theme", theme);
    currentThemeSetting = theme;
    document.getElementById("light-icon").style.display = theme === "light" ? "inline" : "none";
    document.getElementById("dark-icon").style.display = theme === "dark" ? "inline" : "none";
  }
}

// Add event listener to the toggle button
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

// On page load, set the theme based on local storage
loadThemeFromLocalStorage();
