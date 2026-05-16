const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const width = 96;
const height = 96;
const raw = Buffer.alloc((width * 4 + 1) * height);

const colors = {
  clear: [0, 0, 0, 0],
  dark: [45, 27, 16, 255],
  wood: [118, 72, 34, 255],
  wood2: [154, 96, 45, 255],
  line: [72, 42, 21, 255],
  gold: [216, 158, 55, 255]
};

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const i = y * (width * 4 + 1) + 1 + x * 4;
  raw[i] = color[0];
  raw[i + 1] = color[1];
  raw[i + 2] = color[2];
  raw[i + 3] = color[3];
}

function fillRect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPixel(xx, yy, color);
  }
}

function drawClosedTile(ox, oy, part) {
  fillRect(ox + 6, oy + 2, 36, 44, colors.dark);
  fillRect(ox + 8, oy + 4, 32, 40, colors.wood);
  for (let i = 0; i < 4; i++) fillRect(ox + 10 + i * 8, oy + 5, 2, 38, colors.wood2);
  fillRect(ox + 10, oy + 12, 28, 2, colors.line);
  fillRect(ox + 10, oy + 34, 28, 2, colors.line);
  fillRect(ox + 6, oy + 2, 2, 44, colors.dark);
  fillRect(ox + 40, oy + 2, 2, 44, colors.dark);
  if (part === 0) fillRect(ox + 33, oy + 27, 5, 5, colors.gold);
}

function drawOpenTile(ox, oy, part) {
  fillRect(ox + 18, oy + 2, 14, 44, colors.dark);
  fillRect(ox + 21, oy + 4, 8, 40, colors.wood2);
  fillRect(ox + 24, oy + 4, 2, 40, colors.wood);
  fillRect(ox + 29, oy + 5, 3, 38, colors.dark);
  fillRect(ox + 21, oy + 12, 8, 2, colors.line);
  fillRect(ox + 21, oy + 34, 8, 2, colors.line);
  if (part === 0) fillRect(ox + 23, oy + 27, 4, 4, colors.gold);
}

for (let y = 0; y < height; y++) raw[y * (width * 4 + 1)] = 0;
drawClosedTile(0, 0, 0);
drawClosedTile(0, 48, 1);
drawOpenTile(48, 0, 0);
drawOpenTile(48, 48, 1);

function crc32(buf) {
  let crc = -1;
  for (const b of buf) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0))
]);

const out = path.join(__dirname, "..", "assets", "generated", "blocks", "door-block-atlas.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(out);
