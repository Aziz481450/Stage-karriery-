import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createMessage, demandeAccess } from './chat.js';

let io = null;
const online = new Map(); // userId -> nombre de socket connectées

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || '';
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload?.id) return next(new Error('Authentification requise.'));
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Session invalide.'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user.id}`);
    if (user.role === 'redacteur') socket.join('redacteurs');
    const wasOffline = !online.has(user.id) || online.get(user.id) === 0;
    online.set(user.id, (online.get(user.id) || 0) + 1);
    if (wasOffline) emitToRoom(`user:${user.id}`, 'user_online', { userId: user.id, role: user.role });

    socket.on('join_demande', async (demandeId) => {
      const id = Number(demandeId);
      if (!Number.isInteger(id)) return;
      try {
        const d = await demandeAccess(id, user);
        if (d) socket.join(`demande:${id}`);
      } catch { /* accès refusé silencieux */ }
    });

    socket.on('leave_demande', (demandeId) => {
      socket.leave(`demande:${demandeId}`);
    });

    socket.on('typing', (demandeId) => {
      socket.to(`demande:${demandeId}`).emit('typing', {
        demandeId: Number(demandeId), userId: user.id, isTyping: true
      });
    });

    socket.on('stop_typing', (demandeId) => {
      socket.to(`demande:${demandeId}`).emit('typing', {
        demandeId: Number(demandeId), userId: user.id, isTyping: false
      });
    });

    socket.on('send_message', async (data) => {
      try {
        const payload = await createMessage({
          demandeId: Number(data?.demandeId), userId: user.id, contenu: data?.contenu || ''
        });
        socket.emit('message_sent', { ok: true, message: payload });
      } catch (e) {
        console.log('[DBG] send_message ECHEC', e.message);
        socket.emit('message_sent', { ok: false, message: e.message || 'Message non envoyé.' });
      }
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${user.id}`);
      const n = (online.get(user.id) || 1) - 1;
      if (n <= 0) { online.delete(user.id); emitToRoom(`user:${user.id}`, 'user_offline', { userId: user.id }); }
      else online.set(user.id, n);
    });
  });
};

export const emitToUser = (userId, event, payload) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToRoom = (room, event, payload) => {
  io?.to(room).emit(event, payload);
};