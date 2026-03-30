export function isAlphabetic(text: string): boolean {
  if (text.length === 0) return false;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;

    if (!isUpper && !isLower) return false;
  }

  return true;
}

export function is_bad_regex(input_array: string[]): boolean {
  for (const pre of input_array) {
    if (pre.length > 4 || !isAlphabetic(pre)) {
      return true;
    }
  }

  return false;
}
