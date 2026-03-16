import { randomBytes, randomInt } from 'crypto';

export const generateRandomNumber = (length: number): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomInt(0, 10).toString();
  }
  return result;
};

export const generateRef = (prefix = 'TX'): string => {
  return `${prefix}-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
};
