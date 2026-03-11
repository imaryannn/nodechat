require('dotenv').config();
const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');
const DirectMessage = require('./models/DirectMessage');

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    credentials: true
  }
});

console.log('🚀 Starting NodeChat server...');
console.log('📊 Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- PORT:', process.env.PORT || 'not set');
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  process.exit(1);
}

console.log('🔌 Attempting MongoDB connection...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // 45 second socket timeout
})
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('📁 Database name:', mongoose.connection.name);
    console.log('🔗 Connection state:', mongoose.connection.readyState);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    process.exit(1);
  });

app.use(express.static('public'));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'nodechat-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax'
  },
  name: 'nodechat.sid' // Custom session name
}));

const users = new Map();

app.get('/api/messages/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    
    const messages = await DirectMessage.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 }).limit(100);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    const user = new User({ fullName, email, username, password });
    await user.save();
    
    req.session.username = username;
    
    res.json({ message: 'User created successfully', username });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    req.session.username = username;
    
    res.json({ message: 'Login successful', username });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/session', (req, res) => {
  if (req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

app.get('/api/users/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username fullName').limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', async (username) => {
    console.log(`User ${username} joining with socket ${socket.id}`);
    users.set(socket.id, username);
    console.log('Updated users map:', Array.from(users.entries()));
    
    socket.broadcast.emit('user-joined', username);
    
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    socket.emit('load-messages', messages);
    
    io.emit('user-list', Array.from(users.values()));
  });

  socket.on('chat-message', async (data) => {
    const message = new Message({
      username: data.username,
      message: data.message
    });
    await message.save();
    
    io.emit('chat-message', {
      username: data.username,
      message: data.message,
      timestamp: message.timestamp
    });
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('stop-typing');
  });

  socket.on('direct-message', async (data) => {
    const dm = new DirectMessage({
      sender: data.sender,
      receiver: data.receiver,
      message: data.message
    });
    await dm.save();
    
    const receiverSocketId = Array.from(users.entries())
      .find(([id, username]) => username === data.receiver)?.[0];
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('direct-message', {
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
        timestamp: dm.timestamp
      });
    }
    
    socket.emit('direct-message', {
      sender: data.sender,
      receiver: data.receiver,
      message: data.message,
      timestamp: dm.timestamp
    });
  });

  socket.on('nickname-change', (data) => {
    console.log('Server received nickname-change:', data);
    console.log('All connected users:', Array.from(users.entries()));
    
    // Find the target user's socket
    const targetSocketEntry = Array.from(users.entries())
      .find(([socketId, username]) => username === data.targetUser);
    
    if (targetSocketEntry) {
      const [targetSocketId, targetUsername] = targetSocketEntry;
      console.log(`Found target user ${targetUsername} with socket ${targetSocketId}`);
      
      // Send to target user with different event name
      io.to(targetSocketId).emit('nickname-changed', data);
      console.log(`Sent nickname-changed event to ${targetUsername}`);
    } else {
      console.log(`Target user ${data.targetUser} not found in connected users`);
    }
    
    // Send back to sender for confirmation
    socket.emit('nickname-changed', data);
    console.log(`Sent confirmation to sender ${data.changedBy}`);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    console.log(`User ${username} disconnecting with socket ${socket.id}`);
    if (username) {
      users.delete(socket.id);
      console.log('Updated users map after disconnect:', Array.from(users.entries()));
      io.emit('user-left', username);
      io.emit('user-list', Array.from(users.values()));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});
