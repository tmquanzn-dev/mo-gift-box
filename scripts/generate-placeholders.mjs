/**
 * Sinh ảnh placeholder SVG cho sản phẩm, dịp, món lẻ và hero.
 * Chạy: npm run images
 *
 * Khi có ảnh thật: đặt file vào public/images/... cùng tên (có thể đổi đuôi .jpg/.webp)
 * rồi cập nhật đường dẫn ảnh trong prisma/seed.ts hoặc trực tiếp trong database.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJSON = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const out = (p, svg) => {
  const file = join(root, "public", p);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg, "utf8");
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const THEMES = {
  hong: "#E8A0B4",
  do: "#C8323C",
  "xanh-duong": "#5B8DC9",
  "xanh-la": "#7FA77A",
  vang: "#E9C46A",
  kraft: "#B08657",
  tim: "#9C82C4",
};
const KRAFT = "#C8A27A";
const KRAFT_DARK = "#A9835B";
const CREAM = "#F5EBDD";
const BROWN = "#6B3E26";

const label = (w, h, text = "Ảnh minh hoạ · Thay bằng ảnh thật") => `
  <g>
    <rect x="${w / 2 - 170}" y="${h - 58}" width="340" height="34" rx="17" fill="#FFFAF3" fill-opacity="0.92" stroke="${KRAFT}"/>
    <text x="${w / 2}" y="${h - 36}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" fill="${BROWN}">${esc(text)}</text>
  </g>`;

const straw = (x, y, w, color) =>
  Array.from({ length: 26 }, (_, i) => {
    const sx = x + ((i * 37) % w);
    const sy = y + ((i * 13) % 24);
    return `<path d="M${sx} ${sy} q 14 -10 28 2" stroke="${i % 3 === 0 ? color : "#D9BE98"}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }).join("");

const bow = (cx, cy, color, s = 1) => `
  <g transform="translate(${cx} ${cy}) scale(${s})">
    <path d="M0 0 C -30 -40 -90 -50 -95 -15 C -98 15 -40 20 0 0 Z" fill="${color}"/>
    <path d="M0 0 C 30 -40 90 -50 95 -15 C 98 15 40 20 0 0 Z" fill="${color}"/>
    <path d="M-6 4 L -40 70 L -22 64 L -14 82 L 2 8 Z" fill="${color}" opacity="0.9"/>
    <path d="M6 4 L 40 70 L 22 64 L 14 82 L -2 8 Z" fill="${color}" opacity="0.9"/>
    <circle r="14" fill="${color}" stroke="#00000020" stroke-width="3"/>
  </g>`;

function bg(w, h, tint) {
  return `
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="#FFFAF3"/>
      <stop offset="1" stop-color="${CREAM}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w * 0.85}" cy="${h * 0.15}" r="${w * 0.16}" fill="${tint}" opacity="0.12"/>
  <circle cx="${w * 0.12}" cy="${h * 0.8}" r="${w * 0.12}" fill="${tint}" opacity="0.1"/>`;
}

function closedBox(color, w = 800, h = 800) {
  return `
  <ellipse cx="400" cy="640" rx="250" ry="26" fill="${BROWN}" opacity="0.12"/>
  <rect x="170" y="330" width="460" height="300" rx="10" fill="${KRAFT}"/>
  <rect x="150" y="280" width="500" height="80" rx="10" fill="${KRAFT_DARK}"/>
  <rect x="370" y="280" width="60" height="350" fill="${color}"/>
  <rect x="150" y="300" width="500" height="34" fill="${color}" opacity="0.95"/>
  ${bow(400, 280, color, 1.25)}
  <rect x="470" y="430" width="120" height="78" rx="6" fill="#FFFAF3" transform="rotate(-6 530 470)"/>
  <text x="530" y="478" text-anchor="middle" transform="rotate(-6 530 470)" font-family="Georgia, serif" font-size="30" font-weight="700" fill="${BROWN}">mó</text>`;
}

function openBox(color) {
  return `
  <ellipse cx="400" cy="650" rx="260" ry="26" fill="${BROWN}" opacity="0.12"/>
  <rect x="520" y="200" width="240" height="70" rx="8" fill="${KRAFT_DARK}" transform="rotate(18 640 235)"/>
  <rect x="615" y="200" width="44" height="70" fill="${color}" transform="rotate(18 640 235)"/>
  <rect x="150" y="390" width="440" height="250" rx="10" fill="${KRAFT}"/>
  <path d="M150 390 h440 l-30 40 h-380 z" fill="${KRAFT_DARK}"/>
  ${straw(170, 360, 400, color)}
  <rect x="210" y="300" width="70" height="120" rx="12" fill="${color}"/>
  <circle cx="335" cy="345" r="48" fill="#7B4A2E"/>
  <circle cx="335" cy="345" r="30" fill="#9A6440"/>
  <rect x="400" y="290" width="56" height="130" rx="8" fill="#FFFAF3" stroke="${color}" stroke-width="5"/>
  <circle cx="510" cy="350" r="40" fill="${color}" opacity="0.75"/>
  <path d="M500 300 q 20 -40 40 -10" stroke="#7FA77A" stroke-width="6" fill="none"/>`;
}

function closeup(color) {
  const items = [
    [220, 300, 90, "#7B4A2E"],
    [400, 260, 70, color],
    [560, 320, 80, "#E9C46A"],
    [300, 470, 75, color],
    [480, 480, 95, "#9A6440"],
  ]
    .map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#FFFFFF" opacity="0.35"/>`)
    .join("");
  return `${straw(80, 560, 640, color)}${straw(80, 600, 640, color)}${items}`;
}

function svg(w, h, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;
}

/* ---------- Sản phẩm: 3 góc chụp ---------- */
const products = readJSON("data/products.json");
for (const p of products) {
  const color = THEMES[p.colorThemes[0]] ?? KRAFT;
  out(`images/products/${p.slug}-1.svg`, svg(800, 800, bg(800, 800, color) + closedBox(color) + label(800, 800, "Hộp đóng · Thay bằng ảnh thật")));
  out(`images/products/${p.slug}-2.svg`, svg(800, 800, bg(800, 800, color) + openBox(color) + label(800, 800, "Hộp mở · Thay bằng ảnh thật")));
  out(`images/products/${p.slug}-3.svg`, svg(800, 800, bg(800, 800, color) + closeup(color) + label(800, 800, "Cận cảnh món bên trong · Thay bằng ảnh thật")));
}
out("images/products/tu-thiet-ke-1.svg", svg(800, 800, bg(800, 800, KRAFT) + openBox("#C8A27A") + label(800, 800, "Hộp tự thiết kế · Thay bằng ảnh thật")));

