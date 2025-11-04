export function getCurrentRemPixels() : number {
  const rootFontSize = getComputedStyle(document.documentElement).fontSize;
  return parseFloat(rootFontSize);
}