const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Read config.json
let config = { port: 3001, clientPort: 3000 };
try {
  const configPath = path.join(__dirname, "config.json");
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} catch (e) {
  console.warn("Could not read config.json, using defaults");
}

const backendPort = config.port || 3001;
const clientPort = config.clientPort || 3000;

console.log(`\n🚀 Starting File Browser...`);
console.log(`   Backend: http://localhost:${backendPort}`);
console.log(`   Frontend: http://localhost:${clientPort}\n`);

// Start backend
const backend = spawn("node", ["server.js"], {
  stdio: "inherit",
  shell: true,
});

// Start frontend with PORT env variable
const frontend = spawn("npm", ["start"], {
  cwd: path.join(__dirname, "client"),
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    PORT: clientPort,
    BROWSER: "none", // Optional: don't auto-open browser
  },
});

// Handle exit
process.on("SIGINT", () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
