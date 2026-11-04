import { hasMinLength, isValidEmail } from '../validation';

describe('validation', () => {
  it('validates e-mails', () => {
    expect(isValidEmail('jane@example.com')).toBe(true);
    expect(isValidEmail('  jane@example.com ')).toBe(true);
    expect(isValidEmail('jane@')).toBe(false);
    expect(isValidEmail('jane example.com')).toBe(false);
  });

  it('checks minimum length', () => {
    expect(hasMinLength('123456', 6)).toBe(true);
    expect(hasMinLength('12345', 6)).toBe(false);
  });
});