/* ---------- Dịp ---------- */
const OCC_COLORS = {
  "20-10": THEMES.hong,
  "20-11": THEMES["xanh-la"],
  "giang-sinh": THEMES.do,
  "sinh-nhat": THEMES.vang,
  "ky-yeu": THEMES["xanh-duong"],
  valentine: THEMES.do,
  "tot-nghiep": THEMES["xanh-duong"],
};
for (const o of readJSON("data/occasions.json")) {
  const color = OCC_COLORS[o.slug] ?? KRAFT;
  const body = `${bg(800, 600, color)}
  <g transform="translate(150 20) scale(0.62)">${closedBox(color)}</g>
  <text x="400" y="110" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="700" fill="${BROWN}" opacity="0.18">${esc(o.shortName)}</text>
  ${label(800, 600)}`;
  out(`images/occasions/${o.slug}.svg`, svg(800, 600, body));
}

/* ---------- Món lẻ cho hộp tự thiết kế ---------- */
const ITEM_COLORS = ["#7B4A2E", THEMES.hong, THEMES.vang, THEMES["xanh-la"], THEMES["xanh-duong"], THEMES.do, THEMES.tim];
readJSON("data/box-items.json").forEach((item, i) => {
  const c = ITEM_COLORS[i % ITEM_COLORS.length];
  const body = `<rect width="400" height="400" fill="#FFFAF3"/>
  <circle cx="200" cy="175" r="105" fill="${c}" opacity="0.2"/>
  <rect x="140" y="110" width="120" height="130" rx="22" fill="${c}"/>
  <rect x="140" y="150" width="120" height="22" fill="#FFFAF3" opacity="0.6"/>
  <text x="200" y="320" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="${BROWN}">${esc(item.name)}</text>
  <text x="200" y="356" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#6E5E52">Thay bằng ảnh thật</text>`;
  out(`images/items/${item.id}.svg`, svg(400, 400, body));
});

/* ---------- Hero ---------- */
const hero = `${bg(1000, 1100, THEMES.hong)}
  <circle cx="520" cy="560" r="400" fill="${KRAFT}" opacity="0.18"/>
  <g transform="translate(40 120) scale(1.15)">${closedBox(THEMES.hong)}</g>
  <g transform="translate(540 620) scale(0.5)">${closedBox(THEMES.do)}</g>
  <g transform="translate(60 690) scale(0.42)">${closedBox(THEMES["xanh-duong"])}</g>
  ${label(1000, 1100, "Ảnh hero · Thay bằng ảnh hộp quà thật")}`;
out("images/hero.svg", svg(1000, 1100, hero));

/* ---------- Minh hoạ các bước mua hàng ---------- */
const STEP_ICONS = [
  `<rect x="130" y="150" width="140" height="110" rx="10" fill="${KRAFT}"/><rect x="190" y="150" width="20" height="110" fill="${THEMES.hong}"/>${bow(200, 150, THEMES.hong, 0.55)}`,
  `<rect x="120" y="120" width="160" height="180" rx="12" fill="#FCE8EE"/><path d="M150 170h100M150 205h100M150 240h60" stroke="${BROWN}" stroke-width="10" stroke-linecap="round"/>`,
  `<rect x="110" y="130" width="180" height="140" rx="16" fill="${BROWN}"/><rect x="110" y="165" width="180" height="26" fill="#2B1D14"/><rect x="130" y="220" width="60" height="18" rx="6" fill="${KRAFT}"/>`,
  `<rect x="90" y="160" width="140" height="90" rx="10" fill="${KRAFT}"/><path d="M230 185h50l30 35v30h-80z" fill="${KRAFT_DARK}"/><circle cx="135" cy="260" r="20" fill="${BROWN}"/><circle cx="270" cy="260" r="20" fill="${BROWN}"/>`,
];
STEP_ICONS.forEach((icon, i) => {
  out(`images/steps/buoc-${i + 1}.svg`, svg(400, 400, `<rect width="400" height="400" rx="40" fill="#FFFAF3"/><circle cx="200" cy="205" r="150" fill="${CREAM}"/>${icon}<text x="200" y="370" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#6E5E52">Minh hoạ · Thay bằng ảnh thật</text>`));
});

console.log(`Đã tạo ảnh placeholder cho ${products.length} sản phẩm, dịp, món lẻ, hero và các bước.`);
