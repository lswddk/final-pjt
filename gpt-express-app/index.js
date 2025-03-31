const express = require('express');
const axios = require('axios');
require('dotenv').config(); // .env 파일에서 환경변수 불러오기

// Express 앱 설정
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // JSON 요청을 처리하기 위한 미들웨어

// OpenAI API 설정
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// GPT-3 또는 GPT-4 모델에 요청을 보내는 함수
async function getGPTResponse(message) {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',  // gpt-4 또는 gpt-3.5-turbo 모델 사용
        messages: [{ role: 'user', content: message }],
        max_tokens: 100,  // 원하는 응답 길이 설정
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error communicating with GPT:', error);
    throw new Error('Failed to get GPT response');
  }
}

// GPT API와 연결된 POST 요청 핸들러
app.post('/ask', async (req, res) => {
  const { message } = req.body;  // 사용자로부터 메시지 받기

  if (!message) {
    return res.status(400).send({ error: 'Message is required' });
  }

  try {
    const gptResponse = await getGPTResponse(message);  // GPT API 호출
    return res.json({ response: gptResponse });  // GPT의 응답을 클라이언트에 전달
  } catch (error) {
    return res.status(500).send({ error: 'Failed to get response from GPT' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});