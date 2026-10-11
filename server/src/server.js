import http from 'http';
import 'dotenv/config';
import { app } from './app.js';
import { initSocket } from './services/socket.js';
import { db } from './config/db.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log('API (HTTP + Socket.IO) sur le port', PORT);
  } catch (e) {
    console.error('MySQL injoignable :', e.message, '— vérifiez XAMPP et server/.env');
  }
});