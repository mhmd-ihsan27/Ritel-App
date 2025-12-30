import React, { useState, useEffect } from 'react';
import './App.css';

// Auth Provider
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Sync Provider
import { SyncProvider } from './contexts/SyncContext';

// Toast Provider
import { ToastProvider } from './components/common/ToastContainer';

// Layout Components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { MobileMenu, MobileBottomNav } from './components/layout/MobileMenu';

// Auth Pages
import Login from './components/pages/auth/Login';

// Page Components
import Dashboard from './components/pages/dashboard/Dashboard';
import InputBarang from './components/pages/produk/InputBarang';
import DaftarProduk from './components/pages/produk/DaftarProduk';
import Transaksi from './components/pages/transaksi/Transaksi';
import {
    HistoryTransaksi,
    ReturnBarang,
    UpdateStok,
    KategoriProduk,
    PromoDiskon,
    DaftarPelanggan,
    SistemPoin,
    LaporanPenjualan,
    LaporanPembelian,
    LabaRugi,
    LaporanKas,
    HutangPiutang,
    LaporanStaff,
    LaporanPelanggan,
} from './components/pages';
import PengaturanDevices from './components/pages/pengaturan/PengaturanDevices';
import PengaturanStruk from './components/pages/pengaturan/PengaturanStruk';
import HardwareSettings from './components/pages/settings/HardwareSettings';
import ManajemenStaff from './components/pages/pengaturan/ManajemenStaff';

import StaffDashboard from './components/pages/dashboard/StaffDashboard';


// Icons (not needed anymore, but kept for future use)
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AppContent = () => {
    const { user, loading, hasPermission } = useAuth();
    // State management
    const [currentPage, setCurrentPage] = useState('dashboard-page');
    const [produkData, setProdukData] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

    // Menu collapse state
    const [menuOpen, setMenuOpen] = useState({
        transaksi: true,
        produk: false,
        pelanggan: false,
        laporan: false,
        pengaturan: false
    });

    // Dashboard data
    const [dashboardData, setDashboardData] = useState({
        pendapatanHariIni: 0,
        totalTransaksi: 0,
        produkTerjual: 0,
        countKadaluarsa: 0
    });

    // Initialize app
    useEffect(() => {
        generateDashboardData();
    }, []);

    // Set default page based on user role
    useEffect(() => {
        if (user) {
            if (user.role === 'staff') {
                setCurrentPage('staff-dashboard');
            } else {
                setCurrentPage('dashboard-page');
            }
        }
    }, [user]);

    // Scroll to top on page change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage]);

    // Navigation functions
    const showPage = (pageId) => {
        setCurrentPage(pageId);
        setMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const toggleNotifDropdown = () => {
        setNotifDropdownOpen(!notifDropdownOpen);
    };

    const toggleMenuSection = (section) => {
        setMenuOpen(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Dashboard functions
    const generateDashboardData = () => {
        const pendapatanHariIni = Math.floor(Math.random() * 5000000) + 1000000;
        const totalTransaksi = Math.floor(Math.random() * 50) + 10;
        const produkTerjual = Math.floor(Math.random() * 200) + 50;
        const countKadaluarsa = Math.floor(Math.random() * 10);

        setDashboardData({
            pendapatanHariIni,
            totalTransaksi,
            produkTerjual,
            countKadaluarsa
        });
    };

    // Product functions
    const handleSaveProduk = (produk) => {
        setProdukData([...produkData, produk]);
    };

    // Utility functions
    const formatRupiah = (angka) => {
        return 'Rp ' + angka.toLocaleString('id-ID');
    };

    // Render page content based on current page
    const renderPageContent = () => {
        switch (currentPage) {
            case 'dashboard-page':
                return <Dashboard dashboardData={dashboardData} formatRupiah={formatRupiah} />;

            case 'staff-dashboard':
                return <StaffDashboard />;

            case 'transaksi':
                return <Transaksi />;

            case 'history-transaksi':
                return <HistoryTransaksi />;

            case 'return-barang':
                return <ReturnBarang />;

            case 'input-barang':
                return <InputBarang onSaveProduk={handleSaveProduk} />;

            case 'produk':
                return <DaftarProduk />;

            case 'update-stok':
                return <UpdateStok />;

            case 'kategori-produk':
                return <KategoriProduk />;

            case 'promo-diskon':
                return <PromoDiskon />;

            case 'daftar-pelanggan':
                return <DaftarPelanggan />;

            case 'sistem-poin':
                return <SistemPoin />;

            case 'laporan':
                return <LaporanPenjualan />;

            case 'laporan-pembelian':
                return <LaporanPembelian />;

            case 'laporan-staff':
                return <LaporanStaff />;

            case 'laba-rugi':
                return <LabaRugi />;

            case 'laporan-kas':
                return <LaporanKas />;

            case 'hutang-piutang':
                return <HutangPiutang />;

            case 'laporan-pelanggan':
                return <LaporanPelanggan />;

            case 'pengaturan-devices':
                return <PengaturanDevices />;

            case 'pengaturan-struk':
                return <PengaturanStruk />;

            case 'hardware-settings':
                return <HardwareSettings />;

            case 'manajemen-staff':
                return <ManajemenStaff />;

            default:
                return <Dashboard dashboardData={dashboardData} formatRupiah={formatRupiah} />;
        }
    };

    // Removed old renderTransaksi(), renderProduk(), and renderLaporan() - Now using separate components

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat...</p>
                </div>
            </div>
        );
    }

    // Show login page if not authenticated
    if (!user) {
        return <Login />;
    }

    return (
        <ToastProvider>
            <div className="min-h-screen bg-gray-50">
                {/* Mobile Header */}
                <Header
                    isMobile={true}
                    toggleMobileMenu={toggleMobileMenu}
                />

                {/* Desktop Header */}
                <Header
                    notifDropdownOpen={notifDropdownOpen}
                    toggleNotifDropdown={toggleNotifDropdown}
                />

                <div className="flex flex-col md:flex-row min-h-screen">
                    {/* Desktop Sidebar */}
                    <Sidebar
                        currentPage={currentPage}
                        showPage={showPage}
                        menuOpen={menuOpen}
                        toggleMenuSection={toggleMenuSection}
                    />

                    {/* Main Content */}
                    <main className="main-content flex-1 md:ml-72 mt-16 md:mt-16">
                        {renderPageContent()}
                    </main>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden mt-16">
                    <MobileMenu
                        mobileMenuOpen={mobileMenuOpen}
                        showPage={showPage}
                        currentPage={currentPage}
                    />
                </div>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav
                    showPage={showPage}
                    currentPage={currentPage}
                />
            </div>
        </ToastProvider>
    );
};

// Main App component with AuthProvider and SyncProvider
const App = () => {
    return (
        <AuthProvider>
            <SyncProvider>
                <AppContent />
            </SyncProvider>
        </AuthProvider>
    );
};

export default App;
