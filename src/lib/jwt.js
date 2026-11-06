import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload, options = { expiresIn: '7d', algorithm: 'HS256' }) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
}
