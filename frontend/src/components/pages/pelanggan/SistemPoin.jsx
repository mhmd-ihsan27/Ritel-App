import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStar,
    faUsers,
    faCoins,
    faCrown,
    faUser,
    faGift,
    faExchangeAlt,
    faHistory,
    faChartLine,
    faAward,
    faShieldAlt,
    faGem,
    faMedal,
    faTrophy,
    faPercentage,
    faCalculator,
    faCog,
    faEdit,
    faSave,
    faTimes,
    faShoppingCart,
    faReceipt,
    faInfoCircle,
    faPlus,
    faMinus,
    faUserCircle,
    faFire,
    faBolt,
    faShield,
    faCheckCircle,
    faExclamationTriangle,
    faExclamationCircle,
    faSearch
} from '@fortawesome/free-solid-svg-icons';
import { pelangganAPI, settingsAPI } from '../../../api';

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`max-w-sm rounded-lg shadow-lg border-l-4 ${toast.type === 'success'
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : toast.type === 'error'
                            ? 'bg-red-50 border-red-500 text-red-800'
                            : toast.type === 'warning'
                                ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                                : 'bg-blue-50 border-blue-500 text-blue-800'
                        } p-4 transform transition-all duration-300 ease-in-out`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <FontAwesomeIcon
                                icon={
                                    toast.type === 'success' ? faCheckCircle :
                                        toast.type === 'error' ? faExclamationTriangle :
                                            toast.type === 'warning' ? faExclamationCircle : faInfoCircle
                                }
                                className={`text-lg ${toast.type === 'success' ? 'text-green-500' :
                                    toast.type === 'error' ? 'text-red-500' :
                                        toast.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                                    }`}
                            />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-sm" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Statistics Cards Component
const StatisticsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Baris Atas */}
            <div className="space-y-6">
                {/* Total Poin Diberikan */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-xl shadow-md">
                                    <FontAwesomeIcon icon={faCoins} className="text-white text-xl" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Poin Diberikan</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalPoin.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                                <div className="flex items-center space-x-2">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-500 text-sm" />
                                    <span className="text-yellow-700 text-sm font-medium">
                                        Potensi Diskon: Rp {stats.potentialDiscount.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Members */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-3 rounded-xl shadow-md">
                                    <FontAwesomeIcon icon={faAward} className="text-white text-xl" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Premium Members</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.level2Members}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                    <span className="text-blue-700 text-sm font-medium">
                                        {stats.totalMembers > 0 ? Math.round((stats.level2Members / stats.totalMembers) * 100) : 0}% dari total
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500">Level 2</span>
                                    <p className="text-sm font-semibold text-blue-600">5% Diskon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Baris Bawah */}
            <div className="space-y-6">
                {/* Gold Members */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-md">
                                    <FontAwesomeIcon icon={faCrown} className="text-white text-xl" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Gold Members</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.level3Members}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                                    <span className="text-yellow-700 text-sm font-medium">
                                        {stats.totalMembers > 0 ? Math.round((stats.level3Members / stats.totalMembers) * 100) : 0}% dari total
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-500">Level 3</span>
                                    <p className="text-sm font-semibold text-yellow-600">10% Diskon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rata-rata Poin */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="bg-gradient-to-br from-purple-400 to-purple-500 p-3 rounded-xl shadow-md">
                                    <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Rata-rata Poin</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.averagePoints}</p>
                                </div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                    <FontAwesomeIcon icon={faUsers} className="text-purple-500 text-sm" />
                                    <span className="text-purple-700 text-sm font-medium">
                                        {stats.totalMembers} member aktif
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal untuk Tambah/Kurangi Poin
const TambahKurangiPoinModal = ({ isOpen, onClose, pelanggan, mode, showToast }) => {
    const [poin, setPoin] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setPoin('');
            setKeterangan('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!poin || parseInt(poin) <= 0) {
            showToast('Jumlah poin harus lebih dari 0', 'warning');
            return;
        }

        setLoading(true);

        try {
            const poinValue = mode === 'tambah' ? parseInt(poin) : -parseInt(poin);

            await pelangganAPI.addPoin({
                pelangganId: pelanggan.id,
                poin: poinValue
            });

            showToast(
                `Berhasil ${mode} ${poin} poin untuk ${pelanggan.nama}`,
                'success'
            );
            onClose(true);
        } catch (error) {
            console.error('Error updating points:', error);
            showToast(
                `Gagal ${mode} poin: ${error.message || error}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !pelanggan) return null;

    const getLevelInfo = (level) => {
        switch (level) {
            case 3:
                return { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', icon: faCrown, label: 'LEVEL 3' };
            case 2:
                return { color: 'bg-gray-100 text-gray-800 border border-gray-300', icon: faAward, label: 'LEVEL 2' };
            default:
                return { color: 'bg-green-100 text-green-800 border border-green-300', icon: faUserCircle, label: 'LEVEL 1' };
        }
    };

    const levelInfo = getLevelInfo(pelanggan.level);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0 bg-gray-900/60" onClick={onClose}></div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 border border-gray-200">
                {/* Header */}
                <div className={`p-6 text-white relative ${mode === 'tambah' ? 'bg-green-700' : 'bg-red-500'}`}>
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-md">
                            <FontAwesomeIcon
                                icon={mode === 'tambah' ? faPlus : faMinus}
                                className={`text-xl ${mode === 'tambah' ? 'text-green-500' : 'text-red-500'}`}
                            />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">
                                {mode === 'tambah' ? 'Tambah' : 'Kurangi'} Poin
                            </h3>
                            <p className="text-sm mt-1 opacity-95">
                                {mode === 'tambah' ? 'Menambahkan' : 'Mengurangi'} poin pelanggan
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Pelanggan Info */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-800">{pelanggan.nama}</h4>
                                <p className="text-sm text-gray-500">ID: {pelanggan.id}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
                                {levelInfo.label}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Poin Saat Ini:</span>
                            <div className="flex items-center space-x-2">
                                <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
                                <span className="font-bold text-gray-800 text-lg">{pelanggan.poin || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jumlah Poin *
                            </label>
                            <input
                                type="number"
                                value={poin}
                                onChange={(e) => setPoin(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white shadow-sm"
                                placeholder="Masukkan jumlah poin"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Keterangan (Opsional)
                            </label>
                            <textarea
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white resize-none shadow-sm"
                                placeholder="Alasan penambahan/pengurangan poin..."
                                rows="3"
                            />
                        </div>

                        {/* Preview */}
                        {poin && parseInt(poin) > 0 && (
                            <div className={`p-4 rounded-xl border-2 ${mode === 'tambah' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${mode === 'tambah' ? 'text-green-700' : 'text-red-700'}`}>
                                        Poin Setelah {mode === 'tambah' ? 'Penambahan' : 'Pengurangan'}:
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
                                        <span className="font-bold text-gray-800 text-lg">
                                            {mode === 'tambah'
                                                ? (pelanggan.poin || 0) + parseInt(poin)
                                                : Math.max(0, (pelanggan.poin || 0) - parseInt(poin))
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all shadow-sm"
                    >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !poin || parseInt(poin) <= 0}
                        className={`px-6 py-3 text-white rounded-xl font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'tambah' ? 'bg-green-700 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                            }`}
                    >
                        <FontAwesomeIcon icon={mode === 'tambah' ? faPlus : faMinus} className="mr-2" />
                        {loading ? 'Memproses...' : mode === 'tambah' ? 'Tambah Poin' : 'Kurangi Poin'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component untuk mengatur sistem poin
const PengaturanSistemPoin = ({ isOpen, onClose, onSave, settings, showToast }) => {
    const [formData, setFormData] = useState({
        pointValue: 500,
        minExchange: 100,
        minTransactionForPoints: 25000,
        level2MinPoints: 500,
        level3MinPoints: 1000,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && settings) {
            setFormData(settings);
        }
    }, [isOpen, settings]);

    // Format number to Rupiah dengan titik sebagai pemisah ribuan
    const formatRupiah = (value) => {
        if (!value && value !== 0) return '';
        const numberString = value.toString().replace(/\D/g, '');
        if (!numberString) return '';
        const formatted = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return formatted;
    };

    // Parse Rupiah string to number
    const parseRupiah = (rupiahString) => {
        if (!rupiahString) return 0;
        const numericString = rupiahString.toString().replace(/\./g, '').replace(/\D/g, '');
        return parseInt(numericString) || 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Special handling for Rupiah fields
        if (name === 'minTransactionForPoints') {
            const formatted = formatRupiah(value);
            setFormData(prev => ({
                ...prev,
                [name]: formatted
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const settingsToSave = {
                ...formData,
                minTransactionForPoints: parseRupiah(formData.minTransactionForPoints),
                pointValue: parseInt(formData.pointValue) || 500,
                minExchange: parseInt(formData.minExchange) || 100,
                level2MinPoints: parseInt(formData.level2MinPoints) || 500,
                level3MinPoints: parseInt(formData.level3MinPoints) || 1000
            };

            await onSave(settingsToSave);
            showToast('Pengaturan berhasil disimpan!', 'success');
            onClose();
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Gagal menyimpan pengaturan: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
                className="absolute inset-0 bg-gray-900/60"
                onClick={onClose}
            ></div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-green-700 p-6 text-white relative">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-md">
                            <FontAwesomeIcon icon={faCog} className="text-xl text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Pengaturan Sistem Poin</h3>
                            <p className="text-green-100 text-sm mt-1">
                                Atur konversi poin dan level member
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-green-600 rounded-lg transition-all duration-300 shadow-sm"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Minimum Transaksi untuk Poin */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faReceipt} className="text-green-500 mr-3" />
                                Minimum Transaksi untuk Poin
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimal Transaksi untuk Dapat Poin
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                        <input
                                            type="text"
                                            name="minTransactionForPoints"
                                            value={formData.minTransactionForPoints || ''}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white shadow-sm"
                                            placeholder="25.000"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Minimum nilai transaksi untuk mendapatkan poin
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Konversi Poin untuk Potongan Harga */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faPercentage} className="text-blue-500 mr-3" />
                                Konversi Poin untuk Potongan Harga
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nilai 1 Poin (Rupiah)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                                        <input
                                            type="number"
                                            name="pointValue"
                                            value={formData.pointValue || ''}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm"
                                            placeholder="500"
                                            min="1"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Nilai 1 poin untuk perhitungan potongan harga
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimal Penukaran Poin
                                    </label>
                                    <input
                                        type="number"
                                        name="minExchange"
                                        value={formData.minExchange || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm"
                                        placeholder="100"
                                        min="1"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Minimum poin yang bisa ditukar untuk potongan harga
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Level Member Berdasarkan Poin */}
                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faStar} className="text-purple-500 mr-3" />
                                Level Member Berdasarkan Poin
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimal Poin untuk Level 2 (Premium)
                                    </label>
                                    <input
                                        type="number"
                                        name="level2MinPoints"
                                        value={formData.level2MinPoints || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white shadow-sm"
                                        placeholder="500"
                                        min="1"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Pelanggan akan naik ke Level 2 (Premium) jika poin mencapai nilai ini. Diskon: 5%
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimal Poin untuk Level 3 (Gold)
                                    </label>
                                    <input
                                        type="number"
                                        name="level3MinPoints"
                                        value={formData.level3MinPoints || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white shadow-sm"
                                        placeholder="1000"
                                        min="1"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Pelanggan akan naik ke Level 3 (Gold) jika poin mencapai nilai ini. Diskon: 10%
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                                    <div className="flex items-start">
                                        <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600 mt-0.5 mr-3" />
                                        <div className="text-sm text-yellow-800">
                                            <strong>Info:</strong> Level member akan otomatis naik atau turun berdasarkan jumlah poin yang dimiliki.
                                            Jika poin berkurang (karena penukaran), level akan otomatis turun jika tidak memenuhi syarat.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-sm"
                    >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Batal
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-sm"
                    >
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        {loading ? "Menyimpan..." : "Simpan Pengaturan"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SistemPoin = () => {
    const [pelangganData, setPelangganData] = useState([]);
    const [filteredPelanggan, setFilteredPelanggan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Toast state
    const [toasts, setToasts] = useState([]);

    // Modal states
    const [showTambahPoinModal, setShowTambahPoinModal] = useState(false);
    const [showKurangiPoinModal, setShowKurangiPoinModal] = useState(false);
    const [selectedPelanggan, setSelectedPelanggan] = useState(null);

    // Calculator state
    const [calculatorPoints, setCalculatorPoints] = useState('');

    // Settings state dengan default values
    const [settings, setSettings] = useState({
        pointValue: 500,
        minExchange: 100,
        minTransactionForPoints: 25000,
        level2MinPoints: 500,
        level3MinPoints: 1000,
    });

    // Toast functions
    const showToast = (message, type = 'success', duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };
        setToasts(prev => [...prev, toast]);

        // Auto remove after duration
        setTimeout(() => {
            removeToast(id);
        }, duration);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Load pelanggan data and settings from backend
    useEffect(() => {
        loadPelanggan();
        loadSettings();
    }, []);

    // Filter pelanggan data when search term changes
    useEffect(() => {
        console.log('Search term changed:', searchTerm);
        console.log('Pelanggan data:', pelangganData);

        if (searchTerm.trim() === '') {
            setFilteredPelanggan(pelangganData);
        } else {
            const filtered = pelangganData.filter(pelanggan => {
                const nama = pelanggan.nama || pelanggan.Nama || '';
                const id = pelanggan.id || pelanggan.ID || '';

                return (
                    nama.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                    id.toString().toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
            console.log('Filtered results:', filtered);
            setFilteredPelanggan(filtered);
        }
    }, [searchTerm, pelangganData]);

    const loadPelanggan = async () => {
        try {
            setLoading(true);
            console.log('Loading pelanggan data...');
            const data = await pelangganAPI.getAll();
            console.log('Loaded pelanggan data:', data);

            // Ensure data is an array
            const pelangganArray = Array.isArray(data) ? data : [];
            setPelangganData(pelangganArray);
            setFilteredPelanggan(pelangganArray);
        } catch (error) {
            console.error('Failed to load pelanggan:', error);
            showToast('Gagal memuat data pelanggan: ' + error.message, 'error');
            setPelangganData([]);
            setFilteredPelanggan([]);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await settingsAPI.getPoinSettings();
            if (data) {
                setSettings({
                    pointValue: data.pointValue || 500,
                    minExchange: data.minExchange || 100,
                    minTransactionForPoints: data.minTransactionForPoints || 25000,
                    level2MinPoints: data.level2MinPoints || 500,
                    level3MinPoints: data.level3MinPoints || 1000,
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            showToast('Gagal memuat pengaturan sistem poin', 'warning');
        }
    };

    // Calculate statistics based on ALL data (not filtered)
    const stats = useMemo(() => {
        const totalPoin = pelangganData.reduce((sum, p) => sum + (p.poin || p.Poin || 0), 0);
        const totalMembers = pelangganData.length;
        const averagePoints = totalMembers > 0 ? Math.round(totalPoin / totalMembers) : 0;
        const potentialDiscount = totalPoin * (settings.pointValue || 500);

        // Level distribution
        const level1Members = pelangganData.filter(p => (p.level || p.Level) === 1).length;
        const level2Members = pelangganData.filter(p => (p.level || p.Level) === 2).length;
        const level3Members = pelangganData.filter(p => (p.level || p.Level) === 3).length;

        // Top members by points (from all data)
        const topMembers = [...pelangganData]
            .sort((a, b) => ((b.poin || b.Poin || 0) - (a.poin || a.Poin || 0)))
            .slice(0, 5);

        return {
            totalPoin,
            totalMembers,
            averagePoints,
            potentialDiscount,
            level1Members,
            level2Members,
            level3Members,
            topMembers
        };
    }, [pelangganData, settings.pointValue]);

    // Calculator function for discount
    const calculateDiscount = (points) => {
        if (!points) return '0';
        const discount = points * (settings.pointValue || 500);
        return discount >= 0 ? discount.toLocaleString('id-ID') : '0';
    };

    // Handle settings save
    const handleSaveSettings = async (newSettings) => {
        try {
            const settingsData = {
                pointValue: parseInt(newSettings.pointValue) || 500,
                minExchange: parseInt(newSettings.minExchange) || 100,
                minTransactionForPoints: parseInt(newSettings.minTransactionForPoints) || 25000,
                level2MinPoints: parseInt(newSettings.level2MinPoints) || 500,
                level3MinPoints: parseInt(newSettings.level3MinPoints) || 1000,
            };

            const updatedSettings = await settingsAPI.updatePoinSettings(settingsData);

            if (updatedSettings) {
                setSettings(newSettings);
                return true;
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    };

    // Handle tambah poin
    const handleTambahPoin = (pelanggan) => {
        setSelectedPelanggan(pelanggan);
        setShowTambahPoinModal(true);
    };

    // Handle kurangi poin
    const handleKurangiPoin = (pelanggan) => {
        setSelectedPelanggan(pelanggan);
        setShowKurangiPoinModal(true);
    };

    // Handle modal close with reload
    const handleModalClose = (shouldReload) => {
        setShowTambahPoinModal(false);
        setShowKurangiPoinModal(false);
        setSelectedPelanggan(null);

        if (shouldReload) {
            loadPelanggan();
        }
    };

    // Get level badge color and icon
    const getLevelInfo = (level) => {
        const levelNum = level || 1;
        switch (levelNum) {
            case 3:
                return {
                    color: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                    icon: faCrown,
                    label: 'LEVEL 3 - GOLD'
                };
            case 2:
                return {
                    color: 'bg-blue-100 text-blue-800 border border-blue-300',
                    icon: faAward,
                    label: 'LEVEL 2 - PREMIUM'
                };
            default:
                return {
                    color: 'bg-green-100 text-green-800 border border-green-300',
                    icon: faUserCircle,
                    label: 'LEVEL 1 - REGULAR'
                };
        }
    };

    // Get rank icon
    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return faTrophy;
            case 2: return faMedal;
            case 3: return faAward;
            default: return faStar;
        }
    };

    // Get rank color
    const getRankColor = (rank) => {
        switch (rank) {
            case 1: return 'text-yellow-500';
            case 2: return 'text-gray-400';
            case 3: return 'text-orange-500';
            default: return 'text-blue-500';
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchTerm('');
    };

    // Safe data access functions
    const getPelangganNama = (pelanggan) => {
        return pelanggan.nama || pelanggan.Nama || `Pelanggan ${pelanggan.id || pelanggan.ID || ''}`;
    };

    const getPelangganId = (pelanggan) => {
        return pelanggan.id || pelanggan.ID || '';
    };

    const getPelangganPoin = (pelanggan) => {
        return pelanggan.poin || pelanggan.Poin || 0;
    };

    const getPelangganLevel = (pelanggan) => {
        return pelanggan.level || pelanggan.Level || 1;
    };

    const getPelangganTotalBelanja = (pelanggan) => {
        return pelanggan.totalBelanja || pelanggan.TotalBelanja || 0;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Toast Container */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-green-700 p-4 rounded-2xl shadow-lg">
                            <FontAwesomeIcon icon={faCoins} className="text-white text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Sistem Poin Loyalitas</h2>
                            <p className="text-gray-600 mt-1">Kelola program loyalitas dengan 3 level member yang eksklusif</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center space-x-2 font-medium shadow-lg border border-green-600"
                    >
                        <FontAwesomeIcon icon={faCog} />
                        <span>Pengaturan Sistem</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards dengan layout 2x2 */}
            <StatisticsCards stats={stats} />

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    <p className="text-gray-500 mt-4">Memuat data pelanggan...</p>
                </div>
            )}

            {/* Main Content Grid */}
            {!loading && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                    {/* Leaderboard */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 border-b border-green-600">
                            <div className="flex items-center space-x-3">
                                <FontAwesomeIcon icon={faTrophy} className="text-white text-lg" />
                                <h3 className="text-lg font-semibold text-white">Top 5 Leaderboard</h3>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {stats.topMembers.slice(0, 5).map((member, index) => {
                                    const levelInfo = getLevelInfo(getPelangganLevel(member));
                                    return (
                                        <div
                                            key={getPelangganId(member) || index}
                                            className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-400 transition-all duration-300 hover:shadow-sm"
                                        >
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-100 border-2 border-yellow-300' :
                                                index === 1 ? 'bg-gray-100 border-2 border-gray-300' :
                                                    index === 2 ? 'bg-orange-100 border-2 border-orange-300' : 'bg-blue-100 border-2 border-blue-300'
                                                }`}>
                                                <FontAwesomeIcon
                                                    icon={getRankIcon(index + 1)}
                                                    className={`text-lg ${getRankColor(index + 1)}`}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className="font-semibold text-gray-800 text-sm truncate">
                                                        {getPelangganNama(member)}
                                                    </h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
                                                        {levelInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Total Belanja: Rp {getPelangganTotalBelanja(member).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center space-x-2">
                                                    <FontAwesomeIcon icon={faCoins} className="text-yellow-500 text-sm" />
                                                    <span className="font-bold text-gray-800 text-lg">
                                                        {getPelangganPoin(member)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">poin</p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {stats.topMembers.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <FontAwesomeIcon icon={faUsers} className="text-4xl mb-2" />
                                        <p>Belum ada data pelanggan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Member List dengan aksi - TANPA PAGINATION */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faUsers} className="text-white text-lg" />
                                    <h3 className="text-lg font-semibold text-white">Daftar Semua Member</h3>
                                </div>
                                <div className="text-blue-100 text-xs bg-blue-600 px-3 py-1 rounded-full font-medium border border-blue-400">
                                    Total: {pelangganData.length} member
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="Cari member berdasarkan nama atau ID..."
                                />
                                {searchTerm && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                                    </button>
                                )}
                            </div>
                            {searchTerm && (
                                <div className="mt-2 text-sm text-gray-600">
                                    Menampilkan {filteredPelanggan.length} dari {pelangganData.length} member
                                    {filteredPelanggan.length === 0 && (
                                        <span className="text-red-500 ml-2"> - Tidak ada hasil yang cocok</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {filteredPelanggan.map((pelanggan, index) => {
                                    const levelInfo = getLevelInfo(getPelangganLevel(pelanggan));
                                    return (
                                        <div
                                            key={getPelangganId(pelanggan) || index}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-400 transition-all duration-300 hover:shadow-sm"
                                        >
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                                                    <FontAwesomeIcon
                                                        icon={levelInfo.icon}
                                                        className={`text-base ${getPelangganLevel(pelanggan) === 3 ? 'text-yellow-500' :
                                                            getPelangganLevel(pelanggan) === 2 ? 'text-blue-500' : 'text-green-500'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h4 className="font-semibold text-gray-800 text-sm">
                                                            {getPelangganNama(pelanggan)}
                                                        </h4>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
                                                            {levelInfo.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <FontAwesomeIcon icon={faCoins} className="text-yellow-500 text-sm" />
                                                        <span className="text-sm font-bold text-gray-800">
                                                            {getPelangganPoin(pelanggan)} poin
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleTambahPoin(pelanggan)}
                                                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all border border-green-200 hover:border-green-300"
                                                    title="Tambah Poin"
                                                >
                                                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleKurangiPoin(pelanggan)}
                                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all border border-red-200 hover:border-red-300"
                                                    title="Kurangi Poin"
                                                >
                                                    <FontAwesomeIcon icon={faMinus} className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredPelanggan.length === 0 && !loading && (
                                    <div className="text-center py-8 text-gray-500">
                                        {searchTerm ? (
                                            <>
                                                <FontAwesomeIcon icon={faSearch} className="text-4xl mb-2" />
                                                <p>Tidak ada member yang cocok dengan pencarian "{searchTerm}"</p>
                                                <button
                                                    onClick={handleClearSearch}
                                                    className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                                                >
                                                    Tampilkan semua member
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faUsers} className="text-4xl mb-2" />
                                                <p>Belum ada data pelanggan</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Discount Calculator */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 border-b border-purple-600">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faCalculator} className="text-white text-lg" />
                        <h3 className="text-lg font-semibold text-white">Kalkulator Potongan Harga</h3>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Jumlah Poin yang Akan Ditukar
                                </label>
                                <input
                                    type="number"
                                    placeholder="Masukkan jumlah poin"
                                    value={calculatorPoints}
                                    onChange={(e) => setCalculatorPoints(e.target.value)}
                                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-1 focus:ring-purple-400 focus:border-purple-400 bg-white text-base shadow-sm"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Minimal penukaran: {settings.minExchange} poin
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-sm" />
                                    <span className="text-sm font-medium text-blue-700">Informasi Konversi</span>
                                </div>
                                <p className="text-xs text-blue-600">
                                    <strong>1 Poin = Rp {(settings.pointValue || 500).toLocaleString('id-ID')}</strong>
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Dapatkan 1 poin setiap belanja Rp 10.000
                                </p>
                            </div>
                        </div>

                        {/* Result Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Nilai Potongan yang Didapat
                                </label>
                                <div className={`w-full px-6 py-6 border-2 rounded-xl text-center transition-all duration-300 ${calculatorPoints >= settings.minExchange
                                    ? 'bg-green-50 border-green-400 shadow-sm'
                                    : 'bg-gray-50 border-gray-300'
                                    }`}>
                                    <p className="text-3xl font-bold text-green-600 mb-3">
                                        Rp {calculateDiscount(calculatorPoints)}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        dari <strong>{calculatorPoints || 0} poin</strong>
                                    </p>

                                    {calculatorPoints > 0 && calculatorPoints < settings.minExchange && (
                                        <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                            <p className="text-sm text-yellow-700">
                                                ⚠️ Minimal penukaran adalah {settings.minExchange} poin
                                            </p>
                                        </div>
                                    )}

                                    {calculatorPoints >= settings.minExchange && (
                                        <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                                            <p className="text-sm text-green-700">
                                                ✅ Poin dapat ditukarkan untuk potongan harga
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TambahKurangiPoinModal
                isOpen={showTambahPoinModal}
                onClose={handleModalClose}
                pelanggan={selectedPelanggan}
                mode="tambah"
                showToast={showToast}
            />

            <TambahKurangiPoinModal
                isOpen={showKurangiPoinModal}
                onClose={handleModalClose}
                pelanggan={selectedPelanggan}
                mode="kurangi"
                showToast={showToast}
            />

            {/* Settings Popup */}
            <PengaturanSistemPoin
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={handleSaveSettings}
                settings={settings}
                showToast={showToast}
            />
        </div>
    );
};

export default SistemPoin;