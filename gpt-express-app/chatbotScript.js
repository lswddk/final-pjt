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
    const token = data.token;
    const userId = data.userId;
    
    // 로그인 성공 시 토큰 저장하고 채팅 화면으로 전환
    localStorage.setItem('token', token);  // 토큰 로컬스토리지에 저장
    localStorage.setItem('userId', userId);  // 사용자 ID 저장

    $('.auth-section').hide();
    $('.chat-section').show();
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
$('#go-to-register-btn').click(function () {
  $('#login-form').hide();
  $('#go-to-login-btn').show();
  $('#register-form').show();
  $('#go-to-register-btn').hide();
});


// 회원가입 -> 로그인 페이지 전환
$('#go-to-login-btn').click(function () {
  $('#register-form').hide();
  $('#go-to-login-btn').hide();
  $('#login-form').show();
  $('#go-to-register-btn').show();
});

// 메시지 전송 처리
$('#send-message-btn').click(function () {
  const message = $('#message-input').val();
  if (!message) return;

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

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
    $('#chat-box').append('<div class="user-message">' + message + '</div>');
    $('#chat-box').append('<div class="gpt-message">' + response.response + '</div>');
    $('#message-input').val('');  // 메시지 입력칸 초기화
  })
  .catch(err => {
    alert('Failed to get response: ' + err.message);  // 에러 메시지 출력
  });
});
