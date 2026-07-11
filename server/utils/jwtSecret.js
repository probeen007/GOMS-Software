import crypto from 'crypto';

const envSecret = process.env.JWT_SECRET;

if (!envSecret) {
  console.warn(
    '[SECURITY WARNING] JWT_SECRET is not set in the environment. ' +
    'A random secret has been generated for this process only — existing tokens will be invalidated on restart, ' +
    'and tokens will not validate across multiple server instances. Set JWT_SECRET in your environment immediately.'
  );
}

export const JWT_SECRET = envSecret || crypto.randomBytes(32).toString('hex');
