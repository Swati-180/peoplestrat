/**
 * Checks if a value is a valid number (not null, undefined, NaN, or Infinity).
 * Also parses valid numeric strings.
 */
function getValidNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return null;
    return num;
}

/**
 * Formats a value as a percentage.
 * Maximum 2 decimal places. Includes % sign.
 * Example: 58.333333 -> 58.33%
 * @param {number|string} value - The value to format.
 * @param {boolean} isRatio - If true, multiplies by 100 before formatting.
 */
export function formatPercentage(value, isRatio = false) {
    let num = getValidNumber(value);
    if (num === null) return '—';
    if (isRatio) num *= 100;
    return `${Number(num.toFixed(2))}%`;
}

/**
 * Formats a score.
 * Maximum 2 decimal places. Indicates out of what base.
 * Example: 85.5 -> 85.5 / 100
 */
export function formatScore(value, outOf = 100) {
    const num = getValidNumber(value);
    if (num === null) return '—';
    return `${Number(num.toFixed(2))} / ${outOf}`;
}

/**
 * Formats hours.
 * Maximum 2 decimal places. Appends 'hrs'.
 * Example: 46.279268 -> 46.28 hrs
 */
export function formatHours(value) {
    const num = getValidNumber(value);
    if (num === null) return '—';
    return `${Number(num.toFixed(2))} hrs`;
}

/**
 * Formats a count (whole numbers).
 * Example: 123.00 -> 123
 */
export function formatCount(value) {
    const num = getValidNumber(value);
    if (num === null) return '—';
    return Math.round(num).toString();
}

/**
 * Generic decimal formatting.
 * Maximum 2 decimal places.
 */
export function formatDecimal(value) {
    const num = getValidNumber(value);
    if (num === null) return '—';
    return Number(num.toFixed(2)).toString();
}
