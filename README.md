# NodeChat - Real-time Chat Application

A real-time chat application built with Node.js, Express, Socket.IO, and MongoDB.

## Features

- Real-time messaging using Socket.IO
- User authentication with usernames
- Message history stored in MongoDB
- Online users list
- Typing indicators
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nodechat
```

3. Make sure MongoDB is running

## Running the Application

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
nodechat/
├── models/
│   └── Message.js       # MongoDB message schema
├── public/
│   ├── index.html       # Frontend HTML
│   ├── style.css        # Styles
│   └── app.js           # Client-side JavaScript
├── server.js            # Express & Socket.IO server
├── package.json
└── .env                 # Environment variables
```

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with Mongoose
