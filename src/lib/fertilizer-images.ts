import urea from "@/assets/fert-urea.jpg";
import dap from "@/assets/fert-dap.jpg";
import npk from "@/assets/fert-npk.jpg";
import neem from "@/assets/fert-neem.jpg";
import pesticide from "@/assets/fert-pesticide.jpg";
import compost from "@/assets/fert-compost.jpg";

const RULES: { img: string; keys: string[] }[] = [
  { img: urea, keys: ["urea", "nitrogen", "యూరియా", "यूरिया"] },
  { img: dap, keys: ["dap", "phosphate", "ssp", "phosphorus", "డిఎపి"] },
  { img: npk, keys: ["npk", "19:19", "potash", "mop", "sop", "potassium", "12:32", "20:20", "micronutrient", "zinc", "boron", "sulphate"] },
  { img: neem, keys: ["neem", "organic", "bio", "panchagavya", "jeevamrutham", "వేప"] },
  { img: compost, keys: ["compost", "vermi", "manure", "fym", "humic", "కంపోస్ట్"] },
  { img: pesticide, keys: ["pesticide", "insecticide", "fungicide", "spray", "mancozeb", "copper", "sulfur", "carbendazim", "imidacloprid", "chlorpyrifos", "herbicide", "weedicide"] },
];

export function fertilizerImage(product: string): string {
  const q = product.toLowerCase();
  for (const r of RULES) if (r.keys.some((k) => q.includes(k))) return r.img;
  return npk;
}
