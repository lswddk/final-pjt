const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY || 'rlaehdgns12';
app.use(express.json());

// SQLite 데이터베이스 설정
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

// 회원가입 엔드포인트
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
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

// 로그인 엔드포인트
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  });
});

// 인증 미들웨어
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

// 대화 내역 저장을 위한 메모리 객체
let conversationHistory = {};
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// GPT 응답 처리 함수
async function getGPTResponse(userId, message) {
  try {
    const conversation = conversationHistory[userId] || [];
    conversation.push({ role: 'user', content: message });

    const response = await axios.post(
      OPENAI_API_URL,
      { model: 'gpt-4', messages: conversation, max_tokens: 150 },
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

// 인증된 사용자만 질문 가능
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
