import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };
createRoot(document.getElementById('root')).render(
  <BrowserRouter future={routerFuture}><AuthProvider><App /></AuthProvider></BrowserRouter>);
