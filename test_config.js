try {
  const config = require("./metro.config.js");
  console.log("Successfully loaded metro.config.js");
} catch (error) {
  console.error("Failed to load metro.config.js:", error);
}
