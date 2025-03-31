// 필요한 모듈 불러오기
const express = require('express');
const axios = require('axios');
require('dotenv').config();  // .env 파일에서 환경변수 불러오기

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

// OpenAI API 설정
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// 대화 내역을 서버 메모리에 저장 (일반적으로 데이터베이스에 저장하지만, 간단한 예시로 메모리 사용)
let conversationHistory = {};

// GPT API 호출 함수
async function getGPTResponse(userId, message) {
  try {
    // 대화 기록 불러오기 (사용자 ID 기준으로 저장된 대화 내역)
    const conversation = conversationHistory[userId] || [];

    // 사용자 메시지 추가
    conversation.push({ role: 'user', content: message });

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',  // gpt-4 또는 gpt-3.5-turbo 모델 사용
        messages: conversation,  // 대화 내역을 모두 전달
        max_tokens: 150,  // 응답 길이 설정
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );

    // GPT의 응답을 대화 내역에 추가
    const gptMessage = response.data.choices[0].message.content;
    conversation.push({ role: 'assistant', content: gptMessage });

    // 대화 내역을 저장 (메모리, DB 등)
    conversationHistory[userId] = conversation;

    return gptMessage;
  } catch (error) {
    console.error('Error communicating with GPT:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get GPT response');
  }
}

// 대화 요청 처리
app.post('/ask', async (req, res) => {
  const { userId, message } = req.body;  // 사용자 ID와 메시지 받기

  if (!userId || !message) {
    return res.status(400).send({ error: 'User ID and message are required' });
  }

  try {
    const gptResponse = await getGPTResponse(userId, message);
    return res.json({ response: gptResponse });
  } catch (error) {
    return res.status(500).send({ error: 'Failed to get response from GPT' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
