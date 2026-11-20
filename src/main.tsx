import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const Gallery = import.meta.env.DEV ? lazy(() => import('./Gallery')) : null;
const showGallery = Gallery && new URLSearchParams(location.search).has('gallery');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showGallery && Gallery ? (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
