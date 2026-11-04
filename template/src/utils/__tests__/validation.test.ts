import { i18n } from '@/i18n';

import { createFieldSchemas, PASSWORD_MIN_LENGTH } from '../validation';

const fields = createFieldSchemas(i18n.t);

const messageOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('createFieldSchemas', () => {
  it('trims and validates e-mails', () => {
    expect(fields.email.parse('  jane@example.com ')).toBe('jane@example.com');
    expect(messageOf(fields.email.safeParse(''))).toBe(
      'This field is required.',
    );
    expect(messageOf(fields.email.safeParse('jane@'))).toBe(
      'Enter a valid e-mail address.',
    );
  });

  it('enforces the minimum length on new passwords only', () => {
    const short = 'x'.repeat(PASSWORD_MIN_LENGTH - 1);
    expect(messageOf(fields.newPassword.safeParse(short))).toBe(
      `The password must have at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
    expect(fields.currentPassword.safeParse(short).success).toBe(true);
    expect(messageOf(fields.currentPassword.safeParse(''))).toBe(
      'This field is required.',
    );
  });

  it('accepts 6-digit codes', () => {
    expect(fields.code.parse(' 123456 ')).toBe('123456');
    expect(fields.code.safeParse('12345a').success).toBe(false);
  });
});
