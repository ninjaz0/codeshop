const { v4: uuidv4 } = require('uuid');

/**
 * Generate a batch of redemption codes with the given face value.
 * Format: XXXX-XXXX-XXXX-XXXX (UUID-based, uppercase)
 */
function generateCodes(count, faceValue) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = uuidv4().replace(/-/g, '').toUpperCase();
    const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
    codes.push({ code, faceValue });
  }
  return codes;
}

module.exports = { generateCodes };
