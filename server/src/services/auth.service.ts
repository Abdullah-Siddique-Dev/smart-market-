import { db } from '../db/connection.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { AppError } from '../middleware/error.middleware.js';
import { AuthenticatedUser } from '../auth/passport.js';

export class AuthService {
  static async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = db
      .prepare('SELECT password_hash FROM system_users WHERE id = ?')
      .get(userId) as { password_hash: string } | undefined;

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await comparePassword(oldPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password does not match', 400, 'INVALID_OLD_PASSWORD');
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
    }

    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE system_users SET password_hash = ? WHERE id = ?').run(newHash, userId);
  }

  static getProfile(userId: number): AuthenticatedUser {
    const user = db
      .prepare('SELECT id, username, full_name, role, is_active FROM system_users WHERE id = ?')
      .get(userId) as AuthenticatedUser | undefined;

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}
