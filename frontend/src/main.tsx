import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';

import './styles/global.css';
import './styles/responsive.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)
