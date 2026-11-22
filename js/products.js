const DISCOUNT = 0.3;
const PROMO_CODE = "CJRBF30";
const DEADLINE = Date.UTC(2026, 11, 26, 4, 59, 59);
const DEADLINE_TEXT = "Friday, December 25 at 11:59 PM";
const PICKUP_PLACE = "the 203 Hockey Shop at Chelsea Piers Connecticut";
const ORDER_URL = "";
const SHOP_CHECKOUT = "https://203hockeyshop.com";

const CARDS = [
  {
    id: "pants",
    name: "CCM Tacks C Hockey Pants",
    short: ["CCM Tacks C", "Hockey Pants", "CJR Crest"],
    tag: "CJR team pants",
    image: "img/ccm-tacks-pants-cjr.webp",
    dark: true,
    description: "Red CCM Tacks C hockey pants with the CT Junior Rangers crest and team striping. Youth, junior and senior sizes, plus the senior Tacks +C.",
    picker: [["level", "Model"], ["size", "Size"]]
  },
  {
    id: "helmets",
    name: "CCM Tacks Helmets",
    short: ["CCM Tacks", "Helmets", "720 / 710 / 920"],
    tag: "Helmets",
    image: "img/ccm-tacks-720-helmet.webp",
    images: { "CCM Tacks 920 Helmet": "img/ccm-tacks-920-helmet.webp" },
    description: "Royal blue CCM Tacks helmets, a match for CJR colors. Choose the Tacks 720, 710 or 920.",
    picker: [["name", "Model"], ["size", "Size"]]
  },
  {
    id: "gloves",
    name: "CCM HG95T Gloves",
    short: ["CCM", "HG95T", "Gloves"],
    tag: "CJR gloves",
    image: "img/ccm-pro-4-roll-gloves.webp",
    dark: true,
    description: "CCM HG95T gloves in CJR blue. Sizes 10 to 15 inches.",
    picker: [["size", "Size"]]
  },
  {
    id: "bottle",
    name: "CJR Water Bottle",
    short: ["CJR", "Water", "Bottle"],
    tag: "Made by a CJR family",
    image: "img/cjr-bottle.webp",
    flat: true,
    description: "White insulated bottle with the CT Junior Rangers crest on the front. Add your player's jersey on the back with their last name and number.",
    picker: [["level", "Design"]]
  },
  {
    id: "mug",
    name: "CJR Travel Mug",
    short: ["CJR", "Travel", "Mug"],
    tag: "Made by a CJR family",
    image: "img/cjr-mug.webp",
    flat: true,
    description: "Light blue travel tumbler with CJR Hockey on the front. Add your player's jersey on the back with their last name and number.",
    picker: [["level", "Design"]]
  },
  {
    id: "sticks",
    name: "CCM Sticks",
    short: ["CCM", "Hockey", "Sticks"],
    tag: "Sticks",
    image: "img/ccm-jetspeed-stick.webp",
    description: "Jetspeed, Ribcor, XF Ghost and Tacks sticks in youth, junior, intermediate and senior. Pick a hand, then filter by size, flex and curve."
  }
];

function unitPrice(s) {
  return s.flat ? s.regular : salePrice(s.regular);
}

function salePrice(regular) {
  return regular == null ? null : Math.round(regular * (1 - DISCOUNT) * 100) / 100;
}

function shortName(value) {
  return String(value).replace(/^CCM /, "").replace(/ Helmet$/, "");
}
