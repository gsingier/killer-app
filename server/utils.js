import { randomBytes } from 'crypto';

// Generates random alphanumeric ID
export function cryptoRandomString(length = 12) {
  return randomBytes(length).toString('hex').slice(0, length);
}

// Generates 4-digit secret code for player validation
export function generateSecretCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generates short game code like KILL-8492
export function generateGameCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KILL-${num}`;
}

// Fisher-Yates shuffle algorithm
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
