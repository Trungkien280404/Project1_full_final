import React, { useEffect } from 'react';

/**
 * Toast Component - Professional notification system
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {string} message - Message to display
 * @param {function} onClose - Callback when toast closes
 * @param {number} duration - Auto-close duration in ms (default: 4000)
 */
export default function Toast({ type = 'info', message, onClose, duration = 4000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        ),
    };

    const styles = {
        success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800',
        error: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-800',
        warning: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-500 text-yellow-800',
        info: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500 text-blue-800',
    };

    const iconColors = {
        success: 'text-green-600',
        error: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600',
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
            <div
                className={`
          ${styles[type] || styles.info}
          border-l-4 rounded-lg shadow-2xl px-5 py-4 pr-14
          max-w-md min-w-[320px]
          transform transition-all duration-300 ease-out
          hover:shadow-3xl hover:scale-[1.02]
        `}
            >
                <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 ${iconColors[type]}`}>
                        {icons[type] || icons.info}
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-semibold leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close notification"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Progress bar */}
                {duration > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                        <div
                            className={`h-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{
                                animation: `shrink ${duration}ms linear forwards`,
                            }}
                        />
                    </div>
                )}
            </div>

            <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
        </div>
    );
}
