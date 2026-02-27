import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth.schema';

describe('Auth Schema Validation', () => {
  it('should validate a correct registration data', () => {
    const validData = {
      fullName: 'Olga Cantalejo',
      email: 'olga@test.com',
      password: 'Password123'
    };
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if password is too short', () => {
    const invalidData = {
      fullName: 'Olga',
      email: 'olga@test.com',
      password: '123'
    };
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail with invalid email', () => {
    const user = { fullName: 'Olga', email: 'invalid', password: 'password123' };
    expect(registerSchema.safeParse(user).success).toBe(false);
  });
});