/**
 * Formats a number into a currency string with Indian rupee symbol and context-based suffixes (K, L, Cr).
 *
 * @param {number | null | undefined} num - The number to format.
 * @returns {string} The formatted currency string.
 */
const formatCurrencyByContext = (num) => {
  if (num === null || num === undefined || typeof num !== 'number' || isNaN(num)) {
    return "₹0";
  }

  if (num < 1000) {
    return `₹${num}`;
  }

  if (num < 100000) { // Less than 1 Lakh
    const thousands = num / 1000;
    return `₹${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)}K`;
  }

  if (num < 10000000) { // Less than 1 Crore
    const lakhs = num / 100000;
    return `₹${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 2)}L`;
  }

  const crores = num / 10000000;
  return `₹${crores.toFixed(crores % 1 === 0 ? 0 : 2)}Cr`;
};

// Export the function if using modules, or make it available globally
// For example, if using CommonJS:
// module.exports = formatCurrencyByContext;
// Or for ES modules:
// export default formatCurrencyByContext;
// For now, let's assume it might be used in a browser or simple script context
// where it might be attached to a global object or used directly in the same file.
// If this were part of a larger project, module exports would be standard.

// Example Usage (for testing purposes, can be removed or commented out)
// console.log(formatCurrencyByContext(500));      // ₹500
// console.log(formatCurrencyByContext(1000));     // ₹1K
// console.log(formatCurrencyByContext(5500));     // ₹5.5K
// console.log(formatCurrencyByContext(100000));   // ₹1L
// console.log(formatCurrencyByContext(123000));   // ₹1.23L
// console.log(formatCurrencyByContext(9900000));  // ₹99L
// console.log(formatCurrencyByContext(10000000)); // ₹1Cr
// console.log(formatCurrencyByContext(12345678)); // ₹1.23Cr
// console.log(formatCurrencyByContext(null));       // ₹0
// console.log(formatCurrencyByContext(undefined));  // ₹0
// console.log(formatCurrencyByContext("abc"));    // ₹0
// console.log(formatCurrencyByContext(NaN));        // ₹0
// console.log(formatCurrencyByContext(1000.50));  // ₹1K
// console.log(formatCurrencyByContext(123450));   // ₹1.23L
// console.log(formatCurrencyByContext(12350000)); // ₹1.24Cr (rounding example)
// console.log(formatCurrencyByContext(9999999));  // ₹99.99L (rounding example for lakhs)
