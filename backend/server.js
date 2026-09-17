const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { startReminderScheduler } = require('./services/reminderScheduler');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const residentRoutes = require('./routes/residentRoutes');
const vitalsRoutes = require('./routes/vitalsRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const alertRoutes = require('./routes/alertRoutes');
const familyMemberRoutes = require('./routes/familyMemberRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'https://health-monitor-liart-one.vercel.app' } });
app.set('io', io);

app.use(cors({ origin: 'https://health-monitor-liart-one.vercel.app' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/', (req, res) => res.send('AI Health Monitoring API is running ✅'));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startReminderScheduler(io);
  console.log('⏰ Medicine reminder scheduler started (checks every 60s)');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});