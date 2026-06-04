// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { ErrorBoundary } from './App.jsx'
import './index.css'
import { ThemeProvider } from './ThemeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)