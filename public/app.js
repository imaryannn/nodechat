const socket = io();

let username = '';
let typingTimer;
let currentConversation = null;
let conversations = JSON.parse(localStorage.getItem('nodechat_conversations') || '{}');
let unreadCounts = JSON.parse(localStorage.getItem('nodechat_unread') || '{}');

// Check localStorage first
const savedUser = localStorage.getItem('nodechat_user');

if (savedUser) {
  username = savedUser;
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('chat-container').style.display = 'flex';
  document.getElementById('current-user').textContent = `@${username}`;
  socket.emit('join', username);
}

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
  const currentUser = document.getElementById('current-user');
  const typingIndicator = document.getElementById('typing-indicator');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const conversationsList = document.getElementById('conversations-list');

  // Load saved conversations
  loadConversations();

  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authError.textContent = '';
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
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

  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
      searchResults.innerHTML = '';
      loadConversations();
      return;
    }
    
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
      const users = await response.json();
      
      searchResults.innerHTML = '<h4 style="color: #888; padding: 10px 15px; font-size: 12px; text-transform: uppercase;">Search Results</h4>';
      
      users.forEach(user => {
        if (user.username === username) return;
        
        const userDiv = document.createElement('div');
        userDiv.className = 'user-result';
        userDiv.innerHTML = `
          <div class="user-result-avatar">${user.username.charAt(0).toUpperCase()}</div>
          <div class="user-result-info">
            <span class="user-result-username">${user.username}</span>
            <span class="user-result-fullname">${user.fullName || ''}</span>
          </div>
        `;
        
        userDiv.addEventListener('click', () => {
          openConversation(user.username);
        });
        
        searchResults.appendChild(userDiv);
      });
      
      if (users.length === 0) {
        searchResults.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No users found</p>';
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  });

  async function openConversation(targetUser) {
    currentConversation = targetUser;
    searchInput.value = '';
    
    // Add to conversations if not exists
    if (!conversations[targetUser]) {
      conversations[targetUser] = {
        username: targetUser,
        lastMessage: '',
        timestamp: Date.now()
      };
      saveConversations();
    }
    
    // Clear unread count
    unreadCounts[targetUser] = 0;
    saveUnreadCounts();
    
    loadConversations();
    
    document.getElementById('chat-username').textContent = targetUser;
    document.getElementById('chat-avatar').textContent = targetUser.charAt(0).toUpperCase();
    
    messagesDiv.innerHTML = '';
    
    try {
      const response = await fetch(`/api/messages/${username}/${targetUser}`);
      const messages = await response.json();
      
      messages.forEach(msg => {
        addDirectMessage(msg.sender, msg.message, msg.timestamp);
      });
    } catch (error) {
      console.error('Load messages error:', error);
    }
    
    messageInput.placeholder = `Message ${targetUser}...`;
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }

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
        body: JSON.stringify({ username: usernameInput, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        username = usernameInput;
        localStorage.setItem('nodechat_user', username);
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
        body: JSON.stringify({ fullName, email, username: usernameInput, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        authError.style.color = '#27ae60';
        authError.textContent = 'Account created! Logging in...';
        setTimeout(() => {
          username = usernameInput;
          localStorage.setItem('nodechat_user', username);
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
    currentUser.textContent = `@${username}`;
    loadConversations();
    messageInput.focus();
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentConversation) {
      socket.emit('direct-message', { 
        sender: username, 
        receiver: currentConversation, 
        message 
      });
      messageInput.value = '';
      socket.emit('stop-typing');
    }
  }

  socket.on('direct-message', (data) => {
    if (currentConversation === data.sender || currentConversation === data.receiver) {
      addDirectMessage(data.sender, data.message, data.timestamp);
    }
    
    // Update conversation list
    const otherUser = data.sender === username ? data.receiver : data.sender;
    
    conversations[otherUser] = {
      username: otherUser,
      lastMessage: data.message,
      timestamp: data.timestamp
    };
    
    // Increment unread count if not current conversation
    if (currentConversation !== otherUser && data.sender !== username) {
      unreadCounts[otherUser] = (unreadCounts[otherUser] || 0) + 1;
      saveUnreadCounts();
    }
    
    saveConversations();
    loadConversations();
  });

  function addDirectMessage(sender, message, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatar = sender.charAt(0).toUpperCase();
    
    messageDiv.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">${avatar}</div>
        <span class="username">${sender}</span>
        <span class="timestamp">${time}</span>
      </div>
      <div class="message-text">${message}</div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Update conversation with last message
    if (currentConversation) {
      conversations[currentConversation] = {
        username: currentConversation,
        lastMessage: message,
        timestamp: timestamp
      };
      saveConversations();
      loadConversations();
    }
  }
  
  function loadConversations() {
    const conversationsContainer = searchResults.innerHTML.includes('Search Results') ? 
      document.createElement('div') : searchResults;
    
    if (!searchResults.innerHTML.includes('Search Results')) {
      conversationsContainer.innerHTML = '';
      
      if (Object.keys(conversations).length > 0) {
        conversationsContainer.innerHTML = '<h4 style="color: #888; padding: 10px 15px; font-size: 12px; text-transform: uppercase;">Recent Chats</h4>';
      }
      
      // Sort conversations by timestamp
      const sortedConversations = Object.values(conversations)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      sortedConversations.forEach(conv => {
        const convDiv = document.createElement('div');
        convDiv.className = `conversation-item ${currentConversation === conv.username ? 'active' : ''}`;
        
        const unreadCount = unreadCounts[conv.username] || 0;
        const unreadBadge = unreadCount > 0 ? 
          `<div class="unread-badge">${unreadCount}</div>` : '';
        
        convDiv.innerHTML = `
          <div class="conversation-avatar">${conv.username.charAt(0).toUpperCase()}</div>
          <div class="conversation-info">
            <span class="conversation-username">${conv.username}</span>
            <span class="conversation-preview">${conv.lastMessage || 'Start a conversation'}</span>
          </div>
          ${unreadBadge}
        `;
        
        convDiv.addEventListener('click', () => {
          openConversation(conv.username);
        });
        
        conversationsContainer.appendChild(convDiv);
      });
    }
  }
  
  function saveConversations() {
    localStorage.setItem('nodechat_conversations', JSON.stringify(conversations));
  }
  
  function saveUnreadCounts() {
    localStorage.setItem('nodechat_unread', JSON.stringify(unreadCounts));
  }
});