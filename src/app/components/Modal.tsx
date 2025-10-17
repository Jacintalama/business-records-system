"use client";

import React, { PropsWithChildren, useEffect, useRef, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title?: ReactNode;          // <-- was: string
  onClose: () => void;
  actions?: ReactNode;        // keep this as ReactNode too
  maxWidthClass?: string;
}

const Modal: React.FC<PropsWithChildren<ModalProps>> = ({
  open,
  title,
  onClose,
  actions,
  children,
  maxWidthClass = "max-w-5xl",
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 p-4 no-print"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClass} max-h-[90vh] rounded-xl bg-white ring-1 ring-black/10 shadow-2xl flex flex-col overflow-hidden`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 backdrop-blur px-5 py-3">
          <h3 className="text-base font-semibold text-gray-900 truncate pr-4">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-800"
            aria-label="Close"
            title="Close"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {actions && (
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-white/95 backdrop-blur px-5 py-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
