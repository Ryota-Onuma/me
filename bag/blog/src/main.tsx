import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Disable browser's automatic scroll restoration
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Scroll to top on initial load
window.scrollTo(0, 0);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
);
