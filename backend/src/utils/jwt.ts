import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
const jwtExpire = process.env.JWT_EXPIRE || '1h';

export const generateToken = (id: string | mongoose.Types.ObjectId): string => {
  return jwt.sign(
    { id: id.toString() },
    jwtSecret as any,
    { expiresIn: jwtExpire as any },
  ) as string;
};