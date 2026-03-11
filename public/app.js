const socket = io();

let username = '';
let typingTimer;
let currentConversation = null;
let conversations = JSON.parse(localStorage.getItem('nodechat_conversations') || '{}');
let unreadCounts = JSON.parse(localStorage.getItem('nodechat_unread') || '{}');
let nicknames = JSON.parse(localStorage.getItem('nodechat_nicknames') || '{}');

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
  const chatMenu = document.getElementById('chat-menu');
  const menuToggle = document.getElementById('menu-toggle');
  const menuDropdown = document.getElementById('menu-dropdown');
  const setNicknameItem = document.getElementById('set-nickname');
  const nicknameModal = document.getElementById('nickname-modal');
  const nicknameInput = document.getElementById('nickname-input');
  const nicknameSave = document.getElementById('nickname-save');
  const nicknameCancel = document.getElementById('nickname-cancel');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileWelcome = document.getElementById('mobile-welcome');
  const startChatBtn = document.getElementById('start-chat-btn');
  const sidebar = document.querySelector('.sidebar-left');

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

  // Menu functionality
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
  });

  // Nickname functionality
  setNicknameItem.addEventListener('click', () => {
    if (currentConversation) {
      nicknameInput.value = nicknames[currentConversation] || '';
      nicknameModal.style.display = 'flex';
      nicknameInput.focus();
      menuDropdown.classList.remove('show');
    }
  });

  nicknameSave.addEventListener('click', () => {
    if (currentConversation) {
      setNickname(currentConversation, nicknameInput.value);
      nicknameModal.style.display = 'none';
    }
  });

  nicknameCancel.addEventListener('click', () => {
    nicknameModal.style.display = 'none';
  });

  nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (currentConversation) {
        setNickname(currentConversation, nicknameInput.value);
        nicknameModal.style.display = 'none';
      }
    } else if (e.key === 'Escape') {
      nicknameModal.style.display = 'none';
    }
  });

  // Close modal when clicking outside
  nicknameModal.addEventListener('click', (e) => {
    if (e.target === nicknameModal) {
      nicknameModal.style.display = 'none';
    }
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
    
    const displayName = nicknames[targetUser] || targetUser;
    document.getElementById('chat-username').textContent = displayName;
    document.getElementById('chat-avatar').textContent = targetUser.charAt(0).toUpperCase();
    
    // Show chat menu
    document.getElementById('chat-menu').style.display = 'block';
    
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

  // Mobile menu functionality
  function initMobileMenu() {
    console.log('Initializing mobile menu, window width:', window.innerWidth);
    
    if (window.innerWidth <= 768) {
      console.log('Mobile mode detected');
      // Show mobile elements
      mobileMenuBtn.style.display = 'block';
      
      // Show welcome screen initially if no conversation is active
      if (!currentConversation) {
        mobileWelcome.style.display = 'flex';
        messagesDiv.style.display = 'none';
        document.getElementById('typing-indicator').style.display = 'none';
        document.querySelector('.message-input').style.display = 'none';
      }
      
      // Mobile menu button click
      mobileMenuBtn.addEventListener('click', () => {
        console.log('Mobile menu button clicked');
        const currentLeft = window.getComputedStyle(sidebar).left;
        console.log('Current sidebar left position:', currentLeft);
        
        // Check actual position instead of just class
        if (currentLeft === '0px') {
          console.log('Closing sidebar');
          sidebar.classList.remove('show');
          sidebar.style.setProperty('left', '-100%', 'important');
        } else {
          console.log('Opening sidebar');
          sidebar.classList.add('show');
          sidebar.style.setProperty('left', '0px', 'important');
          sidebar.style.setProperty('position', 'fixed', 'important');
          sidebar.style.setProperty('z-index', '1000', 'important');
        }
      });
      
      // Start chat button click
      startChatBtn.addEventListener('click', () => {
        console.log('Start chat button clicked');
        console.log('Sidebar before:', sidebar.className);
        sidebar.classList.add('show');
        // Force the style directly with !important
        sidebar.style.setProperty('left', '0px', 'important');
        sidebar.style.setProperty('position', 'fixed', 'important');
        sidebar.style.setProperty('z-index', '1000', 'important');
        console.log('Sidebar after:', sidebar.className);
        console.log('Sidebar computed style after force:', window.getComputedStyle(sidebar).left);
      });
      
      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && 
            !mobileMenuBtn.contains(e.target) && 
            !e.target.closest('.mobile-menu-btn') &&
            !startChatBtn.contains(e.target)) {
          if (sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
            sidebar.style.setProperty('left', '-100%', 'important');
          }
        }
      });
      
      // Close sidebar when selecting a conversation
      sidebar.addEventListener('click', (e) => {
        if (e.target.closest('.conversation-item') || e.target.closest('.user-result')) {
          console.log('Conversation selected, closing sidebar');
          sidebar.classList.remove('show');
          sidebar.style.setProperty('left', '-100%', 'important');
          
          // Hide welcome screen and show chat
          setTimeout(() => {
            mobileWelcome.style.display = 'none';
            messagesDiv.style.display = 'block';
            document.getElementById('typing-indicator').style.display = 'block';
            document.querySelector('.message-input').style.display = 'flex';
          }, 300);
        }
      });
    } else {
      console.log('Desktop mode detected');
      // Desktop mode
      mobileMenuBtn.style.display = 'none';
      mobileWelcome.style.display = 'none';
      messagesDiv.style.display = 'block';
      document.getElementById('typing-indicator').style.display = 'block';
      document.querySelector('.message-input').style.display = 'flex';
      sidebar.classList.remove('show');
    }
  }
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Reinitialize on window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('show');
    }
    initMobileMenu();
  });
  
  function joinChat() {
    socket.emit('join', username);
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    currentUser.textContent = `@${username}`;
    loadConversations();
    messageInput.focus();
    
    // Initialize mobile menu after joining
    setTimeout(() => {
      initMobileMenu();
    }, 100);
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
    // Check if this is a nickname change notification
    if (data.message && data.message.startsWith('__NICKNAME_CHANGE__:')) {
      const parts = data.message.split(':');
      if (parts.length === 3) {
        const oldNickname = parts[1];
        const newNickname = parts[2];
        
        console.log('Received nickname change notification:', { oldNickname, newNickname, from: data.sender });
        
        // Show toast notification to the receiver
        if (data.receiver === username) {
          showToastNotification(`${data.sender} changed your nickname to "${newNickname}"`);
          
          // Add system message if currently in conversation with the changer
          if (currentConversation === data.sender) {
            addSystemMessage(`${data.sender} changed your nickname to "${newNickname}"`);
          } else {
            // Update conversation list
            if (!conversations[data.sender]) {
              conversations[data.sender] = {
                username: data.sender,
                lastMessage: `Changed your nickname to "${newNickname}"`,
                timestamp: data.timestamp || Date.now()
              };
            } else {
              conversations[data.sender].lastMessage = `Changed your nickname to "${newNickname}"`;
              conversations[data.sender].timestamp = data.timestamp || Date.now();
            }
            
            // Increment unread count
            unreadCounts[data.sender] = (unreadCounts[data.sender] || 0) + 1;
            saveUnreadCounts();
            saveConversations();
            loadConversations();
          }
        }
        
        return; // Don't process this as a regular message
      }
    }
    
    // Regular message processing
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

  socket.on('nickname-changed', (data) => {
    console.log('Client received nickname-changed event:', data);
    
    if (data.changedBy === username) {
      // Message for the person who changed the nickname
      if (currentConversation === data.targetUser) {
        // Don't add system message here since we already added it immediately
        console.log('Sender confirmation received');
      }
    } else if (data.targetUser === username) {
      // Message for the person whose nickname was changed
      console.log('My nickname was changed by:', data.changedBy);
      
      // Always show toast notification
      showToastNotification(`${data.changedBy} changed your nickname to "${data.newNickname}"`);
      
      // Add system message if currently in conversation with the changer
      if (currentConversation === data.changedBy) {
        addSystemMessage(`${data.changedBy} changed your nickname to "${data.newNickname}"`);
      } else {
        // Update conversation list
        if (!conversations[data.changedBy]) {
          conversations[data.changedBy] = {
            username: data.changedBy,
            lastMessage: `Changed your nickname to "${data.newNickname}"`,
            timestamp: Date.now()
          };
        } else {
          conversations[data.changedBy].lastMessage = `Changed your nickname to "${data.newNickname}"`;
          conversations[data.changedBy].timestamp = Date.now();
        }
        
        // Increment unread count
        unreadCounts[data.changedBy] = (unreadCounts[data.changedBy] || 0) + 1;
        saveUnreadCounts();
        saveConversations();
        loadConversations();
      }
    }
  });

  function addDirectMessage(sender, message, timestamp) {
    const messageDiv = document.createElement('div');
    const isOwnMessage = sender === username;
    messageDiv.className = `message ${isOwnMessage ? 'own' : 'other'}`;
    
    const avatar = sender.charAt(0).toUpperCase();
    
    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-text">${message}</div>
        <div class="username-small">${sender}</div>
      </div>
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
        
        const displayName = nicknames[conv.username] || conv.username;
        
        convDiv.innerHTML = `
          <div class="conversation-avatar">${conv.username.charAt(0).toUpperCase()}</div>
          <div class="conversation-info">
            <span class="conversation-username">${displayName}</span>
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
  
  function showToastNotification(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast after 4 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }
  
  function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
  function saveConversations() {
    localStorage.setItem('nodechat_conversations', JSON.stringify(conversations));
  }
  
  function saveUnreadCounts() {
    localStorage.setItem('nodechat_unread', JSON.stringify(unreadCounts));
  }
  
  function saveNicknames() {
    localStorage.setItem('nodechat_nicknames', JSON.stringify(nicknames));
  }
  
  // Test connectivity - add this temporarily
  window.testNickname = function() {
    if (currentConversation) {
      console.log('Testing nickname change for:', currentConversation);
      socket.emit('nickname-change', {
        changedBy: username,
        targetUser: currentConversation,
        oldNickname: 'test-old',
        newNickname: 'test-new'
      });
    } else {
      console.log('No current conversation to test with');
    }
  };
  
  function setNickname(targetUsername, nickname) {
    const oldNickname = nicknames[targetUsername] || targetUsername;
    const newNickname = nickname.trim() || targetUsername;
    
    console.log('Setting nickname:', { targetUsername, oldNickname, newNickname });
    console.log('Socket connected:', socket.connected);
    
    if (nickname.trim()) {
      nicknames[targetUsername] = nickname.trim();
    } else {
      delete nicknames[targetUsername];
    }
    saveNicknames();
    loadConversations();
    
    // Update chat header if this is current conversation
    if (currentConversation === targetUsername) {
      const displayName = nicknames[targetUsername] || targetUsername;
      document.getElementById('chat-username').textContent = displayName;
    }
    
    // Send nickname change notification using direct message system
    if (oldNickname !== newNickname) {
      console.log('Sending nickname change notification');
      
      // Send a special direct message to notify about nickname change
      socket.emit('direct-message', {
        sender: username,
        receiver: targetUsername,
        message: `__NICKNAME_CHANGE__:${oldNickname}:${newNickname}`,
        isSystem: true
      });
      
      // Add system message for the sender immediately
      if (currentConversation === targetUsername) {
        addSystemMessage(`You changed ${oldNickname}'s nickname to "${newNickname}"`);
      }
    }
  }
});