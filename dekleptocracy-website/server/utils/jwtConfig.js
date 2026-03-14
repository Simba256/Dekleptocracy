import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const generateAccessToken = (userId) =>
  jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId, tokenVersion) =>
  jwt.sign({ userId, type: 'refresh', version: tokenVersion }, JWT_SECRET, { expiresIn: '30d' });

export { JWT_SECRET, generateAccessToken, generateRefreshToken };
