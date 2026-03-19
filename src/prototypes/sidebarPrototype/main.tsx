import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../styles/global.css';
import './prototype.css';
import { SidebarPrototypeApp } from './SidebarPrototypeApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidebarPrototypeApp />
  </React.StrictMode>,
);
