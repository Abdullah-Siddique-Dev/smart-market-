import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from '../db/connection.js';
import { comparePassword } from '../utils/password.js';
import { UserRole } from '../config/constants.js';

export interface AuthenticatedUser {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends AuthenticatedUser {}
  }
}

export function configurePassport(): void {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          const user = db
            .prepare('SELECT * FROM system_users WHERE username = ? LIMIT 1')
            .get(username) as (AuthenticatedUser & { password_hash: string }) | undefined;

          if (!user) {
            return done(null, false, { message: 'Invalid username or password' });
          }

          if (user.is_active !== 1) {
            return done(null, false, { message: 'Account is deactivated. Contact system owner.' });
          }

          const isMatch = await comparePassword(password, user.password_hash);
          if (!isMatch) {
            return done(null, false, { message: 'Invalid username or password' });
          }

          const safeUser: AuthenticatedUser = {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            is_active: user.is_active,
          };

          return done(null, safeUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: number, done) => {
    try {
      const user = db
        .prepare('SELECT id, username, full_name, role, is_active FROM system_users WHERE id = ?')
        .get(id) as AuthenticatedUser | undefined;

      if (!user || user.is_active !== 1) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  });
}
