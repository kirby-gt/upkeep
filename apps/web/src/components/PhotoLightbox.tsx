import { useEffect } from 'react';
import type { Photo } from '../types.js';
import { photoUrl } from '../api.js';

export default function PhotoLightbox({
  photos,
  index,
  propertyId,
  onClose,
  onIndexChange,
}: {
  photos: Photo[];
  index: number;
  propertyId: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const count = photos.length;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % count);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, count, onClose, onIndexChange]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div className="lightbox-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      {count > 1 && (
        <button
          className="lightbox-nav lightbox-prev"
          onClick={() => onIndexChange((index - 1 + count) % count)}
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}
      <img className="lightbox-img" src={photoUrl(propertyId, photo.storageKey)} alt="" />
      {count > 1 && (
        <button
          className="lightbox-nav lightbox-next"
          onClick={() => onIndexChange((index + 1) % count)}
          aria-label="Next photo"
        >
          ›
        </button>
      )}
      {count > 1 && (
        <div className="lightbox-counter">
          {index + 1} / {count}
        </div>
      )}
    </div>
  );
}
