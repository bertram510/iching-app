/**
 * I Ching Divination Core Logic
 */

// Simulates a single coin toss (heads = 3, tails = 2)
export function tossCoin() {
  return Math.random() < 0.5 ? 2 : 3;
}

// Simulates tossing 3 coins
export function tossThreeCoins() {
  const c1 = tossCoin();
  const c2 = tossCoin();
  const c3 = tossCoin();
  return c1 + c2 + c3;
}

// Generates 6 lines from bottom (index 0) to top (index 5)
export function generateHexagram() {
  const lines = [];
  for (let i = 0; i < 6; i++) {
    lines.push(tossThreeCoins());
  }
  return lines;
}

// Evaluates lines to get the present (base) hexagram and future (changed) hexagram.
// Line values:
// 6: Old Yin (Changing Yin) -> Present: Yin (0), Future: Yang (1)
// 7: Young Yang (Unchanging Yang) -> Present: Yang (1), Future: Yang (1)
// 8: Young Yin (Unchanging Yin) -> Present: Yin (0), Future: Yin (0)
// 9: Old Yang (Changing Yang) -> Present: Yang (1), Future: Yin (0)

export function getHexagramData(lines) {
  const presentBinary = lines.map(val => (val === 7 || val === 9) ? 1 : 0);
  const futureBinary = lines.map(val => (val === 7 || val === 6) ? 1 : 0);
  
  // Create binary string for standard lookup: Bottom to Top or Top to Bottom?
  // Traditionally, line 1 is bottom. Binary representations usually read top to bottom or bottom to top.
  // The i-ching npm package uses top to bottom as "111111".
  // Let's keep our lines array where index 0 is bottom.
  
  return {
    lines,
    presentBinary,
    futureBinary,
    isChanging: lines.some(val => val === 6 || val === 9),
    changingLines: lines.map((val, idx) => (val === 6 || val === 9) ? idx + 1 : null).filter(val => val !== null)
  };
}
