import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  className = '',
}) => {
  const modalRoot = document.body;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded shadow-lg max-w-md w-full mx-4 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="border-b px-4 py-3 text-lg font-medium text-gray-800">
            {title}
          </div>
        )}
        <div className="p-4">{children}</div>
        <div className="flex justify-end border-t px-4 py-3">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};
