import React from 'react';
import ReactDOM from 'react-dom/client';
import 'ol/ol.css';
import { App } from './app/App';
import './styles/global.css';
import './styles/sidebarReplacement.css';
import './styles/sidebarExact.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
