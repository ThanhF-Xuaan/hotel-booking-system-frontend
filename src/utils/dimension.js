/**
 * Normalizes dimension strings (e.g. bed sizes) into a standard format: "XmY x ZmW".
 * Examples:
 * - '1m8x2m'   => '1m8 x 2m'
 * - '1.8 x 2'   => '1m8 x 2m'
 * - '1m8X2m'   => '1m8 x 2m'
 * - '180 x 200' => '1m8 x 2m'
 * - '100x200'   => '1m x 2m'
 *
 * @param {string} input - The raw input string
 * @returns {string|null} - The normalized string, or null if the input format is unrecognizable
 */
export const normalizeDimensionString = (input) => {
  if (!input) return '';
  
  // Clean string: trim, convert to lower case, and remove all white spaces
  const clean = input.trim().toLowerCase().replace(/\s+/g, '');
  
  // Split using case-insensitive separator x or *
  const parts = clean.split(/[x\*]/);
  if (parts.length !== 2) return null; // Must contain exactly two dimensions
  
  const normalizePart = (part) => {
    // Strip trailing common units
    const numericPart = part.replace(/(?:cm|mm|inch|inches|in)$/, '');
    
    // Pattern 1: XmY (e.g. 1m8)
    const mPattern = /^(\d+)m(\d+)$/.exec(numericPart);
    if (mPattern) {
      const whole = parseInt(mPattern[1], 10);
      const frac = mPattern[2].replace(/0+$/, ''); // Trim trailing zeros
      return frac ? `${whole}m${frac}` : `${whole}m`;
    }
    
    // Pattern 2: Decimal X.Y (e.g. 1.8)
    const decimalPattern = /^(\d+)\.(\d+)$/.exec(numericPart);
    if (decimalPattern) {
      const whole = parseInt(decimalPattern[1], 10);
      const frac = decimalPattern[2].replace(/0+$/, ''); // Trim trailing zeros
      return frac ? `${whole}m${frac}` : `${whole}m`;
    }
    
    // Pattern 3: Integer X (e.g. 2 or 2m or 180)
    const intPattern = /^(\d+)m?$/.exec(numericPart);
    if (intPattern) {
      const val = parseInt(intPattern[1], 10);
      if (val >= 10) {
        // Assume centimeters, convert to meters
        const meters = val / 100;
        const whole = Math.floor(meters);
        const frac = (val % 100).toString().replace(/0+$/, '');
        return frac ? `${whole}m${frac}` : `${whole}m`;
      } else {
        // Less than 10, treat as meters directly
        return `${val}m`;
      }
    }
    
    return null; // Unrecognizable format
  };
  
  const w = normalizePart(parts[0]);
  const h = normalizePart(parts[1]);
  
  if (!w || !h) return null; // One or both parts could not be normalized
  
  return `${w} x ${h}`;
};

/**
 * Parses normalized dimension strings back into numeric values (meters) for width and height.
 * Examples:
 * - '1m8 x 2m'   => { width: 1.8, height: 2 }
 * - '1m25 x 2m'  => { width: 1.25, height: 2 }
 * - '1m x 2m'    => { width: 1, height: 2 }
 * - '2m05 x 2m'  => { width: 2.05, height: 2 }
 *
 * @param {string} sizeStr - The normalized stored size string
 * @returns {object|null} - An object containing parsed float values, or null if unrecognizable
 */
export const parseDimensionString = (sizeStr) => {
  if (!sizeStr) return null;
  const clean = sizeStr.trim().toLowerCase().replace(/\s+/g, '');
  const parts = clean.split(/[x\*]/);
  if (parts.length !== 2) return null;
  
  const parsePart = (part) => {
    const numericPart = part.replace(/(?:cm|mm|inch|inches|in)$/, '');
    
    // Check pattern XmY (e.g. 1m8)
    const mPattern = /^(\d+)m(\d+)$/.exec(numericPart);
    if (mPattern) {
      const whole = parseInt(mPattern[1], 10);
      const fracStr = mPattern[2];
      const frac = parseInt(fracStr, 10);
      return whole + frac / Math.pow(10, fracStr.length);
    }
    
    // Check pattern X.Y (e.g. 1.8)
    const decimalPattern = /^(\d+)\.(\d+)$/.exec(numericPart);
    if (decimalPattern) {
      const whole = parseInt(decimalPattern[1], 10);
      const fracStr = decimalPattern[2];
      const frac = parseInt(fracStr, 10);
      return whole + frac / Math.pow(10, fracStr.length);
    }
    
    // Check pattern Xm or X (e.g. 2m, 2)
    const intPattern = /^(\d+)m?$/.exec(numericPart);
    if (intPattern) {
      return parseInt(intPattern[1], 10);
    }
    
    return null;
  };
  
  const width = parsePart(parts[0]);
  const height = parsePart(parts[1]);
  
  if (width === null || height === null) return null;
  return { width, height };
};
