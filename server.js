import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
});

// Create our 'messages' table (you can ignore the 'client_offset' column for now)
await db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );
`);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

const onlineUsers = new Map(); // To track connected users and nicknames

io.on('connection', (socket) => {
  let userNickname = '';

  // Handle user setting their nickname
  socket.on('set nickname', (nickname) => {
    userNickname = nickname;
    onlineUsers.set(socket.id, userNickname);

    // Broadcast a message to others that a user has connected
    socket.broadcast.emit('user connected', `${userNickname} has connected`);
    io.emit('users online', Array.from(onlineUsers.values())); // Send updated user list
  });

  // Handle chat message
  socket.on('chat message', async (msg) => {
    try {
      await db.run('INSERT INTO messages (content) VALUES (?)', msg);
      socket.broadcast.emit('chat message', `${userNickname}: ${msg}`);
    } catch (e) {
      console.error('Failed to save message', e);
    }
  });

  // Handle typing event
  socket.on('typing', () => {
    socket.broadcast.emit('user typing', userNickname);
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('user stopped typing');
  });

  // Handle user disconnecting
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    socket.broadcast.emit('user disconnected', `${userNickname} has disconnected`);
    io.emit('users online', Array.from(onlineUsers.values())); // Send updated user list
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
