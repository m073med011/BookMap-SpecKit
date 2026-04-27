const arabicTransliterationMap: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "w",
  ي: "y",
  ى: "a",
  ة: "h",
  ء: "a",
  ئ: "y",
  ؤ: "w",
};

function transliterateToLatin(value: string) {
  return Array.from(value)
    .map((character) => arabicTransliterationMap[character] ?? character)
    .join("");
}

export function generateLibrarySlug(name: string): string {
  const transliterated = transliterateToLatin(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
