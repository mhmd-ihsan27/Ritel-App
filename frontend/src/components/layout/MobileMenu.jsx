import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faPlusCircle,
    faShoppingCart,
    faList,
    faFileAlt,
    faSignOutAlt,
    faBoxOpen
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const MobileMenu = ({ mobileMenuOpen, showPage, currentPage }) => {
    const { user } = useAuth();
    if (!mobileMenuOpen) return null;

    return (
        <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => showPage('dashboard-page')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${currentPage === 'dashboard-page'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-primary hover:text-white'
                        }`}
                >
                    <FontAwesomeIcon icon={faChartLine} className="text-lg mb-1" />
                    <span className="text-xs font-medium">Dashboard</span>
                </button>
                <button
                    onClick={() => showPage('input-barang')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${currentPage === 'input-barang'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-primary hover:text-white'
                        }`}
                >
                    <FontAwesomeIcon icon={faPlusCircle} className="text-lg mb-1" />
                    <span className="text-xs font-medium">Input Barang</span>
                </button>
                <button
                    onClick={() => showPage('transaksi')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${currentPage === 'transaksi'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-primary hover:text-white'
                        }`}
                >
                    <FontAwesomeIcon icon={faShoppingCart} className="text-lg mb-1" />
                    <span className="text-xs font-medium">Transaksi</span>
                </button>
                <button
                    onClick={() => showPage('produk')}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${currentPage === 'produk'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 hover:bg-primary hover:text-white'
                        }`}
                >
                    <FontAwesomeIcon icon={faList} className="text-lg mb-1" />
                    <span className="text-xs font-medium">Produk</span>
                </button>
                {/* Laporan - Admin only */}
                {user?.role === 'admin' && (
                    <button
                        onClick={() => showPage('laporan')}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${currentPage === 'laporan'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 hover:bg-primary hover:text-white'
                            }`}
                    >
                        <FontAwesomeIcon icon={faFileAlt} className="text-lg mb-1" />
                        <span className="text-xs font-medium">Laporan</span>
                    </button>
                )}
                <button className="flex flex-col items-center justify-center p-3 bg-red-100 hover:bg-primary hover:text-white rounded-lg transition-colors">
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-lg mb-1" />
                    <span className="text-xs font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

const MobileBottomNav = ({ showPage, currentPage }) => {
    const { user } = useAuth();

    return (
        <div className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50">
            <div className="flex justify-around py-2">
                <button
                    onClick={() => showPage('dashboard-page')}
                    className={`flex flex-col items-center ${currentPage === 'dashboard-page' ? 'text-primary' : 'text-gray-600'
                        }`}
                >
                    <FontAwesomeIcon icon={faChartLine} className="mb-1" />
                    <span className="text-xs">Dashboard</span>
                </button>
                <button
                    onClick={() => showPage('transaksi')}
                    className={`flex flex-col items-center ${currentPage === 'transaksi' ? 'text-primary' : 'text-gray-600'
                        }`}
                >
                    <FontAwesomeIcon icon={faShoppingCart} className="mb-1" />
                    <span className="text-xs">Transaksi</span>
                </button>
                <button
                    onClick={() => showPage('produk')}
                    className={`flex flex-col items-center ${currentPage === 'produk' ? 'text-primary' : 'text-gray-600'
                        }`}
                >
                    <FontAwesomeIcon icon={faBoxOpen} className="mb-1" />
                    <span className="text-xs">Produk</span>
                </button>
                {/* Laporan - Admin only */}
                {user?.role === 'admin' && (
                    <button
                        onClick={() => showPage('laporan')}
                        className={`flex flex-col items-center ${currentPage === 'laporan' ? 'text-primary' : 'text-gray-600'
                            }`}
                    >
                        <FontAwesomeIcon icon={faFileAlt} className="mb-1" />
                        <span className="text-xs">Laporan</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export { MobileMenu, MobileBottomNav };
