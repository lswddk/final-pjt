const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const cors = require('cors');  // cors 패키지 추가
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'rlaehdgns12';
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // Serving static files (HTML, JS, CSS)
app.use(cors());  // CORS 허용

// SQLite database setup
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);
  }
});

// User registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log(username)
  console.log(password)
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
      if (err) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.json({ message: 'User registered successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

// User login endpoint
// User login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: '유효하지 않은 계정입니다.' });  // 계정이 없으면 이 메시지 반환
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '잘못된 비밀번호입니다.' });  // 비밀번호가 맞지 않으면 이 메시지 반환
    }
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, userId: user.id });  // 로그인 성공 후 토큰과 userId 반환
  });
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// In-memory object to store conversation history
let conversationHistory = {};
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Function to get GPT response
async function getGPTResponse(userId, message) {
  try {
    const conversation = conversationHistory[userId] || [];
    conversation.push({ role: 'user', content: message });

    const response = await axios.post(
      OPENAI_API_URL,
      { model: 'gpt-4', messages: conversation, max_tokens: 500 },
      { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
    );

    const gptMessage = response.data.choices[0].message.content;
    conversation.push({ role: 'assistant', content: gptMessage });
    conversationHistory[userId] = conversation;

    return gptMessage;
  } catch (error) {
    console.error('Error communicating with GPT:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get GPT response');
  }
}

// Endpoint for authenticated users to ask questions
app.post('/ask', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  try {
    const gptResponse = await getGPTResponse(req.user.userId, message);
    res.json({ response: gptResponse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get response from GPT' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
