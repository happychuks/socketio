const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const typingIndicator = document.getElementById('typing');
const onlineUsers = document.getElementById('online-users');
const toggleUsersBtn = document.getElementById('toggle-users-btn');
const toggleConnBtn = document.getElementById('toggle-conn-btn');

// Set nickname
const nickname = prompt('Enter your nickname:');
socket.emit('set nickname', nickname);

// Send message
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    const clientOffset = `${socket.id}-${Date.now()}`;
    const item = document.createElement('li');
    item.textContent = `You: ${input.value}`;
    messages.appendChild(item);
    socket.emit('chat message', input.value, clientOffset);
    input.value = '';
  }
});

// Receive message
socket.on('chat message', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// Typing event
input.addEventListener('input', () => {
  socket.emit('typing');
});
input.addEventListener('blur', () => {
  socket.emit('stop typing');
});

socket.on('user typing', (nickname) => {
  typingIndicator.textContent = `${nickname} is typing...`;
});

socket.on('user stopped typing', () => {
  typingIndicator.textContent = '';
});

// User connection and disconnection messages
socket.on('user connected', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
});

socket.on('user disconnected', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
});

// Display users online
socket.on('users online', (userList) => {
  onlineUsers.innerHTML = ''; // Clear the list
  userList.forEach((user) => {
    const item = document.createElement('li');
    item.textContent = user;
    onlineUsers.appendChild(item);
  });
});

// Toggle online users visibility
toggleUsersBtn.addEventListener('click', () => {
  if (onlineUsers.style.display === 'none') {
    onlineUsers.style.display = 'block';
    toggleUsersBtn.textContent = 'Hide Online Users';
  } else {
    onlineUsers.style.display = 'none';
    toggleUsersBtn.textContent = 'Show Online Users';
  }
});

// Disconnect/Connect toggle functionality
toggleConnBtn.addEventListener('click', () => {
  if (socket.connected) {
    socket.disconnect();
    toggleConnBtn.textContent = 'Connect';
  } else {
    socket.connect();
    toggleConnBtn.textContent = 'Disconnect';
  }
});
