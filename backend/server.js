const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET','POST','PUT','DELETE'] },
  pingTimeout:  60000,
  pingInterval: 25000,
});
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
];

app.set('io', io);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/alerts',    require('./routes/alerts'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/admin',     require('./routes/admin'));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', time: new Date(), uptime: process.uptime() })
);

// Track connected users count
let connectedUsers = 0;

io.on('connection', (socket) => {
  connectedUsers++;
  console.log(`Socket connected: ${socket.id} | Total: ${connectedUsers}`);

  // Broadcast live user count to everyone
  io.emit('users_online', connectedUsers);

  // User joins their own room (for targeted notifications later)
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Admin joins admin room
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    console.log(`Admin joined admin room`);
  });

  socket.on('disconnect', () => {
    connectedUsers = Math.max(0, connectedUsers - 1);
    io.emit('users_online', connectedUsers);
    console.log(`Socket disconnected: ${socket.id} | Total: ${connectedUsers}`);
  });
});

server.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);