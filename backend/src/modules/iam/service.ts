import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { dbPool } from '../../db/client.js';

import type { UserRole } from '../../middleware/rbac.js';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  organization_id: string | null;
  created_at: string;
}

export async function registerUser(
  email: string, 
  password: string, 
  role: UserRole = 'business_admin',
  organization_id: string | null = null
): Promise<User> {
  const password_hash = await bcrypt.hash(password, 12);
  const id = randomUUID();
  const org_id = organization_id || `org-${id.slice(0,8)}`;
  
  const result = await dbPool.query(
    `INSERT INTO users (id, email, password_hash, role, organization_id, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, email, password_hash, role, organization_id, created_at`,
    [id, email.toLowerCase(), password_hash, role, org_id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('user_creation_failed');
  }
  
  return result.rows[0] as User;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const result = await dbPool.query(
    'SELECT id, email, password_hash, role, organization_id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0] as User;
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return null;
  }
  
  return user;
}

// For /api/auth/me enhancement
export async function getUserById(userId: string): Promise<User | null> {
  const result = await dbPool.query(
    'SELECT id, email, role, organization_id, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] as User | null;
}

