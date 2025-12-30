import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus,
    faUsers,
    faCrown,
    faStar,
    faUser,
    faPercent,
    faCoins,
    faPhone,
    faEnvelope,
    faMapMarkerAlt,
    faInfoCircle,
    faTimes,
    faIdCard,
    faSave,
    faSearch,
    faEye,
    faEdit,
    faCalendar,
    faReceipt,
    faShoppingCart,
    faMoneyBillWave,
    faHistory,
    faChartLine,
    faAward,
    faTrophy,
    faFilter,
    faUserCircle,
    faChevronDown,
    faCheck,
    faSync,
    faExclamationTriangle,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { pelangganAPI, transaksiAPI } from '../../../api';
import Pagination from '../../common/Pagination';
import Toast from '../../common/Toast';

// CustomSelect Component
const CustomSelect = ({
    name,
    value,
    onChange,
    options = [],
    placeholder = "Pilih...",
    label,
    icon,
    size = "md",
    disabled = false,
    error = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({
            target: {
                name: name,
                value: optionValue
            }
        });
        setIsOpen(false);
    };

    const getSelectedLabel = () => {
        if (!value) return placeholder;
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    // Size classes
    const sizeClasses = {
        sm: "py-2 px-3 text-sm",
        md: "py-3 px-4 text-sm",
        lg: "py-4 px-4 text-base"
    };

    const optionSizeClasses = {
        sm: "py-2 px-3 text-sm",
        md: "py-2 px-4 text-sm",
        lg: "py-3 px-4 text-base"
    };

    return (
        <div className="w-full">
            {label && (
                <label className={`block text-xs font-semibold text-gray-700 mb-2 ${error ? 'text-red-600' : ''}`}>
                    {label}
                </label>
            )}

            <div className="relative" ref={dropdownRef}>
                {/* Trigger Button */}
                <button
                    type="button"
                    className={`w-full flex items-center justify-between border rounded-lg transition-all duration-200 bg-white
                        ${error ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500' :
                            'border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500'}
                        ${sizeClasses[size]}
                        ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400 cursor-pointer'}
                    `}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        {icon && (
                            <FontAwesomeIcon
                                icon={icon}
                                className={`${error ? 'text-red-500' : 'text-gray-400'} flex-shrink-0`}
                            />
                        )}
                        <span className={`truncate ${!value ? 'text-gray-500' : 'text-gray-800'}`}>
                            {getSelectedLabel()}
                        </span>
                    </div>

                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} flex-shrink-0`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl shadow-gray-200/80 backdrop-blur-sm max-h-60 overflow-y-auto">
                        <div className="py-2">
                            {options.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    Tidak ada pilihan tersedia
                                </div>
                            ) : (
                                options.map((option, index) => (
                                    <div
                                        key={option.value || index}
                                        className={`
                                            flex items-center justify-between px-4 cursor-pointer transition-all duration-200
                                            ${optionSizeClasses[size]}
                                            ${value === option.value
                                                ? 'bg-green-50 text-green-700 font-semibold'
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }
                                            ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}
                                        `}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            {/* Option Icon */}
                                            {option.icon && (
                                                <FontAwesomeIcon
                                                    icon={option.icon}
                                                    className={`text-sm flex-shrink-0 ${value === option.value ? 'text-green-600' : 'text-gray-400'
                                                        }`}
                                                />
                                            )}

                                            {/* Option Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {option.label}
                                                </div>
                                                {option.description && (
                                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Checkmark for selected option */}
                                        {value === option.value && (
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                className="text-green-600 text-sm flex-shrink-0 ml-2"
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
};

// Popup Component untuk Tambah Pelanggan
const TambahPelangganPopup = ({ isOpen, onClose, onSave, showToast }) => {
    const [formData, setFormData] = useState({
        nama: '',
        telepon: '',
        email: '',
        alamat: '',
        level: 1,
        poin: 0
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Reset form when popup opens
    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                nama: '',
                telepon: '',
                email: '',
                alamat: '',
                level: 1,
                poin: 0
            });
            setErrors({});
        }
    }, [isOpen]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.nama.trim()) {
            newErrors.nama = 'Nama pelanggan harus diisi';
        }

        if (!formData.telepon.trim()) {
            newErrors.telepon = 'Nomor telepon harus diisi';
        } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.telepon)) {
            newErrors.telepon = 'Format nomor telepon tidak valid';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Terdapat kesalahan dalam pengisian form', 'warning');
            return;
        }

        setLoading(true);

        try {
            const pelangganData = {
                nama: formData.nama.trim(),
                telepon: formData.telepon.trim(),
                email: formData.email.trim(),
                alamat: formData.alamat.trim(),
                level: parseInt(formData.level),
                poin: parseInt(formData.poin) || 0
            };

            console.log('🔄 Creating customer:', pelangganData);
            await onSave(pelangganData);
            showToast('Pelanggan berhasil ditambahkan!', 'success');
            onClose();
        } catch (error) {
            console.error('❌ Error saving customer:', error);

            let errorMessage = 'Gagal menyimpan pelanggan';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }

            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Level options sesuai sistem poin
    const levelOptions = [
        { value: 1, label: 'LEVEL 1', icon: faUserCircle, color: 'text-green-600', bgColor: 'bg-green-100', description: 'Member Regular' },
        { value: 2, label: 'LEVEL 2', icon: faAward, color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'Member Premium' },
        { value: 3, label: 'LEVEL 3', icon: faCrown, color: 'text-yellow-600', bgColor: 'bg-yellow-100', description: 'Member Gold' }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
            <div
                className="absolute inset-0 bg-gray-900/60"
                onClick={onClose}
            ></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-green-700 p-6 text-white relative">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-md">
                            <FontAwesomeIcon icon={faUserPlus} className="text-xl text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">
                                Tambah Pelanggan Baru
                            </h3>
                            <p className="text-green-100 text-sm mt-1">
                                Isi data pelanggan dengan lengkap dan benar
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-green-600 rounded-lg transition-all duration-300 shadow-sm"
                        title="Tutup"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit}>
                        {/* Informasi Dasar */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faIdCard} className="text-blue-500 mr-3" />
                                Informasi Dasar
                            </h4>

                            <div className="space-y-4">
                                {/* Nama Pelanggan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Pelanggan <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            className="absolute left-4 top-3.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            name="nama"
                                            value={formData.nama}
                                            onChange={handleInputChange}
                                            className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white shadow-sm ${errors.nama ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Masukkan nama lengkap pelanggan"
                                            required
                                        />
                                    </div>
                                    {errors.nama && (
                                        <p className="mt-1 text-xs text-red-600">{errors.nama}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Telepon */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nomor Telepon <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FontAwesomeIcon
                                                icon={faPhone}
                                                className="absolute left-4 top-3.5 text-gray-400"
                                            />
                                            <input
                                                type="tel"
                                                name="telepon"
                                                value={formData.telepon}
                                                onChange={handleInputChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white shadow-sm ${errors.telepon ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="08123456789"
                                                required
                                            />
                                        </div>
                                        {errors.telepon && (
                                            <p className="mt-1 text-xs text-red-600">{errors.telepon}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <FontAwesomeIcon
                                                icon={faEnvelope}
                                                className="absolute left-4 top-3.5 text-gray-400"
                                            />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white shadow-sm ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="pelanggan@email.com"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Level Member */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faChartLine} className="text-purple-500 mr-3" />
                                Level Member
                            </h4>

                            <div className="space-y-3">
                                {levelOptions.map((level) => (
                                    <label
                                        key={level.value}
                                        className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${parseInt(formData.level) === level.value
                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                            : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="level"
                                            value={level.value}
                                            checked={parseInt(formData.level) === level.value}
                                            onChange={handleInputChange}
                                            className="text-green-500 focus:ring-green-500"
                                        />
                                        <div className={`p-3 rounded-lg ${level.bgColor} shadow-sm`}>
                                            <FontAwesomeIcon icon={level.icon} className={`text-lg ${level.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-800">{level.label}</div>
                                            <div className="text-xs text-gray-500">
                                                {level.description}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Poin Awal */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faCoins} className="text-yellow-500 mr-3" />
                                Poin Awal
                            </h4>
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faCoins}
                                    className="absolute left-4 top-3.5 text-yellow-500"
                                />
                                <input
                                    type="number"
                                    name="poin"
                                    value={formData.poin}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white shadow-sm"
                                    placeholder="0"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Poin awal yang diberikan kepada member baru
                            </p>
                        </div>

                        {/* Alamat Card */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500 mr-3" />
                                Alamat
                            </h4>
                            <textarea
                                name="alamat"
                                value={formData.alamat}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white resize-none shadow-sm"
                                placeholder="Masukkan alamat lengkap pelanggan (opsional)"
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-2">
                                Alamat untuk pengiriman atau korespondensi
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer - Action Buttons */}
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
                        className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        {loading ? 'Menyimpan...' : 'Simpan Pelanggan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Popup Component untuk Detail Pelanggan
const DetailPelangganPopup = ({ isOpen, onClose, pelanggan, onEdit, onDelete, showToast }) => {
    const [pelangganDetail, setPelangganDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [transaksiHistory, setTransaksiHistory] = useState([]);

    // Load customer details and transaction history when popup opens
    useEffect(() => {
        if (isOpen && pelanggan) {
            loadPelangganDetail();
        }
    }, [isOpen, pelanggan]);

    const loadPelangganDetail = async () => {
        if (!pelanggan) return;

        setLoading(true);
        try {
            // Try to get customer with complete stats and history
            let detail = null;
            let history = [];

            // First try: Get customer with complete stats
            if (window.go && window.go.main && window.go.main.App && window.go.main.App.GetPelangganWithStats) {
                try {
                    detail = await window.go.main.App.GetPelangganWithStats(pelanggan.id.toString());
                    console.log('✅ Customer detail loaded:', detail);
                } catch (error) {
                    console.warn('❌ Failed to load customer details:', error);
                }
            }

            // Second try: Get transaction history separately
            if (window.go && window.go.main && window.go.main.App && window.go.main.App.GetTransaksiByPelanggan) {
                try {
                    history = await window.go.main.App.transaksiAPI.getByPelanggan(parseInt(pelanggan.id));
                    console.log('✅ Transaction history loaded:', history.length, 'transactions');
                } catch (error) {
                    console.warn('❌ Failed to load transaction history:', error);
                }
            }

            // Fallback if no data from backend
            if (!detail) {
                detail = {
                    pelanggan: pelanggan,
                    stats: {
                        totalTransaksi: pelanggan.totalTransaksi || 0,
                        totalBelanja: pelanggan.totalBelanja || 0,
                        rataRataBelanja: pelanggan.totalTransaksi > 0 ? Math.round((pelanggan.totalBelanja || 0) / pelanggan.totalTransaksi) : 0
                    },
                    transaksiHistory: []
                };
            }

            // Use transaction history from separate call or from detail
            if (history.length > 0) {
                setTransaksiHistory(history);
            } else if (detail.transaksiHistory && detail.transaksiHistory.length > 0) {
                setTransaksiHistory(detail.transaksiHistory);
            } else {
                setTransaksiHistory([]);
            }

            setPelangganDetail(detail);

        } catch (error) {
            console.error('❌ Error loading customer details:', error);
            showToast('Gagal memuat detail pelanggan', 'error');

            // Set fallback data
            setPelangganDetail({
                pelanggan: pelanggan,
                stats: {
                    totalTransaksi: pelanggan.totalTransaksi || 0,
                    totalBelanja: pelanggan.totalBelanja || 0,
                    rataRataBelanja: 0
                },
                transaksiHistory: []
            });
            setTransaksiHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // Get level info sesuai sistem poin
    const getLevelInfo = (level) => {
        const levelNum = parseInt(level);
        switch (levelNum) {
            case 3:
                return {
                    color: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                    icon: faCrown,
                    label: 'LEVEL 3',
                    description: 'Member Gold'
                };
            case 2:
                return {
                    color: 'bg-blue-100 text-blue-800 border border-blue-300',
                    icon: faAward,
                    label: 'LEVEL 2',
                    description: 'Member Premium'
                };
            default:
                return {
                    color: 'bg-green-100 text-green-800 border border-green-300',
                    icon: faUserCircle,
                    label: 'LEVEL 1',
                    description: 'Member Regular'
                };
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '-';
        }
    };

    // Format currency
    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    if (!isOpen || !pelanggan) return null;

    const levelInfo = getLevelInfo(pelanggan.level);
    const stats = pelangganDetail?.stats || {
        totalTransaksi: pelanggan.totalTransaksi || 0,
        totalBelanja: pelanggan.totalBelanja || 0,
        rataRataBelanja: 0
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
                className="absolute inset-0 bg-gray-900/60"
                onClick={onClose}
            ></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl relative z-10 border border-gray-200 max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-green-700 p-6 text-white relative">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-md">
                                <FontAwesomeIcon
                                    icon={levelInfo.icon}
                                    className={`text-xl ${pelanggan.level === 3 ? 'text-yellow-500' :
                                        pelanggan.level === 2 ? 'text-blue-500' : 'text-green-500'
                                        }`}
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">
                                    Detail Pelanggan
                                </h3>
                                <p className="text-green-100 text-sm mt-1">
                                    Informasi lengkap data pelanggan dan riwayat transaksi
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onEdit(pelanggan)}
                                className="px-4 py-2 bg-white text-green-500 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 hover:bg-green-50 shadow-sm"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                <span>Edit</span>
                            </button>
                            {/* <button
                                onClick={() => onDelete(pelanggan)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 hover:bg-red-600 shadow-sm"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                                <span>Hapus</span>
                            </button> */}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-green-600 rounded-lg transition-all duration-300 shadow-sm"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                            <span className="ml-3 text-gray-600">Memuat data pelanggan...</span>
                        </div>
                    ) : (
                        <>
                            {/* Customer Profile Section */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faIdCard} className="text-blue-500 mr-3" />
                                    Informasi Pelanggan
                                </h4>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">{pelanggan.nama}</h2>
                                            <p className="text-gray-600">ID: {pelanggan.id}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelInfo.color}`}>
                                            {levelInfo.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <FontAwesomeIcon icon={faPhone} className="text-green-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Telepon</p>
                                                <p className="font-medium text-gray-800">{pelanggan.telepon || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <FontAwesomeIcon icon={faEnvelope} className="text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <p className="font-medium text-gray-800">{pelanggan.email || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <FontAwesomeIcon icon={faCalendar} className="text-purple-500" />
                                            <div>
                                                <p className="text-sm text-gray-500">Bergabung Sejak</p>
                                                <p className="font-medium text-gray-800">
                                                    {formatDate(pelanggan.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {pelanggan.alamat && (
                                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500 mt-1" />
                                            <div>
                                                <p className="text-sm text-gray-500">Alamat</p>
                                                <p className="font-medium text-gray-800">{pelanggan.alamat}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Statistics Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Total Transaksi */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Total Transaksi</p>
                                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalTransaksi}</p>
                                            <p className="text-green-600 text-sm mt-2 font-medium">
                                                Seluruh transaksi
                                            </p>
                                        </div>
                                        <div className="bg-green-100 p-3 rounded-xl">
                                            <FontAwesomeIcon icon={faReceipt} className="text-green-500 text-xl" />
                                        </div>
                                    </div>
                                </div>

                                {/* Total Belanja */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Total Belanja</p>
                                            <p className="text-2xl font-bold text-gray-800 mt-2">
                                                {formatRupiah(stats.totalBelanja)}
                                            </p>
                                            <p className="text-blue-600 text-sm mt-2 font-medium">
                                                Nilai kumulatif
                                            </p>
                                        </div>
                                        <div className="bg-blue-100 p-3 rounded-xl">
                                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-blue-500 text-xl" />
                                        </div>
                                    </div>
                                </div>

                                {/* Rata-rata Belanja */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium">Rata-rata Belanja</p>
                                            <p className="text-2xl font-bold text-gray-800 mt-2">
                                                {formatRupiah(stats.rataRataBelanja)}
                                            </p>
                                            <p className="text-purple-600 text-sm mt-2 font-medium">
                                                Per transaksi
                                            </p>
                                        </div>
                                        <div className="bg-purple-100 p-3 rounded-xl">
                                            <FontAwesomeIcon icon={faChartLine} className="text-purple-500 text-xl" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Level & Poin Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Level Information */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faChartLine} className="text-purple-500 mr-3" />
                                        Informasi Level
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 border-2 border-gray-200 shadow-sm">
                                                    <FontAwesomeIcon
                                                        icon={levelInfo.icon}
                                                        className={`text-2xl ${pelanggan.level === 3 ? 'text-yellow-500' :
                                                            pelanggan.level === 2 ? 'text-blue-500' : 'text-green-500'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="text-xl font-bold text-gray-800 mb-1">{levelInfo.label}</div>
                                                <p className="text-sm text-gray-600">{levelInfo.description}</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-800 text-center">
                                                {pelanggan.level === 3 && 'Level Tertinggi - Nikmati benefit maksimal dari sistem poin'}
                                                {pelanggan.level === 2 && 'Level Menengah - Tingkatkan ke Level 3 untuk benefit lebih'}
                                                {pelanggan.level === 1 && 'Level Awal - Mulai kumpulkan poin dan naik level'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Poin Information */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faCoins} className="text-yellow-500 mr-3" />
                                        Statistik Poin
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                                                <FontAwesomeIcon icon={faCoins} className="text-yellow-500 text-xl" />
                                            </div>
                                            <div className="text-2xl font-bold text-yellow-600">{pelanggan.poin || 0}</div>
                                            <p className="text-sm text-gray-600 mt-1">Total Poin Saat Ini</p>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800 text-center">
                                                Poin dapat ditukar menjadi diskon atau digunakan untuk naik level
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History - REAL DATA */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center">
                                        <FontAwesomeIcon icon={faHistory} className="text-purple-500 mr-3" />
                                        Riwayat Transaksi
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                            {transaksiHistory.length} transaksi
                                        </span>
                                        <button
                                            onClick={loadPelangganDetail}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                                            title="Refresh data"
                                        >
                                            <FontAwesomeIcon icon={faSync} className="text-sm" />
                                        </button>
                                    </div>
                                </div>

                                {transaksiHistory.length > 0 ? (
                                    <div className="space-y-3">
                                        {transaksiHistory.map((transaksi) => (
                                            <div key={transaksi.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shadow-sm">
                                                        <FontAwesomeIcon icon={faReceipt} className="text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{transaksi.nomorTransaksi}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(transaksi.tanggal)} • {transaksi.kasir}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800">
                                                        {formatRupiah(transaksi.total)}
                                                    </p>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaksi.status === 'selesai'
                                                        ? 'bg-green-100 text-green-800'
                                                        : transaksi.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {transaksi.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <FontAwesomeIcon icon={faReceipt} className="text-gray-300 text-4xl mb-3" />
                                        <p className="text-gray-500 font-medium mb-2">Belum ada riwayat transaksi</p>
                                        <p className="text-sm text-gray-400">
                                            Transaksi yang dilakukan oleh pelanggan ini akan muncul di sini
                                        </p>
                                    </div>
                                )}


                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-sm"
                    >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

// Popup Component untuk Edit Pelanggan
const EditPelangganPopup = ({ isOpen, onClose, pelanggan, onSave, showToast }) => {
    const [formData, setFormData] = useState({
        nama: '',
        telepon: '',
        email: '',
        alamat: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Reset form when popup opens
    React.useEffect(() => {
        if (isOpen && pelanggan) {
            setFormData({
                nama: pelanggan.nama || '',
                telepon: pelanggan.telepon || '',
                email: pelanggan.email || '',
                alamat: pelanggan.alamat || ''
            });
            setErrors({});
        }
    }, [isOpen, pelanggan]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.nama.trim()) {
            newErrors.nama = 'Nama pelanggan harus diisi';
        }

        if (!formData.telepon.trim()) {
            newErrors.telepon = 'Nomor telepon harus diisi';
        } else if (!/^[0-9+\-\s()]{10,15}$/.test(formData.telepon)) {
            newErrors.telepon = 'Format nomor telepon tidak valid';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Terdapat kesalahan dalam pengisian form', 'warning');
            return;
        }

        setLoading(true);

        try {
            const updateData = {
                id: parseInt(pelanggan.id, 10),
                nama: formData.nama.trim(),
                telepon: formData.telepon.trim(),
                email: formData.email.trim(),
                alamat: formData.alamat.trim()
            };

            console.log('🔄 Updating customer:', updateData);
            await onSave(updateData);
            showToast('Pelanggan berhasil diupdate!', 'success');
            onClose();
        } catch (error) {
            console.error('❌ Error updating customer:', error);

            let errorMessage = 'Gagal mengupdate pelanggan';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }

            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !pelanggan) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
            <div
                className="absolute inset-0 bg-gray-900/60"
                onClick={onClose}
            ></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-blue-700 p-6 text-white relative">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-md">
                            <FontAwesomeIcon icon={faEdit} className="text-xl text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">
                                Edit Pelanggan
                            </h3>
                            <p className="text-blue-100 text-sm mt-1">
                                Update data pelanggan {pelanggan.nama}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-blue-600 rounded-lg transition-all duration-300 shadow-sm"
                        title="Tutup"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-sm" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit}>
                        {/* Informasi yang bisa diupdate */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faIdCard} className="text-blue-500 mr-3" />
                                Informasi yang Dapat Diupdate
                            </h4>

                            <div className="space-y-4">
                                {/* Nama Pelanggan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Pelanggan <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            className="absolute left-4 top-3.5 text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            name="nama"
                                            value={formData.nama}
                                            onChange={handleInputChange}
                                            className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm ${errors.nama ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Masukkan nama lengkap pelanggan"
                                            required
                                        />
                                    </div>
                                    {errors.nama && (
                                        <p className="mt-1 text-xs text-red-600">{errors.nama}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Telepon */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nomor Telepon <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FontAwesomeIcon
                                                icon={faPhone}
                                                className="absolute left-4 top-3.5 text-gray-400"
                                            />
                                            <input
                                                type="tel"
                                                name="telepon"
                                                value={formData.telepon}
                                                onChange={handleInputChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm ${errors.telepon ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="08123456789"
                                                required
                                            />
                                        </div>
                                        {errors.telepon && (
                                            <p className="mt-1 text-xs text-red-600">{errors.telepon}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <FontAwesomeIcon
                                                icon={faEnvelope}
                                                className="absolute left-4 top-3.5 text-gray-400"
                                            />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="pelanggan@email.com"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Alamat */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alamat
                                    </label>
                                    <textarea
                                        name="alamat"
                                        value={formData.alamat}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white resize-none shadow-sm"
                                        placeholder="Masukkan alamat lengkap pelanggan"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Informasi yang tidak bisa diupdate */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faInfoCircle} className="text-gray-500 mr-3" />
                                Informasi Sistem (Tidak Dapat Diubah)
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="text-gray-500">Level</label>
                                    <p className="font-medium text-gray-800">
                                        {pelanggan.level === 3 ? 'Level 3 (Gold)' :
                                            pelanggan.level === 2 ? 'Level 2 (Premium)' : 'Level 1 (Regular)'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-gray-500">Poin</label>
                                    <p className="font-medium text-gray-800">{pelanggan.poin || 0} poin</p>
                                </div>
                                <div>
                                    <label className="text-gray-500">Total Transaksi</label>
                                    <p className="font-medium text-gray-800">{pelanggan.totalTransaksi || 0}</p>
                                </div>
                                <div>
                                    <label className="text-gray-500">Bergabung Sejak</label>
                                    <p className="font-medium text-gray-800">
                                        {new Date(pelanggan.createdAt).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer - Action Buttons */}
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
                        className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        {loading ? 'Menyimpan...' : 'Update Pelanggan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const DaftarPelanggan = ({ pelangganData = [] }) => {
    // State management
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);
    const [showTambahPopup, setShowTambahPopup] = useState(false);
    const [showDetailPopup, setShowDetailPopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [selectedPelanggan, setSelectedPelanggan] = useState(null);
    const [localPelangganData, setLocalPelangganData] = useState([]);
    const [pelangganStats, setPelangganStats] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Toast state
    const [toasts, setToasts] = useState([]);

    // Toast functions
    const showToast = (message, type = 'success', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Load data pelanggan dari backend
    useEffect(() => {
        loadPelanggan();
    }, []);

    // Fungsi untuk memuat statistik pelanggan
    const loadPelangganStats = async (pelangganList) => {
        if (!pelangganList || pelangganList.length === 0) return;

        const statsMap = {};

        // Coba muat statistik untuk setiap pelanggan
        for (const pelanggan of pelangganList) {
            try {
                if (window.go && window.go.main && window.go.main.App && window.go.main.App.GetPelangganWithStats) {
                    const detail = await window.go.main.App.GetPelangganWithStats(pelanggan.id.toString());
                    if (detail && detail.stats) {
                        statsMap[pelanggan.id] = detail.stats;
                    }
                }
            } catch (error) {
                console.warn(`Failed to load stats for customer ${pelanggan.id}:`, error);
                // Gunakan data default jika gagal memuat
                statsMap[pelanggan.id] = {
                    totalTransaksi: pelanggan.totalTransaksi || 0,
                    totalBelanja: pelanggan.totalBelanja || 0,
                    rataRataBelanja: pelanggan.totalTransaksi > 0 ?
                        Math.round((pelanggan.totalBelanja || 0) / pelanggan.totalTransaksi) : 0
                };
            }
        }

        setPelangganStats(statsMap);
    };

    const loadPelanggan = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load data from backend (handles both web and desktop mode)
            console.log('🔄 Loading pelanggan from backend...');
            const data = await pelangganAPI.getAll();
            console.log('✅ Data loaded from backend:', data);

            // Validasi dan normalisasi data
            const validatedData = validateAndNormalizeData(data);
            setLocalPelangganData(validatedData);

            // Muat statistik pelanggan
            await loadPelangganStats(validatedData);

        } catch (error) {
            console.error('❌ Failed to load pelanggan:', error);
            setError('Gagal memuat data pelanggan: ' + error.message);
            showToast('Gagal memuat data pelanggan', 'error');
            setLocalPelangganData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk validasi dan normalisasi data
    const validateAndNormalizeData = (data) => {
        if (!data) {
            console.warn('Data is null or undefined, returning empty array');
            return [];
        }

        if (!Array.isArray(data)) {
            console.warn('Data is not an array, returning empty array');
            return [];
        }

        return data.map((item, index) => {
            // Jika item bukan object, buat default
            if (typeof item !== 'object' || item === null) {
                console.warn(`Invalid item at index ${index}, creating default`);
                return createDefaultPelanggan(index);
            }

            try {
                return {
                    id: parseInt(item.id) || 0,
                    nama: String(item.nama || 'Tidak ada nama'),
                    telepon: String(item.telepon || ''),
                    email: String(item.email || ''),
                    alamat: String(item.alamat || ''),
                    level: parseInt(item.level) || 1,
                    poin: parseInt(item.poin) || 0,
                    totalTransaksi: parseInt(item.totalTransaksi) || 0,
                    totalBelanja: parseFloat(item.totalBelanja) || 0,
                    createdAt: item.createdAt || new Date().toISOString(),
                    tipe: item.tipe || getTipeFromLevel(parseInt(item.level) || 1)
                };
            } catch (itemError) {
                console.warn(`Error processing item at index ${index}:`, itemError);
                return createDefaultPelanggan(index);
            }
        });
    };

    // Helper function untuk mendapatkan tipe dari level
    const getTipeFromLevel = (level) => {
        switch (level) {
            case 3: return 'gold';
            case 2: return 'premium';
            default: return 'reguler';
        }
    };

    // Fungsi untuk membuat data pelanggan default
    const createDefaultPelanggan = (index) => ({
        id: `pelanggan-${index + 1}`,
        nama: 'Tidak ada nama',
        telepon: '',
        email: '',
        alamat: '',
        level: 1,
        poin: 0,
        totalTransaksi: 0,
        totalBelanja: 0,
        createdAt: new Date().toISOString(),
        tipe: 'reguler'
    });

    // Data yang aman untuk digunakan
    const safePelangganData = useMemo(() => {
        return localPelangganData;
    }, [localPelangganData]);

    // Filter data berdasarkan pencarian dan level
    const filteredData = useMemo(() => {
        try {
            console.log('Filtering data:', {
                totalData: safePelangganData.length,
                searchTerm,
                levelFilter
            });

            let filtered = [...safePelangganData];

            // Filter berdasarkan level
            if (levelFilter !== 'all') {
                const filterLevel = parseInt(levelFilter);
                filtered = filtered.filter(pelanggan => {
                    const pelangganLevel = parseInt(pelanggan.level) || 1;
                    return pelangganLevel === filterLevel;
                });
            }

            // Filter berdasarkan pencarian
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase().trim();
                filtered = filtered.filter(pelanggan => {
                    try {
                        const searchFields = [
                            pelanggan.nama || '',
                            pelanggan.telepon || '',
                            pelanggan.email || '',
                            pelanggan.id || '',
                            pelanggan.alamat || ''
                        ];

                        return searchFields.some(field =>
                            field.toLowerCase().includes(term)
                        );
                    } catch (fieldError) {
                        console.warn('Error searching field:', fieldError, pelanggan);
                        return false;
                    }
                });
            }

            console.log('Filter result:', filtered.length, 'items');
            return filtered;

        } catch (filterError) {
            console.error('Error in filter:', filterError);
            showToast('Error dalam filter data', 'error');
            return [];
        }
    }, [safePelangganData, searchTerm, levelFilter]);

    // Calculate pagination
    const paginatedData = useMemo(() => {
        try {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            return filteredData.slice(startIndex, endIndex);
        } catch (error) {
            console.error('Error in pagination:', error);
            return [];
        }
    }, [filteredData, currentPage, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, levelFilter, filteredData.length]);

    // Pagination handlers
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Handle search
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle level filter change
    const handleLevelFilterChange = (value) => {
        setLevelFilter(value);
    };

    // Handle save new customer - PERBAIKAN UTAMA
    const handleSavePelanggan = async (pelangganData) => {
        try {
            console.log('🔄 Creating customer:', pelangganData);

            // Prepare request object (no need for model instance)
            const request = {
                nama: pelangganData.nama?.trim() || '',
                telepon: pelangganData.telepon?.trim() || '',
                email: pelangganData.email?.trim() || '',
                alamat: pelangganData.alamat?.trim() || '',
                level: parseInt(pelangganData.level) || 1,
                poin: parseInt(pelangganData.poin) || 0
            };

            console.log('📤 Sending request to backend:', request);

            // Panggil backend function dengan request object
            const result = await pelangganAPI.create(request);

            console.log('✅ Customer created successfully:', result);

            // Reload data
            await loadPelanggan();

            showToast('Pelanggan berhasil ditambahkan!', 'success');
            return result;

        } catch (error) {
            console.error('❌ Error saving customer:', error);

            let errorMessage = 'Gagal menyimpan pelanggan';
            if (error && error.message) {
                errorMessage += ': ' + error.message;
                if (error.details) {
                    errorMessage += ' (' + error.details + ')';
                }
            }

            showToast(errorMessage, 'error');
            throw error;
        }
    };

    // Handle update customer - PERBAIKAN UTAMA
    const handleUpdatePelanggan = async (pelangganData) => {
        try {
            console.log('🔄 Updating customer:', pelangganData);

            // Prepare update request object (no need for model instance)
            const request = {
                id: parseInt(pelangganData.id, 10),
                nama: pelangganData.nama?.trim() || '',
                telepon: pelangganData.telepon?.trim() || '',
                email: pelangganData.email?.trim() || '',
                alamat: pelangganData.alamat?.trim() || ''
            };

            console.log('📤 Sending update request:', request);

            const result = await pelangganAPI.update(request);

            console.log('✅ Customer updated successfully:', result);

            await loadPelanggan();
            showToast('Pelanggan berhasil diupdate!', 'success');
            return result;

        } catch (error) {
            console.error('❌ Error updating customer:', error);

            let errorMessage = 'Gagal mengupdate pelanggan';
            if (error && error.message) {
                errorMessage += ': ' + error.message;
            }

            showToast(errorMessage, 'error');
            throw error;
        }
    };

    // Handle delete customer
    const handleDeletePelanggan = async (pelanggan) => {
        const confirmDelete = window.confirm(
            `Apakah Anda yakin ingin menghapus pelanggan "${pelanggan.nama}"?\n\n` +
            `ID: ${pelanggan.id}\n` +
            `Telepon: ${pelanggan.telepon}\n\n` +
            `Tindakan ini tidak dapat dibatalkan!`
        );

        if (!confirmDelete) return;

        try {
            await pelangganAPI.delete(parseInt(pelanggan.id, 10));
            showToast(`Pelanggan "${pelanggan.nama}" berhasil dihapus!`, 'success');
            await loadPelanggan(); // Reload data
        } catch (error) {
            console.error('Error deleting customer:', error);
            showToast('Gagal menghapus pelanggan: ' + error.message, 'error');
        }
    };

    // Handle view detail
    const handleViewDetail = (pelanggan) => {
        setSelectedPelanggan(pelanggan);
        setShowDetailPopup(true);
    };

    // Handle edit customer
    const handleEditPelanggan = (pelanggan) => {
        setSelectedPelanggan(pelanggan);
        setShowEditPopup(true);
    };

    // Get level info sesuai sistem poin
    const getLevelInfo = (level) => {
        const levelNum = parseInt(level) || 1;
        switch (levelNum) {
            case 3:
                return {
                    color: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                    icon: faCrown,
                    label: 'LEVEL 3'
                };
            case 2:
                return {
                    color: 'bg-blue-100 text-blue-800 border border-blue-300',
                    icon: faAward,
                    label: 'LEVEL 2'
                };
            default:
                return {
                    color: 'bg-green-100 text-green-800 border border-green-300',
                    icon: faUserCircle,
                    label: 'LEVEL 1'
                };
        }
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const totalPelanggan = filteredData.length;
        const level1Count = filteredData.filter(p => (parseInt(p.level) || 1) === 1).length;
        const level2Count = filteredData.filter(p => (parseInt(p.level) || 1) === 2).length;
        const level3Count = filteredData.filter(p => (parseInt(p.level) || 1) === 3).length;
        const totalPoin = filteredData.reduce((sum, p) => sum + (parseInt(p.poin) || 0), 0);
        const averagePoin = totalPelanggan > 0 ? Math.round(totalPoin / totalPelanggan) : 0;

        return {
            totalPelanggan,
            level1Count,
            level2Count,
            level3Count,
            totalPoin,
            averagePoin
        };
    }, [filteredData]);

    // Clear search and filters
    const clearFilters = () => {
        setSearchTerm('');
        setLevelFilter('all');
    };

    // Fungsi untuk mendapatkan statistik pelanggan
    const getPelangganStats = (pelangganId) => {
        return pelangganStats[pelangganId] || {
            totalTransaksi: 0,
            totalBelanja: 0,
            rataRataBelanja: 0
        };
    };

    // Format currency helper
    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-green-700 p-4 rounded-2xl shadow-lg">
                            <FontAwesomeIcon icon={faUsers} className="text-white text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Daftar Pelanggan</h2>
                            <p className="text-gray-600 mt-1">Kelola data pelanggan dan sistem level member</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-3" />
                            <span className="text-red-700">{error}</span>
                        </div>
                        <button
                            onClick={loadPelanggan}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-sm"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-6">
                    {/* Total Pelanggan */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Pelanggan</p>
                                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalPelanggan}</p>
                                <p className="text-green-600 text-sm mt-2 font-medium">
                                    Semua level member
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-xl">
                                <FontAwesomeIcon icon={faUsers} className="text-green-500 text-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Gold Members */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Gold Members</p>
                                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.level3Count}</p>
                                <p className="text-yellow-600 text-sm mt-2 font-medium">
                                    {stats.totalPelanggan > 0 ? Math.round((stats.level3Count / stats.totalPelanggan) * 100) : 0}% dari total
                                </p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-xl">
                                <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Premium Members */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Premium Members</p>
                                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.level2Count}</p>
                                <p className="text-blue-600 text-sm mt-2 font-medium">
                                    {stats.totalPelanggan > 0 ? Math.round((stats.level2Count / stats.totalPelanggan) * 100) : 0}% dari total
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <FontAwesomeIcon icon={faAward} className="text-blue-500 text-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Rata-rata Poin */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Rata-rata Poin</p>
                                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.averagePoin}</p>
                                <p className="text-purple-600 text-sm mt-2 font-medium">Poin per member aktif</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <FontAwesomeIcon icon={faCoins} className="text-purple-500 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
                {/* Card Header */}
                <div className="bg-primary px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faUsers} className="text-white text-lg" />
                            <h3 className="text-lg font-semibold text-white">Data Pelanggan</h3>
                        </div>
                        <div className="text-green-100 text-xs bg-green-600 px-3 py-1 rounded-full font-medium border border-green-400">
                            Total: {filteredData.length} Pelanggan
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Action Bar dengan Filter */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            {/* Search Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari pelanggan..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-400 focus:border-green-400 bg-white w-full sm:w-64 shadow-sm"
                                />
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3 top-3.5 text-gray-400"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>

                            {/* Level Filter */}
                            <div className="w-full sm:w-48">
                                <CustomSelect
                                    name="levelFilter"
                                    value={levelFilter}
                                    onChange={(e) => handleLevelFilterChange(e.target.value)}
                                    options={[
                                        { value: 'all', label: 'Semua Level' },
                                        { value: '1', label: 'Level 1' },
                                        { value: '2', label: 'Level 2' },
                                        { value: '3', label: 'Level 3' }
                                    ]}
                                    placeholder="Semua Level"
                                    icon={faFilter}
                                    size="md"
                                />
                            </div>

                            {/* Clear Filters */}
                            {(searchTerm || levelFilter !== 'all') && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl flex items-center space-x-2"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    <span>Clear Filters</span>
                                </button>
                            )}
                        </div>

                        {/* Tambah Pelanggan Button */}
                        <button
                            onClick={() => setShowTambahPopup(true)}
                            className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center space-x-2 font-medium shadow-lg w-full lg:w-auto justify-center border border-green-600"
                        >
                            <FontAwesomeIcon icon={faUserPlus} />
                            <span>Tambah Pelanggan</span>
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                            <p className="text-gray-500 mt-4">Memuat data pelanggan...</p>
                        </div>
                    )}

                    {/* Customer Grid */}
                    {!loading && !error && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                {paginatedData.map((pelanggan) => {
                                    const levelInfo = getLevelInfo(pelanggan.level);
                                    // Gunakan statistik yang sudah dimuat dari backend
                                    const stats = getPelangganStats(pelanggan.id);

                                    return (
                                        <div
                                            key={pelanggan.id}
                                            className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-green-400 group"
                                        >
                                            {/* Customer Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                                                        <FontAwesomeIcon
                                                            icon={levelInfo.icon}
                                                            className={`text-base ${pelanggan.level === 3 ? 'text-yellow-500' :
                                                                pelanggan.level === 2 ? 'text-blue-500' : 'text-green-500'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800">{pelanggan.nama}</h3>
                                                        <p className="text-xs text-gray-500">{pelanggan.id}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
                                                    {levelInfo.label}
                                                </span>
                                            </div>

                                            {/* Customer Details */}
                                            <div className="space-y-3 mb-4">
                                                {(pelanggan.telepon || pelanggan.email) && (
                                                    <div className="space-y-2">
                                                        {pelanggan.telepon && (
                                                            <div className="flex items-center space-x-2 text-gray-600">
                                                                <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-sm" />
                                                                <span className="text-sm">{pelanggan.telepon}</span>
                                                            </div>
                                                        )}
                                                        {pelanggan.email && (
                                                            <div className="flex items-center space-x-2 text-gray-600">
                                                                <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-sm" />
                                                                <span className="text-sm truncate">{pelanggan.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {pelanggan.alamat && (
                                                    <div className="flex items-start space-x-2 text-gray-600">
                                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 text-sm mt-0.5 flex-shrink-0" />
                                                        <span className="text-sm flex-1 line-clamp-2">{pelanggan.alamat}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Stats & Action */}
                                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                                <div className="flex space-x-4">
                                                    <div className="text-center">
                                                        <div className="flex items-center space-x-1 text-gray-600">
                                                            <FontAwesomeIcon icon={faCoins} className="text-yellow-500 text-sm" />
                                                            <span className="font-semibold text-gray-800">{pelanggan.poin || 0}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Poin</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold text-gray-800">
                                                            {stats.totalTransaksi}
                                                        </div>
                                                        <p className="text-xs text-gray-500">Transaksi</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-semibold text-gray-800">
                                                            {stats.totalBelanja > 1000000
                                                                ? `Rp ${(stats.totalBelanja / 1000000).toFixed(1)}M`
                                                                : stats.totalBelanja > 1000
                                                                    ? `Rp ${(stats.totalBelanja / 1000).toFixed(0)}K`
                                                                    : `Rp ${stats.totalBelanja}`
                                                            }
                                                        </div>
                                                        <p className="text-xs text-gray-500">Belanja</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetail(pelanggan)}
                                                        className="opacity-0 group-hover:opacity-100 text-green-700 transition-all duration-300 transform group-hover:scale-110"
                                                        title="Lihat Detail"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="text-base" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditPelanggan(pelanggan)}
                                                        className="opacity-0 group-hover:opacity-100 text-blue-700 transition-all duration-300 transform group-hover:scale-110"
                                                        title="Edit"
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} className="text-base" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Empty State */}
                            {paginatedData.length === 0 && (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faUsers} className="text-gray-300 text-6xl mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                                        {searchTerm || levelFilter !== 'all' ? 'Pelanggan tidak ditemukan' : 'Tidak ada pelanggan'}
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        {searchTerm
                                            ? `Tidak ada hasil untuk "${searchTerm}"`
                                            : levelFilter !== 'all'
                                                ? `Tidak ada pelanggan dengan level ${levelFilter}`
                                                : 'Belum ada data pelanggan yang terdaftar'
                                        }
                                    </p>
                                    <button
                                        onClick={() => setShowTambahPopup(true)}
                                        className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-xl transition-colors flex items-center space-x-2 font-medium mx-auto shadow-lg"
                                    >
                                        <FontAwesomeIcon icon={faUserPlus} />
                                        <span>Tambah Pelanggan Pertama</span>
                                    </button>
                                </div>
                            )}

                            {/* Pagination */}
                            {filteredData.length > 0 && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={filteredData.length}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={handlePageChange}
                                        onItemsPerPageChange={handleItemsPerPageChange}
                                        showItemsPerPage={true}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Popup Tambah Pelanggan */}
            <TambahPelangganPopup
                isOpen={showTambahPopup}
                onClose={() => setShowTambahPopup(false)}
                onSave={handleSavePelanggan}
                showToast={showToast}
            />

            {/* Popup Detail Pelanggan */}
            <DetailPelangganPopup
                isOpen={showDetailPopup}
                onClose={() => setShowDetailPopup(false)}
                pelanggan={selectedPelanggan}
                onEdit={handleEditPelanggan}
                onDelete={handleDeletePelanggan}
                showToast={showToast}
            />

            {/* Popup Edit Pelanggan */}
            <EditPelangganPopup
                isOpen={showEditPopup}
                onClose={() => setShowEditPopup(false)}
                pelanggan={selectedPelanggan}
                onSave={handleUpdatePelanggan}
                showToast={showToast}
            />
        </div>
    );
};

export default DaftarPelanggan;