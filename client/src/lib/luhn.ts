/**
 * Luhn Algorithm validation for credit card numbers
 * @param cardNumber - The card number to validate
 * @returns boolean - True if valid, false otherwise
 */
export function validateLuhn(cardNumber: string): boolean {
  // Remove all non-digit characters
  const digits = cardNumber.replace(/\D/g, '');
  
  // Card number must be between 13-19 digits
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  // Loop through values starting from the rightmost digit
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      // If doubling results in a two-digit number, add the digits together
      if (digit > 9) {
        digit = digit - 9;  // Same as: (digit % 10) + Math.floor(digit / 10)
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  // Valid if sum is divisible by 10
  return sum % 10 === 0;
}

// Test function (exported for testing purposes)
export function testLuhnValidation() {
  const validCards = [
    '4532015112830366',  // Valid Visa
    '5425233430109903',  // Valid Mastercard
    '374245455400126',   // Valid Amex (15 digits)
  ];

  const invalidCards = [
    '4532015112830367',  // Invalid (last digit wrong)
    '1234567890123456',  // Invalid
    '0000000000000000',  // Invalid
  ];

  console.log('Testing Luhn validation:');
  validCards.forEach(card => {
    const result = validateLuhn(card);
    console.log(`  ${card}: ${result ? 'VALID ✓' : 'INVALID ✗'} (expected: VALID)`);
  });

  invalidCards.forEach(card => {
    const result = validateLuhn(card);
    console.log(`  ${card}: ${result ? 'VALID ✓' : 'INVALID ✗'} (expected: INVALID)`);
  });
}
