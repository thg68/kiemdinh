import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const source = resolve(process.argv[2] ?? "app/icon.png");
const destination = resolve(process.argv[3] ?? "app/favicon.ico");
const sizes = [16, 32, 48];

const images = await Promise.all(
  sizes.map((size) =>
    sharp(source)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer(),
  ),
);

const headerSize = 6 + images.length * 16;
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

let imageOffset = headerSize;
images.forEach((image, index) => {
  const size = sizes[index];
  const entryOffset = 6 + index * 16;
  header.writeUInt8(size === 256 ? 0 : size, entryOffset);
  header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
  header.writeUInt8(0, entryOffset + 2);
  header.writeUInt8(0, entryOffset + 3);
  header.writeUInt16LE(1, entryOffset + 4);
  header.writeUInt16LE(32, entryOffset + 6);
  header.writeUInt32LE(image.length, entryOffset + 8);
  header.writeUInt32LE(imageOffset, entryOffset + 12);
  imageOffset += image.length;
});

await writeFile(destination, Buffer.concat([header, ...images]));
console.log(`Đã tạo ${destination} với các kích thước ${sizes.join(", ")} px.`);
