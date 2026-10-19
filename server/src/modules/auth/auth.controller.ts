import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Tenant } from '../../models/Tenant';
import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import { audit } from '../../utils/audit';
import {
  clearRefreshCookie,
  COOKIE_NAME,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/tokens';

type UserDoc = InstanceType<typeof User>;

// The user data we are happy to send to the browser (never the password hash).
function publicUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId?.toString(),
  };
}

// Creates both tokens, sets the refresh cookie and returns the response body.
function startSession(res: Response, user: UserDoc) {
  const tenantId = user.tenantId?.toString();
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role as any, tenantId });
  setRefreshCookie(res, signRefreshToken({ sub: user._id.toString(), v: user.tokenVersion }));
  return { user: publicUser(user), accessToken };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, businessName, city } = req.body;

  if (await User.exists({ email })) throw new AppError(409, 'An account with this email already exists');

  const userId = new Types.ObjectId();
  let tenantId: Types.ObjectId | undefined;
  if (role === 'owner') {
    const tenant = await Tenant.create({ name: businessName, city, ownerId: userId });
    tenantId = tenant._id;
  }

  const user = await User.create({
    _id: userId,
    name,
    email,
    role,
    tenantId,
    passwordHash: await bcrypt.hash(password, 10),
  });

  audit(user._id.toString(), 'auth.register', 'User', user._id.toString(), { role });
  res.status(201).json(startSession(res, user));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  // Same message for "no user" and "wrong password" so attackers learn nothing.
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!user || !ok) throw new AppError(401, 'Incorrect email or password');

  res.json(startSession(res, user));
});

// Called when the page loads (and when the access token expires) to get a fresh access token.
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new AppError(401, 'Not logged in', 'NO_REFRESH');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Session expired, please log in again', 'NO_REFRESH');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.v) {
    throw new AppError(401, 'Session expired, please log in again', 'NO_REFRESH');
  }
  res.json(startSession(res, user));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      // Bumping the version makes every old refresh token useless.
      await User.updateOne({ _id: payload.sub }, { $inc: { tokenVersion: 1 } });
    } catch {
      /* token was already invalid, nothing to revoke */
    }
  }
  clearRefreshCookie(res);
  res.json({ ok: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(404, 'User not found');
  res.json({ user: publicUser(user) });
});
