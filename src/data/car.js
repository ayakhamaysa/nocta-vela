// Everything about the car: its choices, prices and numbers.
// NOCTA VELA is a fictional concept car made for a portfolio.
// To add a choice: copy one line, give it a new id, set its colors and price.

export const brand = {
  name: "NOCTA",
  model: "VELA",
  whatsapp: "971500000000", // the showroom's WhatsApp number (country code, no + or spaces)
  basePrice: 189000, // in dollars
};

// Body paint. metal: how metallic, rough: how blurry the reflections are, coat: clear-coat shine
export const paints = [
  { id: "carmine", en: "Carmine Red", ar: "أحمر قرمزي", color: "#8a0714", metal: 0.55, rough: 0.3, coat: 1, price: 0 },
  { id: "obsidian", en: "Obsidian Black", ar: "أسود أوبسيديان", color: "#0b0c0e", metal: 0.6, rough: 0.28, coat: 1, price: 4800 },
  { id: "glacier", en: "Glacier White", ar: "أبيض جليدي", color: "#d9dcdf", metal: 0.25, rough: 0.32, coat: 1, price: 2400 },
  { id: "abyss", en: "Abyss Blue", ar: "أزرق عميق", color: "#0c2346", metal: 0.65, rough: 0.28, coat: 1, price: 4800 },
  { id: "verde", en: "Racing Verde", ar: "أخضر سباق", color: "#0f3a2a", metal: 0.6, rough: 0.3, coat: 1, price: 4800 },
  { id: "titan", en: "Matte Titanium", ar: "تيتانيوم مطفي", color: "#5d6166", metal: 0.7, rough: 0.62, coat: 0, price: 9600 },
];

// Roof, mirrors and lower panels
export const accents = [
  { id: "gloss", en: "Gloss Black", ar: "أسود لامع", color: "#08090a", metal: 0.4, rough: 0.2, price: 0 },
  { id: "body", en: "Body colour", ar: "نفس لون الجسم", color: null, metal: 0, rough: 0, price: 0 },
  { id: "carbon", en: "Exposed carbon", ar: "كربون مكشوف", color: "#16171a", metal: 0.2, rough: 0.35, price: 7200 },
];

// Wheel finish (the shiny part of the rims)
export const wheels = [
  { id: "chrome", en: "Liquid Chrome", ar: "كروم سائل", color: "#e8eaee", metal: 1, rough: 0.05, price: 0 },
  { id: "black", en: "Satin Black", ar: "أسود ساتان", color: "#1a1b1e", metal: 0.8, rough: 0.35, price: 1800 },
  { id: "bronze", en: "Forged Bronze", ar: "برونز مطروق", color: "#8a6a3f", metal: 1, rough: 0.25, price: 3600 },
];

// Brake calipers
export const calipers = [
  { id: "red", en: "Rosso", ar: "أحمر", color: "#a0101a", price: 0 },
  { id: "yellow", en: "Giallo", ar: "أصفر", color: "#e0a812", price: 900 },
  { id: "blue", en: "Electric Blue", ar: "أزرق كهربائي", color: "#1e5bd6", price: 900 },
  { id: "black", en: "Stealth Black", ar: "أسود", color: "#111214", price: 0 },
];

// Seats and door cards
export const interiors = [
  { id: "carmine", en: "Carmine Leather", ar: "جلد قرمزي", color: "#5e0a12", price: 0 },
  { id: "ivory", en: "Ivory Leather", ar: "جلد عاجي", color: "#d8cdb8", price: 2900 },
  { id: "cognac", en: "Cognac Leather", ar: "جلد كونياك", color: "#6b3a1b", price: 2900 },
  { id: "onyx", en: "Onyx Alcantara", ar: "ألكانتارا أسود", color: "#141416", price: 1500 },
];

export const groups = [
  { key: "paint", list: paints },
  { key: "accent", list: accents },
  { key: "wheels", list: wheels },
  { key: "caliper", list: calipers },
  { key: "interior", list: interiors },
];

export const defaults = { paint: "carmine", accent: "gloss", wheels: "chrome", caliper: "red", interior: "carmine" };

export const find = (list, id) => list.find((o) => o.id === id) ?? list[0];

export const totalPrice = (c) => brand.basePrice + groups.reduce((sum, g) => sum + find(g.list, c[g.key]).price, 0);

export const money = (n) => "$" + n.toLocaleString("en-US");
