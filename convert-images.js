// convert-images.js
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Target directory (frontend/public/media)
const targetDir = path.resolve("./frontend/public/media");

async function convertToWebP(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively handle subfolders
      await convertToWebP(filePath);
    } else if (/\.(png|jpe?g)$/i.test(file)) {
      const output = filePath.replace(/\.(png|jpe?g)$/i, ".webp");

      if (fs.existsSync(output)) {
        console.log(`⚡ Skipping (already exists): ${output}`);
        continue;
      }

      console.log(`🖼️  Converting: ${filePath} → ${output}`);

      try {
        await sharp(filePath)
          // Optional: resize images if needed
          // .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(output);
      } catch (err) {
        console.error(`❌ Error converting ${filePath}:`, err.message);
      }
    }
  }
}

convertToWebP(targetDir)
  .then(() => console.log("✅ All images in frontend/public/media converted to WebP!"))
  .catch(console.error);
