import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import type { Request, Response } from 'express';
import { db } from '../../database/client.config';
import Exception from '../../lib/app-exception';
import { createToken, verifyToken } from '../../lib/utils';
import { LoginValidationSchema } from './auth.schema';

export default class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = await LoginValidationSchema.parseAsync(req.body);
    const user = await db.query.user.findFirst({
      where: (table, func) => func.eq(table.email, email),
      columns: { id: true, email: true, name: true, role: true, password: true },
      with: { profileImage: true }
    });

    if (!user) throw new Exception('User not found.', 404);
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Exception('Wrong password, verify and try again later.', 401);

    const accessToken = await createToken(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN || '',
      '10m'
    );
    const refreshToken = await createToken(
      { id: user.id, role: user.role },
      process.env.REFRESH_TOKEN || '',
      '7d'
    );

    res
      .status(200)
      .cookie('USER_TOKEN', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      .json({
        id: user.id,
        token: accessToken,
        name: user.name,
        email: user.email,
        profile_image: user.profileImage?.url || ''
      });
  }

  async revalidate(req: Request, res: Response): Promise<void> {
    const token = req.cookies.USER_TOKEN;
    if (!token) throw new Exception('Invalid Credentials.', 401);

    const decodedPayload = await verifyToken(token, process.env.REFRESH_TOKEN || '');
    if (!decodedPayload) throw new Exception('Access denied.', 403);

    const user = await db.query.user.findFirst({
      where: (table, fn) => fn.eq(table.id, decodedPayload.id),
      columns: { id: true, email: true, name: true, role: true, password: true },
      with: { profileImage: true }
    });

    if (!user) throw new Exception('Invalid credentials.', 401);
    const accessToken = await createToken(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN || '',
      '10m'
    );

    res.status(200).json({
      id: user.id,
      token: accessToken,
      name: user.name,
      email: user.email,
      profile_image: user.profileImage?.url || ''
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies.USER_TOKEN;
    if (!token) throw new Exception('Invalid credentials.', 401);
    res.status(204).clearCookie('USER_TOKEN', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }
}
