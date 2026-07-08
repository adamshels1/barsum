import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// Пароль ребёнка шифруем обратимо (а не bcrypt-хэшируем), чтобы родитель мог
// посмотреть его позже в кабинете, если забудет — это детская обучающая
// платформа, а не хранилище чувствительных данных, такой компромисс оправдан.
const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.JWT_SECRET || 'barsum-dev-secret';
  return createHash('sha256').update(`${secret}:child-password`).digest();
}

export function encryptChildPassword(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString('base64')).join('.');
}

// Пароли детей, созданных до перехода на обратимое шифрование, всё ещё
// хранятся как bcrypt-хэш ($2a$/$2b$/$2y$...) — их нельзя расшифровать назад.
export function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$/.test(value);
}

export function decryptChildPassword(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
