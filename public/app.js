const socket = io();

let username = '';
let typingTimer;

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
  const authContainer = document.getElementById('auth-container');
  const chatContainer = document.getElementById('chat-container');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const authError = document.getElementById('auth-error');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const messagesDiv = document.getElementById('messages');
  const userList = document.getElementById('user-list');
  const currentUser = document.getElementById('current-user');
  const typingIndicator = document.getElementById('typing-indicator');

  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Signup clicked');
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authError.textContent = '';
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Login clicked');
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
    authError.textContent = '';
  });

  loginBtn.addEventListener('click', handleLogin);
  signupBtn.addEventListener('click', handleSignup);

  document.getElementById('login-username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  document.getElementById('signup-username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignup();
  });

  document.getElementById('signup-fullname').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignup();
  });

  document.getElementById('signup-email').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignup();
  });

  document.getElementById('signup-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignup();
  });

  document.getElementById('signup-confirm-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSignup();
  });

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  messageInput.addEventListener('input', () => {
    socket.emit('typing', username);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('stop-typing');
    }, 1000);
  });

  async function handleLogin() {
    const usernameInput = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!usernameInput || !password) {
      authError.textContent = 'Please fill in all fields';
      return;
    }
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        username = usernameInput;
        joinChat();
      } else {
        authError.textContent = data.error;
      }
    } catch (error) {
      authError.textContent = 'Connection error';
    }
  }

  async function handleSignup() {
    const fullName = document.getElementById('signup-fullname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const usernameInput = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    authError.style.color = '#e74c3c';
    
    if (!fullName || !email || !usernameInput || !password || !confirmPassword) {
      authError.textContent = 'Please fill in all fields';
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      authError.textContent = 'Please enter a valid email address';
      return;
    }
    
    if (usernameInput.length < 3) {
      authError.textContent = 'Username must be at least 3 characters';
      return;
    }
    
    if (password.length < 6) {
      authError.textContent = 'Password must be at least 6 characters';
      return;
    }
    
    if (password !== confirmPassword) {
      authError.textContent = 'Passwords do not match';
      return;
    }
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, username: usernameInput, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        authError.style.color = '#27ae60';
        authError.textContent = 'Account created! Logging in...';
        setTimeout(() => {
          username = usernameInput;
          joinChat();
        }, 1000);
      } else {
        authError.style.color = '#e74c3c';
        authError.textContent = data.error;
      }
    } catch (error) {
      authError.textContent = 'Connection error';
    }
  }

  function joinChat() {
    socket.emit('join', username);
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    currentUser.textContent = `Logged in as: ${username}`;
    messageInput.focus();
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
      socket.emit('chat-message', { username, message });
      messageInput.value = '';
      socket.emit('stop-typing');
    }
  }

  socket.on('load-messages', (messages) => {
    messages.forEach(msg => {
      addMessage(msg.username, msg.message, msg.timestamp);
    });
  });

  socket.on('chat-message', (data) => {
    addMessage(data.username, data.message, data.timestamp);
  });

  socket.on('user-joined', (username) => {
    addSystemMessage(`${username} joined the chat`);
  });

  socket.on('user-left', (username) => {
    addSystemMessage(`${username} left the chat`);
  });

  socket.on('user-list', (users) => {
    userList.innerHTML = '';
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = user;
      userList.appendChild(li);
    });
  });

  socket.on('typing', (username) => {
    typingIndicator.textContent = `${username} is typing...`;
  });

  socket.on('stop-typing', () => {
    typingIndicator.textContent = '';
  });

  function addMessage(username, message, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(timestamp).toLocaleTimeString();
    messageDiv.innerHTML = `
      <span class="username">${username}</span>
      <span class="message-text">${message}</span>
      <span class="timestamp">${time}</span>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
});
