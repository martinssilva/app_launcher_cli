import { checkExpiry, isValidCardNumber } from '../schemas';

describe('checkout validation', () => {
  it('validates card numbers with the Luhn checksum', () => {
    expect(isValidCardNumber('4242 4242 4242 4242')).toBe(true);
    expect(isValidCardNumber('4000000000000002')).toBe(true);
    expect(isValidCardNumber('4242 4242 4242 4241')).toBe(false);
    expect(isValidCardNumber('4242')).toBe(false);
    expect(isValidCardNumber('')).toBe(false);
  });

  it('checks the expiry date', () => {
    const now = new Date(2026, 10, 5); // November 2026
    expect(checkExpiry('11/26', now)).toBe('valid');
    expect(checkExpiry('01/30', now)).toBe('valid');
    expect(checkExpiry('10/26', now)).toBe('expired');
    expect(checkExpiry('13/27', now)).toBe('invalid');
    expect(checkExpiry('1/27', now)).toBe('invalid');
    expect(checkExpiry('', now)).toBe('invalid');
  });
});
