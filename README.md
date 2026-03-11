# NodeChat - Real-time Chat Application

A modern, real-time chat application built with Node.js, Express, Socket.IO, and MongoDB Atlas. Features direct messaging, user authentication, nickname system, and a responsive mobile-first design.

🌐 **Live Demo**: [https://nodechat-aivw.onrender.com](https://nodechat-aivw.onrender.com)

## ✨ Features

### Core Functionality
- 💬 **Real-time messaging** using Socket.IO
- 👤 **User authentication** with secure login/signup
- 📱 **Direct messaging** between users (Instagram-like interface)
- 🏷️ **Nickname system** with real-time notifications
- 💾 **Message history** stored in MongoDB Atlas
- 🔍 **User search** functionality
- 📋 **Conversation management** with unread message counts

### User Experience
- 🎨 **Modern black & white UI** with glassmorphism effects
- 📱 **Fully responsive design** (mobile-first approach)
- 🍔 **Mobile hamburger menu** for easy navigation
- 🔔 **Toast notifications** for nickname changes
- 💬 **System messages** for chat events
- ⚡ **Real-time typing indicators**
- 🎯 **Persistent sessions** with localStorage

### Technical Features
- 🔒 **Secure authentication** with express-session
- 🌐 **Cloud database** with MongoDB Atlas
- 📡 **WebSocket communication** for real-time updates
- 🎯 **RESTful API** endpoints
- 🔄 **Auto-deployment** with GitHub integration

## 🚀 Live Application

**URL**: [https://nodechat-aivw.onrender.com](https://nodechat-aivw.onrender.com)

*Note: The app runs on Render's free tier, so it may take 30-60 seconds to wake up if it hasn't been used recently.*

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling
- **Express-session** - Session management

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **JavaScript (ES6+)** - Client-side logic
- **Socket.IO Client** - Real-time communication

### Deployment
- **Render** - Cloud hosting platform
- **GitHub** - Version control and auto-deployment
- **MongoDB Atlas** - Cloud database hosting

## 📱 Screenshots

### Desktop Interface
- Clean conversation sidebar
- Real-time message bubbles
- Three-dots menu for nickname management

### Mobile Interface
- Welcome screen on first load
- Hamburger menu navigation
- Touch-optimized chat interface

## 🏗️ Project Structure

```
nodechat/
├── models/
│   ├── Message.js       # Public message schema
│   ├── User.js          # User authentication schema
│   └── DirectMessage.js # Private message schema
├── public/
│   ├── index.html       # Frontend HTML structure
│   ├── style.css        # Responsive CSS styling
│   └── app.js           # Client-side JavaScript
├── server.js            # Express & Socket.IO server
├── package.json         # Dependencies and scripts
├── .env                 # Environment variables (local)
└── README.md           # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/imaryannn/nodechat.git
   cd nodechat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_atlas_connection_string
   SESSION_SECRET=your_super_secret_session_key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

### Production Deployment

The app is configured for easy deployment on Render:

1. **Push to GitHub**
2. **Connect to Render**
3. **Set environment variables**
4. **Deploy automatically**

## 🎯 Usage Guide

### Getting Started
1. **Sign up** for a new account or **login** with existing credentials
2. **Search for users** using the search bar
3. **Start conversations** by clicking on users
4. **Send messages** in real-time

### Advanced Features
- **Set nicknames**: Use the three-dots menu in chat headers
- **Mobile navigation**: Use the hamburger menu on mobile devices
- **Conversation management**: View all chats in the sidebar
- **Unread messages**: See unread counts on conversations

## 🔧 API Endpoints

### Authentication
- `POST /api/signup` - Create new user account
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/session` - Check session status

### Users
- `GET /api/users/search?query=username` - Search users

### Messages
- `GET /api/messages/:user1/:user2` - Get conversation history

### Socket Events
- `join` - User joins the chat
- `direct-message` - Send/receive direct messages
- `typing` / `stop-typing` - Typing indicators

## 🎨 Design Features

### Color Scheme
- **Primary**: Black (#000000)
- **Secondary**: White (#ffffff)
- **Accents**: Various shades of gray
- **Highlights**: Subtle borders and shadows

### Responsive Breakpoints
- **Mobile**: ≤ 768px (hamburger menu, welcome screen)
- **Tablet**: 768px - 1024px (optimized layout)
- **Desktop**: ≥ 1024px (full sidebar visible)

## 🔒 Security Features

- **Password protection** (basic authentication)
- **Session management** with secure cookies
- **Input validation** and sanitization
- **CORS configuration** for cross-origin requests
- **Environment variable protection**

## 🚀 Performance Optimizations

- **Efficient database queries** with Mongoose
- **Real-time updates** without page refreshes
- **Optimized CSS** with minimal dependencies
- **Compressed assets** for faster loading
- **Mobile-first responsive design**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨💻 Author

**Aryan** - [GitHub Profile](https://github.com/imaryannn)

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- MongoDB Atlas for cloud database hosting
- Render for free hosting platform
- Express.js community for excellent documentation

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/imaryannn/nodechat/issues) page
2. Create a new issue with detailed information
3. Contact the developer through GitHub

---

⭐ **Star this repository if you found it helpful!**

🌐 **Try the live demo**: [https://nodechat-aivw.onrender.com](https://nodechat-aivw.onrender.com)