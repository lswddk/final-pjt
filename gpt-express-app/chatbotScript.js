// 로그인 및 회원가입 API 엔드포인트
const API_URL = 'http://localhost:3000';

// 로그인 처리
$('#login-form').submit(function (e) {
  e.preventDefault();  // 기본 폼 제출 방지
  const username = $('#login-username').val();
  const password = $('#login-password').val();
  
  fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }), // JSON 형태로 보냄
  })
  .then(response => response.json())  // 응답을 JSON 형태로 파싱
  .then(data => {
    if (data.token) {
      const token = data.token;
      const userId = data.userId;
      
      // 로그인 성공 시 토큰 저장하고 채팅 화면으로 전환
      localStorage.setItem('token', token);  // 토큰 로컬스토리지에 저장
      localStorage.setItem('userId', userId);  // 사용자 ID 저장

      $('.auth-section').hide();
      $('.chat-section').show();
    } else {
      alert(data.error || '로그인 실패');  // 에러 메시지 표시
    }
  })
  .catch(err => {
    alert('Login failed: ' + err.message);  // 에러 메시지 출력
  });
});


// 회원가입 처리
$('#register-form').submit(function (e) {
  e.preventDefault();  // 기본 폼 제출 방지
  const username = $('#register-username').val();
  const password = $('#register-password').val();
  
  fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })  // JSON 형태로 전송
  })
  .then(response => response.json())  // 응답을 JSON 형태로 파싱
  .then(data => {
    alert('Registration successful! Please login.');
    
    // 회원가입 후 로그인 화면으로 전환
    $('#register-form').hide();
    $('#go-to-register-btn').hide();
    $('#login-form').show();
    $('#go-to-login-btn').show();
  })
  .catch(err => {
    alert('Registration failed: ' + err.message);  // 에러 메시지 출력
  });
});

// 로그인 -> 회원가입 페이지 전환
$('#go-to-signup-btn').click(function () {
  $('#login-form-container').hide();
  $('#register-form-container').show();
});

// 회원가입 -> 로그인 페이지 전환
$('#go-to-login-btn').click(function () {
  $('#register-form-container').hide();
  $('#login-form-container').show();
});

// 메시지 전송 처리 (마우스 클릭과 Enter 키 모두 가능하게 수정)
$('#send-message-btn').click(function () {
  sendMessage();
});

// Enter 키로 메시지 전송
$('#message-input').keypress(function (e) {
  if (e.which === 13 && !e.shiftKey) {  // Enter 키가 눌리면
    e.preventDefault();  // 기본 Enter 동작(줄 바꿈)을 방지
    sendMessage();  // 메시지 전송 함수 호출
  }
});

// 메시지 전송 함수
function sendMessage() {
  const message = $('#message-input').val();
  if (!message) return;

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // 사용자 메시지 전송
  $('#chat-box').append('<div class="user-message">' + message + '</div>');
  $('#message-input').val('');  // 메시지 입력칸 초기화

  fetch(`${API_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // 토큰 헤더에 포함
    },
    body: JSON.stringify({ userId, message })  // JSON 형태로 메시지 전송
  })
  .then(response => response.json())  // 응답을 JSON 형태로 파싱
  .then(response => {
    const gptMessage = response.response;
    // GPT 메시지 한 글자씩 출력
    typeWriter(gptMessage);
  })
  .catch(err => {
    alert('Failed to get response: ' + err.message);  // 에러 메시지 출력
  });
}

// GPT의 메시지를 한 글자씩 출력하는 함수
function typeWriter(text) {
  let i = 0;
  let typingSpeed = 50;  // 글자당 출력 속도 (밀리초 단위)
  
  const chatBox = $('#chat-box');
  const gptMessageDiv = $('<div class="gpt-message"></div>').appendTo(chatBox);

  // 글자 하나씩 출력하는 함수
  const interval = setInterval(function() {
    if (i < text.length) {
      gptMessageDiv.append(text.charAt(i));  // 한 글자씩 출력
      i++;
    } else {
      clearInterval(interval);  // 모든 글자가 출력되면 interval 멈춤
    }
  }, typingSpeed);
}

