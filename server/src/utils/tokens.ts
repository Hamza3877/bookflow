import jwt from 'jsonwebtoken';
import { CookieOptions, Response } from 'express';
import { env } from '../config/env';
import { Role } from '../config/constants';

export interface AccessPayload {
  sub: string;
  role: Role;
  tenantId?: string;
}

export interface RefreshPayload {
  sub: string;
  v: number;
}

export const COOKIE_NAME = 'bf_refresh';

// Short-lived token sent with every API request.
export function signAccessToken(payload: AccessPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

// Long-lived token kept in an httpOnly cookie (JavaScript cannot read it).
export function signRefreshToken(payload: RefreshPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}

function cookieOptions(): CookieOptions {
  const crossSite = env.CROSS_SITE_COOKIES === 'true';
  return {
    httpOnly: true,
    secure: crossSite || env.NODE_ENV === 'production',
    sameSite: crossSite ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}
