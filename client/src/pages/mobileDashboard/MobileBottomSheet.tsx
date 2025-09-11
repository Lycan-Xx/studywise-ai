import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function MobileBottomSheet({ isOpen, onClose, children, title }: MobileBottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    setCurrentY(e.touches[0].clientY);
    const diffY = e.touches[0].clientY - startY;
    
    // Only allow dragging down
    if (diffY > 0) {
      const sheet = e.currentTarget as HTMLElement;
      sheet.style.transform = `translateY(${Math.max(0, diffY)}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diffY = currentY - startY;
    const sheet = document.querySelector('.bottom-sheet-content') as HTMLElement;
    
    if (sheet) {
      sheet.style.transform = '';
    }
    
    // Close if dragged down more than 100px
    if (diffY > 100) {
      onClose();
    }
    
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-3xl z-50 max-h-[90vh] transition-transform duration-300 ease-out bottom-sheet-content ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {title || 'Customize Your Test'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 pb-20" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}