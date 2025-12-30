import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faExclamationCircle,
    faInfoCircle,
    faExclamationTriangle,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

const Toast = ({
    message,
    type = 'success',
    duration = 3000,
    onClose,
    index = 0, // Posisi dalam tumpukan
    totalToasts = 1 // Total notifikasi dalam tumpukan
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Animasi masuk
        setIsVisible(true);

        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        // Animasi keluar
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: faCheckCircle,
                    bgColor: 'bg-green-50',
                    iconColor: 'text-green-600',
                    textColor: 'text-green-800',
                    borderColor: 'border-1 border-green-700',
                    progressColor: 'bg-green-600',
                    entranceAnimation: 'slide-in-from-right-8',
                    exitAnimation: 'slide-out-to-right-8'
                };
            case 'error':
                return {
                    icon: faExclamationCircle,
                    bgColor: 'bg-red-50',
                    iconColor: 'text-red-600',
                    textColor: 'text-red-800',
                    borderColor: 'border-1 border-red-700',
                    progressColor: 'bg-red-600',
                    entranceAnimation: 'bounce-in-1',
                    exitAnimation: 'slide-out-to-right-8'
                };
            case 'warning':
                return {
                    icon: faExclamationTriangle,
                    bgColor: 'bg-yellow-50',
                    iconColor: 'text-yellow-600',
                    textColor: 'text-yellow-800',
                    borderColor: 'border-1 border-yellow-700',
                    progressColor: 'bg-yellow-600',
                    entranceAnimation: 'slide-in-from-top-8',
                    exitAnimation: 'slide-out-to-top-8'
                };
            case 'info':
                return {
                    icon: faInfoCircle,
                    bgColor: 'bg-blue-50',
                    iconColor: 'text-blue-600',
                    textColor: 'text-blue-800',
                    borderColor: 'border-1 border-blue-700',
                    progressColor: 'bg-blue-600',
                    entranceAnimation: 'slide-in-from-bottom-8',
                    exitAnimation: 'slide-out-to-bottom-8'
                };
            default:
                return {
                    icon: faInfoCircle,
                    bgColor: 'bg-gray-50',
                    iconColor: 'text-gray-600',
                    textColor: 'text-gray-800',
                    borderColor: 'border-1 border-gray-400',
                    progressColor: 'bg-gray-600',
                    entranceAnimation: 'slide-in-from-right-8',
                    exitAnimation: 'slide-out-to-right-8'
                };
        }
    };

    const config = getConfig();

    // Hitung posisi dalam tumpukan seperti lembaran kertas
    const stackOffset = index * 4; // Offset yang lebih kecil untuk efek kertas
    const zIndex = 50 + (totalToasts - index); // Notifikasi teratas memiliki z-index tertinggi
    const isTopToast = index === totalToasts - 1;

    // Hitung transformasi untuk efek kertas bertumpuk
    const getPaperStackTransform = () => {
        if (isTopToast) {
            return 'translateY(0)';
        }

        // Untuk kertas di bawah, beri sedikit rotasi dan offset
        const rotation = (index % 2 === 0) ? '0.5deg' : '-0.3deg';
        return `translateY(${stackOffset}px) rotate(${rotation})`;
    };

    if (!isVisible) return null;

    return (
        <div
            className={`
                relative transform transition-all duration-300 ease-in-out mb-2
                ${isExiting ? config.exitAnimation : config.entranceAnimation}
                ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            `}
            style={{
                transform: getPaperStackTransform(),
                zIndex: zIndex
            }}
        >
            {/* Efek bayangan bertumpuk untuk kertas di bawah */}
            {!isTopToast && (
                <div
                    className="absolute inset-0 bg-gray-300 rounded-lg transform translate-y-1 -z-10"
                    style={{
                        height: 'calc(100% + 2px)',
                        width: 'calc(100% + 2px)',
                        filter: 'blur(1px)',
                        opacity: 0.4 - (index * 0.1)
                    }}
                />
            )}

            {/* Kertas utama */}
            <div className={`
                ${config.bgColor} 
                ${config.borderColor}
                rounded-lg p-4 min-w-80 max-w-md 
                relative overflow-hidden
                transition-all duration-200
                border
                shadow-sm
                ${!isTopToast ? 'cursor-pointer hover:shadow-md' : 'shadow-lg'}
            `}>
                {/* Progress Bar Background - hanya untuk notifikasi teratas */}
                {duration > 0 && isTopToast && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded-t-lg">
                        <div
                            className={`h-full ${config.progressColor} transition-all duration-100 ease-linear rounded-t-lg`}
                            style={{
                                width: isExiting ? '0%' : '100%',
                                animation: isExiting
                                    ? 'none'
                                    : `shrinkWidth ${duration}ms linear forwards`
                            }}
                        />
                    </div>
                )}

                <div className="flex items-center gap-3 mt-1">
                    <div className={`${config.iconColor} flex-shrink-0`}>
                        <FontAwesomeIcon
                            icon={config.icon}
                            className="text-lg"
                        />
                    </div>
                    <div className={`flex-1 ${config.textColor}`}>
                        <p className="text-sm font-medium">{message}</p>
                        {/* Tampilkan sedikit teks yang tersembunyi untuk kertas di bawah */}
                        {!isTopToast && totalToasts > 1 && (
                            <p className="text-xs text-gray-400 mt-1">
                                {index === totalToasts - 2 ? 'Klik untuk melihat' : '...'}
                            </p>
                        )}
                    </div>

                    {/* Tombol close hanya untuk kertas teratas */}
                    {isTopToast && (
                        <button
                            onClick={handleClose}
                            className={`
                                flex-shrink-0 text-gray-400 hover:text-gray-600 
                                rounded-lg p-1 transition-all duration-200 
                                hover:scale-110 hover:bg-gray-100
                                transform
                            `}
                            title="Tutup"
                        >
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-sm"
                            />
                        </button>
                    )}
                </div>

                {/* Efek lipatan kecil di sudut kanan bawah untuk kertas di bawah */}
                {!isTopToast && (
                    <div
                        className="absolute bottom-1 right-1 w-3 h-3 bg-gray-200 opacity-50 rounded-sm"
                        style={{
                            transform: 'rotate(45deg)',
                            boxShadow: '0 0 2px rgba(0,0,0,0.1)'
                        }}
                    />
                )}
            </div>

            <style jsx>{`
                @keyframes shrinkWidth {
                    from { width: 100%; }
                    to { width: 0%; }
                }

                @keyframes slide-in-from-right-8 {
                    from {
                        transform: translateX(100%) rotate(0deg);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0) rotate(0deg);
                        opacity: 1;
                    }
                }

                @keyframes slide-out-to-right-8 {
                    from {
                        transform: translateX(0) rotate(0deg);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%) rotate(0deg);
                        opacity: 0;
                    }
                }

                @keyframes slide-in-from-top-8 {
                    from {
                        transform: translateY(-100%) rotate(0deg);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                }

                @keyframes slide-out-to-top-8 {
                    from {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(-100%) rotate(0deg);
                        opacity: 0;
                    }
                }

                @keyframes slide-in-from-bottom-8 {
                    from {
                        transform: translateY(100%) rotate(0deg);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                }

                @keyframes slide-out-to-bottom-8 {
                    from {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100%) rotate(0deg);
                        opacity: 0;
                    }
                }

                @keyframes bounce-in-1 {
                    0% {
                        transform: scale(0.3) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05) rotate(0deg);
                        opacity: 1;
                    }
                    70% {
                        transform: scale(0.9) rotate(0deg);
                    }
                    100% {
                        transform: scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }

                .slide-in-from-right-8 {
                    animation: slide-in-from-right-8 0.3s ease-out;
                }

                .slide-out-to-right-8 {
                    animation: slide-out-to-right-8 0.3s ease-in;
                }

                .slide-in-from-top-8 {
                    animation: slide-in-from-top-8 0.3s ease-out;
                }

                .slide-out-to-top-8 {
                    animation: slide-out-to-top-8 0.3s ease-in;
                }

                .slide-in-from-bottom-8 {
                    animation: slide-in-from-bottom-8 0.3s ease-out;
                }

                .slide-out-to-bottom-8 {
                    animation: slide-out-to-bottom-8 0.3s ease-in;
                }

                .bounce-in-1 {
                    animation: bounce-in-1 0.6s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Toast;