const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const outputDirectory = path.join(projectRoot, "dist");

const filesToCopy = [
  "index.html",
  "assets",
  "fonts",
  "portfolio",
  "public",
  "src"
];

// Remove the previous build.
fs.rmSync(outputDirectory, {
  recursive: true,
  force: true
});

// Create a fresh dist folder.
fs.mkdirSync(outputDirectory, {
  recursive: true
});

// Copy the website files into dist.
for (const item of filesToCopy) {
  const source = path.join(projectRoot, item);
  const destination = path.join(outputDirectory, item);

  if (fs.existsSync(source)) {
    fs.cpSync(source, destination, {
      recursive: true
    });

    console.log(`Copied: ${item}`);
  } else {
    console.warn(`Skipped missing item: ${item}`);
  }
}

console.log("Website build completed successfully.");