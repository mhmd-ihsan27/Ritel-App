import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faBell, faSignOutAlt, faBars, faCalendarAlt, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import SyncStatus from '../common/SyncStatus';
import { isWebMode } from '../../utils/environment';

// Komponen Modal Logout
const LogoutModal = ({
    isOpen,
    onClose,
    onConfirm,
    userName = 'Pengguna',
    userRole = 'user'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-2xl  shadow-xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                            <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                className="text-red-500 text-lg"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Konfirmasi Keluar
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Tindakan penting
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="text-center mb-4">
                        <div className="flex justify-center mb-3">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon
                                    icon={faSignOutAlt}
                                    className="text-red-500 text-2xl"
                                />
                            </div>
                        </div>

                        <h4 className="text-xl font-semibold text-gray-800 mb-2">
                            Keluar dari Akun?
                        </h4>

                        <p className="text-gray-600 mb-4">
                            Anda akan keluar dari akun <span className="font-semibold text-gray-800">{userName}</span>
                        </p>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                                <span className={`px-2 py-1 rounded ${userRole === 'admin'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                    {userRole === 'admin' ? 'Admin' : 'Staff'}
                                </span>
                                <span>•</span>
                                <span>VVRDailyFresh</span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-500">
                            Anda perlu login kembali untuk mengakses sistem.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        Batalkan
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-200 shadow-sm"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
                            <span>Ya, Keluar</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Komponen Header Utama
const Header = ({
    notifDropdownOpen,
    toggleNotifDropdown,
    toggleMobileMenu,
    isMobile = false
}) => {
    const { user, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const handleConfirmLogout = () => {
        logout();
    };

    const handleCloseModal = () => {
        setIsLogoutModalOpen(false);
    };

    // Fungsi untuk mendapatkan tanggal, bulan, dan tahun saat ini dalam format Indonesia
    const getCurrentDate = () => {
        const date = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('id-ID', options);
    };

    // Format tanggal singkat: DD/MM/YYYY
    const getShortDate = () => {
        const date = new Date();
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (isMobile) {
        return (
            <>
                <div className="mobile-header bg-white shadow-sm p-4 md:hidden fixed top-0 left-0 right-0 z-50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            {/* Logo dengan background */}
                            <div className="bg-green-100 p-2 rounded-lg mr-3">
                                <FontAwesomeIcon icon={faLeaf} className="text-green-600 text-2xl" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">VVRDailyFresh</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-primary text-sm" />
                                <span className="text-xs text-gray-700">{getShortDate()}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${user?.role === 'admin'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-green-600 text-white'
                                }`}>
                                {user?.role === 'admin' ? 'Admin' : 'Staff'}
                            </span>
                            <button onClick={toggleMobileMenu} className="text-gray-600">
                                <FontAwesomeIcon icon={faBars} className="text-xl" />
                            </button>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary"></div>
                </div>

                <LogoutModal
                    isOpen={isLogoutModalOpen}
                    onClose={handleCloseModal}
                    onConfirm={handleConfirmLogout}
                    userName={user?.namaLengkap}
                    userRole={user?.role}
                />
            </>
        );
    }

    return (
        <>
            <header className="desktop-header bg-green-50 shadow-sm hidden md:block fixed top-0 left-0 right-0 z-40">
                <div className="flex justify-between items-center px-6 py-3">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-xl mr-3">
                            <FontAwesomeIcon icon={faLeaf} className="text-green-600 text-2xl" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">VVRDailyFresh</h1>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-primary" />
                            <span className="text-sm font-medium text-gray-700">{getCurrentDate()}</span>
                        </div>

                        {/* Sync Status Indicator - Only show in desktop mode */}
                        {!isWebMode() && <SyncStatus compact={true} />}

                        <div className="relative">
                            <button
                                onClick={toggleNotifDropdown}
                                className="relative p-2 text-gray-600 hover:text-primary transition-colors"
                            >
                                <FontAwesomeIcon icon={faBell} className="text-xl" />
                                <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    0
                                </span>
                            </button>

                            {notifDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-300">
                                    <div className="p-4 border-b border-gray-300">
                                        <h3 className="font-semibold text-gray-800">Produk Mendekati Kadaluarsa</h3>
                                        <p className="text-xs text-gray-500 mt-1">{getCurrentDate()}</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        <div className="p-4 text-center text-gray-500">
                                            <p className="text-sm">Tidak ada notifikasi</p>
                                        </div>
                                    </div>
                                    <div className="p-2 border-t border-gray-300 text-center">
                                        <button
                                            onClick={toggleNotifDropdown}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-gray-700">
                                Halo, <span className="font-semibold">{user?.namaLengkap || 'Pengguna'}</span>
                            </span>
                            <span className={`px-3 py-1 rounded text-sm font-medium ${user?.role === 'admin'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-green-600 text-white'
                                }`}>
                                {user?.role === 'admin' ? 'Admin' : 'Staff'}
                            </span>
                            <button
                                onClick={handleLogoutClick}
                                className="text-gray-600 hover:text-red-500 transition-colors p-2 group relative"
                                title="Keluar"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="h-0.5 bg-primary"></div>
            </header>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmLogout}
                userName={user?.namaLengkap}
                userRole={user?.role}
            />
        </>
    );
};

export default Header;

