import express from 'express';
import { mockUsers } from '../data/mockData';
import { authenticateToken, requireRole } from '../middleware/auth';
import { hashPassword } from '../utils/encryption';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['admin']), (req, res) => {
  const users = mockUsers.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  }));

  res.json(users);
});

router.post('/', authenticateToken, requireRole(['admin']), (req, res) => {
  const { name, email, role, password } = req.body;

  // Check if user already exists
  if (mockUsers.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: uuidv4(),
    email,
    role,
    name,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  };

  mockUsers.push(newUser);

  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name,
    createdAt: newUser.createdAt,
  });
});

router.put('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  const userIndex = mockUsers.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = mockUsers[userIndex];
  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;
  
  if (password) {
    user.passwordHash = hashPassword(password);
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

router.delete('/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const userIndex = mockUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  mockUsers.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

export default router;