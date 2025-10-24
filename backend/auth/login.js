const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');
const { ADMIN, USER } = require('./roles');

// Demo: hardcode user list (sau này có thể lấy từ wallet / DB)
const users = [
  { username: 'admin', password: 'adminpw', role: ADMIN },
  { username: 'user1', password: 'userpw', role: USER },
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

module.exports = router;
