import React from 'react';
import ReactDOM from 'react-dom/client';
import 'ol/ol.css';
import { App } from './app/App';
import './styles/global.css';
import './styles/sidebarExact.css';

function isSafariBrowser(): boolean {
  const userAgent = navigator.userAgent;

  return /Safari/i.test(userAgent)
    && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(userAgent);
}

document.documentElement.dataset.browser = isSafariBrowser() ? 'safari' : 'other';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
