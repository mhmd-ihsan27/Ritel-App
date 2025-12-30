import React, { useRef, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faShoppingCart,
    faHistory,
    faUndo,
    faBoxOpen,
    faPlusCircle,
    faList,
    faWarehouse,
    faTags,
    faPercent,
    faUsers,
    faStar,
    faUserTag,
    faChartBar,
    faChartPie,
    faWallet,
    faHandHoldingUsd,
    faUserFriends,
    faShoppingBasket,
    faChevronDown,
    faCog,
    faPrint,
    faFileAlt,
    faSlidersH,
    faPlug,
    faUserCog
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ currentPage, showPage, menuOpen, toggleMenuSection }) => {
    const { user, hasPermission } = useAuth();

    const handleToggleMenuSection = (section) => {
        Object.keys(menuOpen).forEach(key => {
            if (key !== section && menuOpen[key]) {
                toggleMenuSection(key);
            }
        });
        toggleMenuSection(section);
    };

    // Reusable Menu Item - TANPA ANIMASI SAMA SEKALI
    const MenuItem = ({ page, icon, label, isActive }) => (
        <button
            onClick={() => showPage(page)}
            className={`
                w-full text-left flex items-center px-4 py-2.5 rounded-lg text-sm
                transition-none /* MENGHILANGKAN TRANSITION */
                ${isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            <FontAwesomeIcon icon={icon} className="mr-3 w-4" />
            <span className="font-medium">{label}</span>
        </button>
    );

    // MENU SECTION TANPA ANIMASI - HANYA SHOW/HIDE
    const MenuSection = ({ section, icon, title, isOpen, children }) => {
        return (
            <div className="mt-1">
                <button
                    onClick={() => handleToggleMenuSection(section)}
                    className={`
                        w-full text-left flex items-center justify-between px-4 py-3 rounded-lg 
                        font-semibold transition-none /* MENGHILANGKAN TRANSITION */
                        ${isOpen
                            ? 'bg-white/15 text-white'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                        }
                    `}
                >
                    <div className="flex items-center">
                        <FontAwesomeIcon icon={icon} className="mr-3 w-4" />
                        <span className="text-sm font-semibold tracking-wide">{title}</span>
                    </div>

                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-xs transition-none ${isOpen ? "rotate-180" : ""}`} /* NO TRANSITION */
                    />
                </button>

                {/* Dropdown TANPA ANIMASI - langsung show/hide */}
                <div className={isOpen ? "block" : "hidden"}>
                    <div className="ml-4 mt-2 space-y-1 pl-4 border-l border-white/20">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const DashboardButton = () => (
        <button
            onClick={() => showPage('dashboard-page')}
            className={`
                w-full text-left flex items-center px-4 py-3 rounded-lg font-medium mb-2
                transition-none /* MENGHILANGKAN TRANSITION */
                ${currentPage === 'dashboard-page'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            <FontAwesomeIcon icon={faChartLine} className="mr-3 w-5" />
            <span className="font-semibold">Dashboard</span>
        </button>
    );

    return (
        <aside className="desktop-menu w-72 bg-primary-dark text-white hidden md:block fixed top-16 left-0 bottom-0 overflow-y-auto z-30 flex flex-col">

            <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
                {/* Show appropriate dashboard based on role */}
                {user?.role === 'admin' && <DashboardButton />}

                {user?.role === 'staff' && (
                    <button
                        onClick={() => showPage('staff-dashboard')}
                        className={`
                            w-full text-left flex items-center px-4 py-3 rounded-lg font-medium mb-2
                            transition-none
                            ${currentPage === 'staff-dashboard'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-white/90 hover:bg-white/10 hover:text-white'
                            }
                        `}
                    >
                        <FontAwesomeIcon icon={faUserFriends} className="mr-3 w-5" />
                        <span className="font-semibold">Staff Dashboard</span>
                    </button>
                )}

                {/* TRANSAKSI */}
                <MenuSection
                    section="transaksi"
                    icon={faShoppingCart}
                    title="Transaksi & Penjualan"
                    isOpen={menuOpen.transaksi}
                >
                    <MenuItem page="transaksi" icon={faShoppingCart} label="Buat Transaksi" isActive={currentPage === 'transaksi'} />
                    <MenuItem page="history-transaksi" icon={faHistory} label="History Transaksi" isActive={currentPage === 'history-transaksi'} />
                    <MenuItem page="return-barang" icon={faUndo} label="Return Barang" isActive={currentPage === 'return-barang'} />
                </MenuSection>

                {/* PRODUK */}
                <MenuSection
                    section="produk"
                    icon={faBoxOpen}
                    title="Manajemen Produk"
                    isOpen={menuOpen.produk}
                >
                    <MenuItem page="input-barang" icon={faPlusCircle} label="Input Barang" isActive={currentPage === 'input-barang'} />
                    <MenuItem page="produk" icon={faList} label="Daftar Produk" isActive={currentPage === 'produk'} />
                    <MenuItem page="update-stok" icon={faWarehouse} label="Manajemen Stok" isActive={currentPage === 'update-stok'} />
                    <MenuItem page="kategori-produk" icon={faTags} label="Kategori Produk" isActive={currentPage === 'kategori-produk'} />
                    <MenuItem page="promo-diskon" icon={faPercent} label="Promo & Diskon" isActive={currentPage === 'promo-diskon'} />
                </MenuSection>

                {/* PELANGGAN */}
                <MenuSection
                    section="pelanggan"
                    icon={faUsers}
                    title="Manajemen Pelanggan"
                    isOpen={menuOpen.pelanggan}
                >
                    <MenuItem page="daftar-pelanggan" icon={faUsers} label="Daftar Pelanggan" isActive={currentPage === 'daftar-pelanggan'} />
                    <MenuItem page="sistem-poin" icon={faStar} label="Sistem Poin" isActive={currentPage === 'sistem-poin'} />
                    {/* <MenuItem page="diskon-pelanggan" icon={faUserTag} label="Diskon Pelanggan" isActive={currentPage === 'diskon-pelanggan'} /> */}
                </MenuSection>

                {/* LAPORAN - Admin only */}
                {user?.role === 'admin' && (
                    <MenuSection
                        section="laporan"
                        icon={faChartBar}
                        title="Laporan & Analisis"
                        isOpen={menuOpen.laporan}
                    >
                        {/* Laporan Penjualan - Admin only */}
                        {hasPermission('view-sales-reports') && (
                            <MenuItem page="laporan" icon={faChartLine} label="Laporan Penjualan" isActive={currentPage === 'laporan'} />
                        )}

                        {/* Laporan Staff - Admin only */}
                        {hasPermission('view-staff-reports') && (
                            <MenuItem page="laporan-staff" icon={faUserFriends} label="Laporan Staff" isActive={currentPage === 'laporan-staff'} />
                        )}

                        {/* <MenuItem page="laporan-pembelian" icon={faShoppingBasket} label="Laporan Pembelian" isActive={currentPage === 'laporan-pembelian'} />
                        <MenuItem page="laba-rugi" icon={faChartPie} label="Laba Rugi" isActive={currentPage === 'laba-rugi'} />
                        <MenuItem page="laporan-kas" icon={faWallet} label="Laporan Kas" isActive={currentPage === 'laporan-kas'} />
                        <MenuItem page="hutang-piutang" icon={faHandHoldingUsd} label="Hutang & Piutang" isActive={currentPage === 'hutang-piutang'} />
                        <MenuItem page="laporan-pelanggan" icon={faUserFriends} label="Laporan Pelanggan" isActive={currentPage === 'laporan-pelanggan'} /> */}
                    </MenuSection>
                )}
            </div>

            {/* SETTING */}
            <div className="border-t border-white/20 p-4 mt-auto">
                <MenuSection
                    section="pengaturan"
                    icon={faCog}
                    title="Pengaturan Sistem"
                    isOpen={menuOpen.pengaturan}
                >
                    {/* Manajemen Staff - Admin only */}
                    {user?.role === 'admin' && (
                        <MenuItem page="manajemen-staff" icon={faUserCog} label="Manajemen Staff" isActive={currentPage === 'manajemen-staff'} />
                    )}
                    <MenuItem page="pengaturan-devices" icon={faPrint} label="Devices & Printer" isActive={currentPage === 'pengaturan-devices'} />
                    <MenuItem page="hardware-settings" icon={faPlug} label="Hardware Scanner" isActive={currentPage === 'hardware-settings'} />
                    <MenuItem page="pengaturan-struk" icon={faFileAlt} label="Format Struk" isActive={currentPage === 'pengaturan-struk'} />
                    {/* <MenuItem page="pengaturan-umum" icon={faSlidersH} label="Pengaturan Umum" isActive={currentPage === 'pengaturan-umum'} /> */}
                </MenuSection>
            </div>
        </aside>
    );
};

export default Sidebar;