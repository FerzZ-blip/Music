import { useRef, useEffect, useState } from 'react';

export default function BottomSheet({ visible, onClose, children, snapPoints = ['60%', '90%'] }) {
  const sheetRef = useRef(null);
  const [snap, setSnap] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e) => {
    if (e.target.closest('.sheet-content')) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      currentY.current = diff;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${diff}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentY.current > 100) {
      if (snap === 0 && snapPoints.length > 1) {
        setSnap(1);
      } else {
        onClose();
      }
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    currentY.current = 0;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-warm-950/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div
        ref={sheetRef}
        className="relative w-full bg-warm-50 dark:bg-warm-950 rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden flex flex-col transition-transform duration-300 ease-out"
        style={{ maxHeight: snapPoints[snap] }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-warm-300 dark:bg-warm-700" />
        </div>
        <div className="flex-1 overflow-y-auto sheet-content">{children}</div>
      </div>
    </div>
  );
}
