import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isConfirming?: boolean; // Optional: for showing loading state on confirm button
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isConfirming = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white dark:bg-slate-800 shadow-xl p-6 m-4 text-slate-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between mb-5">
          <h2
            className="text-xl font-semibold text-slate-900 dark:text-slate-100"
            id="modal-title"
          >
            {title}
          </h2>
          <button
            type="button"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none rounded-full p-1 ml-auto inline-flex items-center hover:cursor-pointer transition-colors duration-150"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="mb-8 text-base text-slate-800 dark:text-slate-200">
          {children}
        </div>

        {/* Modal Footer (Actions) */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-800 hover:cursor-pointer transition-colors duration-150"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer transition-colors duration-150"
            >
              {isConfirming && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isConfirming ? "Deleting..." : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
