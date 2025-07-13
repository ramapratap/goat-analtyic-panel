import express from 'express';
import jwt from 'jsonwebtoken';
import { mockUsers } from '../data/mockData';
import { verifyPassword } from '../utils/encryption';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-change-in-production';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set in environment variables. Using fallback secret.');
}

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Update last login
  user.lastLogin = new Date();

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    },
  });
});

router.get('/validate', authenticateToken, (req: AuthRequest, res) => {
  const user = mockUsers.find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  });
});

export default router;