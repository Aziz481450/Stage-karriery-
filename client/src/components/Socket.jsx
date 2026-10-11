import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { WS_URL } from '../api';
import { useAuth } from '../AuthContext';

const Ctx = createContext(null);
export const useSocket = () => useContext(Ctx);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!user) { setSocket(null); return; }
    const s = io(WS_URL, { auth: { token: localStorage.getItem('token') }, transports: ['websocket'] });
    setSocket(s);
    return () => s.disconnect();
  }, [user?.id]);
  return <Ctx.Provider value={{ socket }}>{children}</Ctx.Provider>;
}