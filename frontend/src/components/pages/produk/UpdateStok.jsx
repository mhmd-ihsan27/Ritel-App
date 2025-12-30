import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faSearch,
    faPlus,
    faMinus,
    faTimes,
    faSave,
    faFilter,
    faSync,
    faExclamationTriangle,
    faTags,
    faShoppingBasket,
    faHistory,
    faList,
    faInfoCircle,
    faCheckCircle,
    faWarehouse,
    faCalendarAlt,
    faClock,
    faCalendarDay,
    faBoxOpen,
    faExclamationCircle,
    faShieldAlt,
    faChartBar,
    faChevronDown,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import { produkAPI, kategoriAPI, batchAPI } from '../../../api';
import { useToast } from '../../common/ToastContainer';
import Pagination from '../../common/Pagination';
import { getCategoryColor } from '../../../utils/categoryColors';
import { usePreventBodyScrollMultiple } from '../../../hooks/usePreventBodyScroll';

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

const UpdateStok = () => {
    const toast = useToast();

    const [produks, setProduks] = useState([]);
    const [kategoris, setKategoris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterKategori, setFilterKategori] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showStokHistoryModal, setShowStokHistoryModal] = useState(false);
    const [selectedProduk, setSelectedProduk] = useState(null);
    const [updateType, setUpdateType] = useState('tambah');
    const [jumlahUpdate, setJumlahUpdate] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [supplier, setSupplier] = useState('');
    const [masaSimpanHari, setMasaSimpanHari] = useState('');

    // Stok history state
    const [stokHistory, setStokHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Batch state
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(false);

    // Expiring batches state
    const [expiringBatches, setExpiringBatches] = useState([]);
    const [loadingExpiringBatches, setLoadingExpiringBatches] = useState(false);

    // Delete expired product state
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [produkToDelete, setProdukToDelete] = useState(null);

    // Loss reason state - untuk modal alasan pengurangan stok
    const [showLossReasonModal, setShowLossReasonModal] = useState(false);
    const [lossType, setLossType] = useState('');
    const [lossValue, setLossValue] = useState('');
    const [pendingUpdateData, setPendingUpdateData] = useState(null);

    // State untuk menyimpan posisi scroll
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterKategori]);

    usePreventBodyScrollMultiple(showUpdateModal, showStokHistoryModal, showDeleteConfirmModal, showLossReasonModal);

    // Fungsi untuk menyimpan posisi scroll sebelum modal dibuka
    const saveScrollPosition = () => {
        setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
    };

    // Fungsi untuk mengembalikan posisi scroll setelah modal ditutup
    const restoreScrollPosition = () => {
        window.scrollTo({
            top: scrollPosition,
            behavior: 'instant'
        });
    };

    const loadData = async () => {
        setLoading(true);
        setLoadingExpiringBatches(true);
        try {
            const [produkData, kategoriData, expiringBatchData] = await Promise.all([
                produkAPI.getAll(),
                kategoriAPI.getAll(),
                batchAPI.getExpiring(30) // Get batches expiring within 30 days
            ]);
            setProduks(produkData || []);
            setKategoris(kategoriData || []);
            setExpiringBatches(expiringBatchData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.showError('Gagal memuat data produk');
            setExpiringBatches([]);
        } finally {
            setLoading(false);
            setLoadingExpiringBatches(false);
        }
    };

    // Filter products
    const filteredProduks = produks.filter(produk => {
        const matchSearch =
            produk.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            produk.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            produk.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchKategori = !filterKategori || produk.kategori === filterKategori;

        return matchSearch && matchKategori;
    });

    // Pagination calculations
    const totalItems = filteredProduks.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = filteredProduks.slice(startIndex, endIndex);

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle items per page change
    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Handle open modal for update stock
    const handleUpdateStok = (produk) => {
        saveScrollPosition(); // Simpan posisi scroll sebelum modal dibuka
        setSelectedProduk(produk);
        setUpdateType('tambah');
        setJumlahUpdate('');
        setKeterangan('');
        setSupplier('');
        setMasaSimpanHari(produk.masaSimpanHari || '7'); // Default 7 days for fresh products
        setShowUpdateModal(true);
    };

    // Handle close modal dengan restore scroll position
    const handleCloseUpdateModal = () => {
        setShowUpdateModal(false);
        setTimeout(() => {
            restoreScrollPosition();
        }, 100);
    };

    // Handle view stok history
    const handleViewStokHistory = async (produk) => {
        saveScrollPosition(); // Simpan posisi scroll sebelum modal dibuka
        console.log('🔍 Opening stock history for product:', produk.nama, 'ID:', produk.id, 'jenisProduk:', produk.jenisProduk);
        setSelectedProduk(produk);
        setLoadingHistory(true);
        setLoadingBatches(true);
        setShowStokHistoryModal(true);

        // Load history
        try {
            console.log('📡 Calling produkAPI.getStokHistory API...');
            const history = await produkAPI.getStokHistory(produk.id);
            console.log('✅ Stock history response:', history);
            console.log('✅ Stock history loaded:', history?.length || 0, 'records');
            setStokHistory(Array.isArray(history) ? history : []);
        } catch (error) {
            console.error('❌ Error loading stock history:');
            console.error('Error object:', error);
            console.error('Error message:', error?.message);
            console.error('Error type:', typeof error);
            console.error('Error string:', String(error));
            toast.showError(`Gagal memuat riwayat stok: ${error?.message || String(error) || 'Server error'}`);
            setStokHistory([]);
        } finally {
            setLoadingHistory(false);
        }

        // Load batches
        try {
            console.log('📡 Calling batchAPI.getByProduk API...');
            const batchData = await batchAPI.getByProduk(produk.id);
            console.log('✅ Batches response:', batchData);
            console.log('✅ Batches loaded:', batchData?.length || 0, 'batches');
            setBatches(Array.isArray(batchData) ? batchData : []);
        } catch (error) {
            console.error('❌ Error loading batches:');
            console.error('Error object:', error);
            console.error('Error message:', error?.message);
            console.error('Error type:', typeof error);
            console.error('Error string:', String(error));
            // Don't show error toast for batches, just log it
            setBatches([]);
        } finally {
            setLoadingBatches(false);
        }
    };

    // Handle close stok history modal dengan restore scroll position
    const handleCloseStokHistoryModal = () => {
        setShowStokHistoryModal(false);
        setTimeout(() => {
            restoreScrollPosition();
        }, 100);
    };

    // Handle close delete confirm modal dengan restore scroll position
    const handleCloseDeleteConfirmModal = () => {
        setShowDeleteConfirmModal(false);
        setTimeout(() => {
            restoreScrollPosition();
        }, 100);
    };

    // Handle save update - FIXED: Accept type parameter to avoid race condition
    const handleSaveUpdate = async (type) => {
        try {
            console.log('[UPDATE STOK] Starting update with type:', type);

            // Validate
            const jumlah = parseInt(jumlahUpdate);
            if (!jumlah || jumlah <= 0) {
                toast.showWarning('Jumlah harus lebih dari 0');
                return;
            }

            // For adding stock, validate masa simpan (batch system)
            if (type === 'tambah') {
                const masaSimpan = parseInt(masaSimpanHari);
                if (!masaSimpan || masaSimpan <= 0) {
                    toast.showWarning('Masa simpan harus lebih dari 0 hari');
                    return;
                }
            }

            // JIKA MENGURANGI STOK: Tampilkan modal alasan kerugian
            if (type === 'kurang') {
                // Hitung nilai kerugian otomatis: harga produk × jumlah
                const calculatedLoss = selectedProduk.hargaBeli * jumlah;

                // Simpan data untuk digunakan setelah user memilih alasan
                setPendingUpdateData({
                    type,
                    jumlah,
                    produk: selectedProduk
                });

                // Set nilai kerugian otomatis
                setLossValue(calculatedLoss.toString());

                setShowUpdateModal(false);
                setShowLossReasonModal(true);
                return;
            }

            // JIKA MENAMBAH STOK: Langsung proses
            let req = {
                produkId: selectedProduk.id,
                jenis: 'manual',
                keterangan: keterangan || `Update stok manual${supplier ? ' - Supplier: ' + supplier : ''}`,
                supplier: supplier || '',
                masaSimpanHari: type === 'tambah' ? parseInt(masaSimpanHari) || 0 : 0
            };

            // Use increment API - FIXED: Use type parameter instead of state
            req.perubahan = type === 'tambah' ? jumlah : -jumlah;

            console.log('[UPDATE STOK] Request:', {
                produkId: req.produkId,
                type: type,
                jumlah: jumlah,
                perubahan: req.perubahan,
                masaSimpanHari: req.masaSimpanHari
            });

            await produkAPI.updateStokIncrement(req);

            // Refresh data
            await loadData();
            toast.showSuccess('Stok berhasil ditambah! Batch baru telah dibuat.');
            setShowUpdateModal(false);
            setSelectedProduk(null);
            setTimeout(() => {
                restoreScrollPosition();
            }, 100);
        } catch (error) {
            console.error('[UPDATE STOK] Error:', error);
            toast.showError('Gagal mengupdate stok: ' + error.message);
        }
    };

    // Handle confirm loss reason - proses pengurangan stok setelah user memilih alasan
    const handleConfirmLossReason = async () => {
        try {
            // Validate
            if (!lossType) {
                toast.showWarning('Pilih alasan pengurangan stok');
                return;
            }

            // Nilai kerugian sudah dihitung otomatis, tidak perlu validasi manual
            const nilaiKerugian = parseInt(lossValue);

            const { type, jumlah, produk } = pendingUpdateData;

            let req = {
                produkId: produk.id,
                jenis: 'pengurangan',
                keterangan: keterangan || `Pengurangan stok: ${lossType}`,
                supplier: '',
                masaSimpanHari: 0,
                perubahan: -jumlah,
                tipeKerugian: lossType,
                nilaiKerugian: nilaiKerugian
            };

            console.log('[UPDATE STOK] Request with loss reason:', req);

            await produkAPI.updateStokIncrement(req);

            // Refresh data
            await loadData();
            toast.showSuccess('Stok berhasil dikurangi!');

            // Reset states
            setShowLossReasonModal(false);
            setPendingUpdateData(null);
            setLossType('');
            setLossValue('');
            setKeterangan('');
            setJumlahUpdate('');
            setSelectedProduk(null);

            setTimeout(() => {
                restoreScrollPosition();
            }, 100);
        } catch (error) {
            console.error('[UPDATE STOK] Error:', error);
            toast.showError('Gagal mengupdate stok: ' + error.message);
        }
    };

    // Calculate statistics
    const stats = {
        totalProduk: filteredProduks.length,
        stokRendah: filteredProduks.filter(p => p.stok <= 10).length,
        stokCukup: filteredProduks.filter(p => p.stok > 10 && p.stok <= 50).length,
        stokAman: filteredProduks.filter(p => p.stok > 50).length
    };

    // Calculate remaining days until expiry
    const getRemainingDays = (expiryDate) => {
        if (!expiryDate) return 0;
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Enrich batches with product info
    const getExpiringBatchesWithProduct = () => {
        return expiringBatches.map(batch => {
            const produk = produks.find(p => p.id === batch.produkId);
            return {
                ...batch,
                produk: produk || null
            };
        })
            .filter(batch => batch.produk !== null) // Only include batches with valid product
            .filter(batch => {
                // Filter out expired batches (only show batches that are approaching expiry, not already expired)
                const remainingDays = getRemainingDays(batch.tanggalKadaluarsa);
                return remainingDays >= 0; // Only include batches that haven't expired yet
            });
    };

    const expiringBatchesWithProduct = getExpiringBatchesWithProduct();

    // Get days until expiry
    const getDaysUntilExpiry = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(dateString);
        expiryDate.setHours(0, 0, 0, 0);
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Check if product is expired
    const isProductExpired = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(dateString);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate < today;
    };

    // Handle delete expired product confirmation
    const handleDeleteExpired = (produk) => {
        saveScrollPosition(); // Simpan posisi scroll sebelum modal dibuka
        setProdukToDelete(produk);
        setShowDeleteConfirmModal(true);
    };

    // Handle confirm delete expired product stock
    const handleConfirmDeleteExpired = async () => {
        try {
            if (!produkToDelete) return;

            // Set stock to 0 using UpdateStokIncrement with negative value
            const req = {
                produkId: produkToDelete.id,
                perubahan: -produkToDelete.stok, // Reduce stock to 0
                jenis: 'manual',
                keterangan: `Penghapusan stok produk kadaluarsa - ${produkToDelete.nama}`
            };

            await produkAPI.updateStokIncrement(req);

            // Refresh data
            await loadData();
            toast.showSuccess(`Stok produk "${produkToDelete.nama}" berhasil dihapus!`);
            setShowDeleteConfirmModal(false);
            setProdukToDelete(null);
            setTimeout(() => {
                restoreScrollPosition();
            }, 100);
        } catch (error) {
            console.error('Error deleting expired stock:', error);
            toast.showError('Gagal menghapus stok: ' + error.message);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setFilterKategori('');
    };

    // Format datetime for history
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format stok - untuk produk curah max 2 desimal, untuk satuan tidak ada desimal
    const formatStok = (stok, jenisProduk) => {
        if (stok === null || stok === undefined) return 0;

        // Default ke 'satuan' jika jenisProduk tidak ada atau invalid
        const jenisValid = jenisProduk || 'satuan';

        // Jika produk curah, format dengan 2 desimal
        if (jenisValid === 'curah') {
            return Number(stok).toFixed(2);
        }

        // Jika produk satuan atau default, format tanpa desimal
        return Math.floor(stok);
    };

    // Get batch status badge style
    const getBatchStatusStyle = (status) => {
        switch (status) {
            case 'fresh':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'hampir_expired':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'expired':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Get batch status label
    const getBatchStatusLabel = (status) => {
        switch (status) {
            case 'fresh':
                return 'Segar';
            case 'hampir_expired':
                return 'Hampir Expired';
            case 'expired':
                return 'Expired';
            default:
                return status;
        }
    };

    return (
        <div className="page overflow-x-hidden min-h-screen bg-gray-50 p-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center space-x-4">
                    <div className="bg-primary p-4 rounded-2xl shadow-lg">
                        <FontAwesomeIcon icon={faBox} className="text-white text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Update Stok</h2>
                        <p className="text-gray-600 mt-1">Kelola dan update stok produk</p>
                    </div>
                </div>
            </div>

            {/* Container 1: Statistics & Expiring Products */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-green-700 px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faInfoCircle} className="text-white text-xl" />
                        <h3 className="text-xl font-semibold text-white">Dashboard Stok & Monitoring</h3>
                    </div>
                </div>

                <div className="p-6">
                    {/* Statistics Cards Container */}
                    <div className="bg-gray-50 border-1 border-gray-300 rounded-2xl shadow-sm mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <FontAwesomeIcon icon={faChartBar} className="text-blue-600 text-lg" />
                                <h4 className="text-lg font-semibold text-gray-800">Ringkasan Stok</h4>
                            </div>
                        </div>

                        {/* Cards Grid - 2 di atas, 2 di bawah */}
                        <div className="p-6">
                            {/* Baris atas - 2 cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Total Produk Card */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                                                <FontAwesomeIcon icon={faBox} className="text-white text-xl" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-blue-600 font-medium">Total Produk</p>
                                                <p className="text-2xl font-bold text-blue-800">{stats.totalProduk}</p>
                                                <p className="text-xs text-blue-600 mt-1">Semua kategori</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-white rounded-lg px-2 py-1 shadow-sm">
                                                <span className="text-xs text-blue-600 font-semibold">ALL</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stok Rendah Card */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-red-500 p-3 rounded-xl shadow-lg">
                                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-xl" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-red-600 font-medium">Stok Rendah</p>
                                                <p className="text-2xl font-bold text-red-800">{stats.stokRendah}</p>
                                                <p className="text-xs text-red-600 mt-1">≤ 10 stok</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-white rounded-lg px-2 py-1 shadow-sm">
                                                <span className="text-xs text-red-600 font-semibold">URGENT</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Baris bawah - 2 cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Stok Cukup Card */}
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-yellow-500 p-3 rounded-xl shadow-lg">
                                                <FontAwesomeIcon icon={faBoxOpen} className="text-white text-xl" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-yellow-600 font-medium">Stok Cukup</p>
                                                <p className="text-2xl font-bold text-yellow-800">{stats.stokCukup}</p>
                                                <p className="text-xs text-yellow-600 mt-1">11 - 50 stok</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-white rounded-lg px-2 py-1 shadow-sm">
                                                <span className="text-xs text-yellow-600 font-semibold">WARNING</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stok Aman Card */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-green-700 p-3 rounded-xl shadow-lg">
                                                <FontAwesomeIcon icon={faShieldAlt} className="text-white text-xl" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-green-600 font-medium">Stok Aman</p>
                                                <p className="text-2xl font-bold text-green-800">{stats.stokAman}</p>
                                                <p className="text-xs text-green-600 mt-1"> 50 stok</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-white rounded-lg px-2 py-1 shadow-sm">
                                                <span className="text-xs text-green-600 font-semibold">SAFE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expiring Batches Warning - Batch-Based Format */}
                    {!loadingExpiringBatches && expiringBatchesWithProduct.length > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-1 border-orange-400 rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <div className="bg-orange-500 p-3 rounded-xl mr-4">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-white text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-orange-800">Peringatan Batch Mendekati Kadaluarsa</h3>
                                        <p className="text-orange-700 text-sm mt-1">
                                            {expiringBatchesWithProduct.length} batch mendekati tanggal kadaluarsa
                                        </p>
                                    </div>
                                </div>

                                {/* List Container */}
                                <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                                    {/* List Header */}
                                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-orange-100 border-b border-orange-200 text-xs font-semibold text-orange-800 uppercase">
                                        <div className="col-span-3">Nama Produk</div>
                                        <div className="col-span-2 text-center">Kategori</div>
                                        <div className="col-span-2 text-center">Batch ID</div>
                                        <div className="col-span-2 text-center">Qty Tersisa</div>
                                        <div className="col-span-2 text-center">Tanggal Kadaluarsa</div>
                                        <div className="col-span-1 text-center">Sisa Hari</div>
                                    </div>

                                    {/* List Items */}
                                    <div className="divide-y divide-orange-100">
                                        {expiringBatchesWithProduct.slice(0, 15).map((batch, index) => {
                                            const remainingDays = getRemainingDays(batch.tanggalKadaluarsa);
                                            const isExpired = remainingDays < 0;
                                            const isUrgent = !isExpired && remainingDays <= 7;
                                            const isWarning = !isExpired && remainingDays > 7 && remainingDays <= 14;

                                            return (
                                                <div
                                                    key={batch.id}
                                                    className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-orange-50 transition-colors ${isExpired ? 'bg-gray-100 hover:bg-gray-200' :
                                                        isUrgent ? 'bg-red-50 hover:bg-red-100' :
                                                            isWarning ? 'bg-orange-50 hover:bg-orange-100' :
                                                                'bg-yellow-50 hover:bg-yellow-100'
                                                        }`}
                                                >
                                                    {/* Nama Produk */}
                                                    <div className="col-span-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-3 h-3 rounded-full ${isExpired ? 'bg-gray-600' :
                                                                isUrgent ? 'bg-red-500' :
                                                                    isWarning ? 'bg-orange-500' :
                                                                        'bg-yellow-500'
                                                                }`}></div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800 text-sm">
                                                                    {batch.produk.nama}
                                                                </h4>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    SKU: {batch.produk.sku || '-'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Kategori */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        {(() => {
                                                            const colors = getCategoryColor(batch.produk.kategori);
                                                            return (
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                                    {batch.produk.kategori || 'Tanpa Kategori'}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>

                                                    {/* Batch ID */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded" title={batch.id}>
                                                            {batch.id.substring(0, 8)}...
                                                        </span>
                                                    </div>

                                                    {/* Qty Tersisa */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <span className={`text-sm font-bold ${batch.qtyTersisa <= 5 ? 'text-red-600' :
                                                                batch.qtyTersisa <= 20 ? 'text-yellow-600' :
                                                                    'text-green-600'
                                                                }`}>
                                                                {batch.qtyTersisa || 0}
                                                            </span>
                                                            <span className="text-xs text-gray-500">/{batch.qty}</span>
                                                        </div>
                                                    </div>

                                                    {/* Tanggal Kadaluarsa */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="flex items-center space-x-1 text-sm text-gray-700">
                                                                <FontAwesomeIcon icon={faCalendarDay} className="text-orange-500 text-xs" />
                                                                <span className="font-medium">{formatDate(batch.tanggalKadaluarsa)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sisa Hari */}
                                                    <div className="col-span-1 flex items-center justify-center">
                                                        {isExpired ? (
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBatchStatusStyle(batch.status)}`}>
                                                                {getBatchStatusLabel(batch.status)}
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${isUrgent
                                                                ? 'bg-red-500 text-white'
                                                                : isWarning
                                                                    ? 'bg-orange-500 text-white'
                                                                    : 'bg-yellow-500 text-white'
                                                                }`}>
                                                                <FontAwesomeIcon icon={faClock} className="mr-1 text-xs" />
                                                                {remainingDays}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* List Footer */}
                                    {expiringBatchesWithProduct.length > 15 && (
                                        <div className="px-4 py-3 bg-orange-50 border-t border-orange-200 text-center">
                                            <p className="text-sm text-orange-700 font-medium">
                                                Menampilkan 15 dari {expiringBatchesWithProduct.length} batch
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Information */}
                                <div className="mt-4 flex items-center justify-between text-xs text-orange-700">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span>Kritis (≤ 7 hari)</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                            <span>Peringatan (8-14 hari)</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span>Perhatian (15-30 hari)</span>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Container 2: Search, Filter & Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-green-700 border-b border-green-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faList} className="text-white text-xl" />
                            <h3 className="text-xl font-semibold text-white">Manajemen Stok Produk</h3>
                        </div>
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="bg-white hover:bg-gray-100 text-green-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faSync} className={`${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh Data</span>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Search and Filter Form */}
                    <div className="space-y-6 mb-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama produk, SKU, atau barcode..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="w-full sm:w-64">
                                    <CustomSelect
                                        name="filterKategori"
                                        value={filterKategori}
                                        onChange={(e) => setFilterKategori(e.target.value)}
                                        options={[
                                            { value: '', label: 'Semua Kategori' },
                                            ...kategoris.map(kategori => ({
                                                value: kategori.nama,
                                                label: kategori.nama,
                                                description: kategori.deskripsi
                                            }))
                                        ]}
                                        placeholder="Semua Kategori"
                                        icon={faFilter}
                                        size="md"
                                    />
                                </div>

                                {(searchTerm || filterKategori) && (
                                    <button
                                        onClick={resetFilters}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 whitespace-nowrap"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                        <span>Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {(searchTerm || filterKategori) && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Menampilkan {filteredProduks.length} dari {produks.length} produk
                                    {(searchTerm || filterKategori) && (
                                        <span className="ml-2">
                                            {searchTerm && `• Pencarian: "${searchTerm}"`}
                                            {filterKategori && `• Kategori: ${filterKategori}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table Content */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Memuat data produk...</p>
                        </div>
                    ) : filteredProduks.length === 0 ? (
                        <div className="text-center py-12">
                            <FontAwesomeIcon icon={faBox} className="text-gray-300 text-6xl mb-4" />
                            <p className="text-gray-600 font-medium text-lg mb-2">Belum ada produk</p>
                            <p className="text-gray-500">
                                {searchTerm || filterKategori
                                    ? 'Coba ubah kata kunci atau filter pencarian'
                                    : 'Tidak ada produk yang ditemukan'
                                }
                            </p>
                            {(searchTerm || filterKategori) && (
                                <button
                                    onClick={resetFilters}
                                    className="mt-4 bg-primary hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    <span>Reset Filter</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-hidden"> {/* Changed from overflow-x-auto to overflow-hidden */}
                            <div className="w-full"> {/* Added wrapper div */}
                                <table className="w-full min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                No
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                SKU
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                Nama Produk
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                Kategori
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                Stok Saat Ini
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentItems.map((produk, index) => (
                                            <tr key={produk.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 text-center">
                                                        {startIndex + index + 1}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                                                        {produk.sku || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-semibold text-gray-800">{produk.nama}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {produk.satuan || 'pcs'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {(() => {
                                                        const colors = getCategoryColor(produk.kategori);
                                                        return (
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-current  ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                                {produk.kategori || 'Tanpa Kategori'}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className={`text-lg font-bold ${produk.stok <= 10 ? 'text-red-600' :
                                                        produk.stok <= 50 ? 'text-yellow-600' :
                                                            'text-green-600'
                                                        }`}>
                                                        {formatStok(produk.stok, produk.jenisProduk)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {produk.stok <= 10 ? 'Stok Rendah' :
                                                            produk.stok <= 50 ? 'Stok Cukup' :
                                                                'Stok Aman'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleUpdateStok(produk)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                                            title="Update Stok"
                                                        >
                                                            <FontAwesomeIcon icon={faWarehouse} className="text-sm" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleViewStokHistory(produk)}
                                                            className="text-purple-600 hover:text-purple-800 transition-colors p-2 rounded-lg hover:bg-purple-50"
                                                            title="Riwayat Stok"
                                                        >
                                                            <FontAwesomeIcon icon={faHistory} className="text-sm" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalItems > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            showItemsPerPage={true}
                        />
                    </div>
                )}
            </div>

            {/* Update Stock Modal */}
            {showUpdateModal && selectedProduk && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    {/* Background Overlay - TRANSPARAN */}
                    <div
                        className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={handleCloseUpdateModal}
                    ></div>

                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-300 max-h-[85vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-blue-500 p-4 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faWarehouse} className="text-lg text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Update Stok Produk</h3>
                                    <p className="text-blue-100 text-xs mt-1">Atur stok untuk {selectedProduk.nama}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseUpdateModal}
                                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white hover:bg-blue-600 rounded-lg"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                {/* Current Stock Info */}
                                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium">Stok Saat Ini</p>
                                            <p className={`text-xl font-bold ${selectedProduk.stok <= 10 ? 'text-red-600' :
                                                selectedProduk.stok <= 50 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                {formatStok(selectedProduk.stok, selectedProduk.jenisProduk)} {selectedProduk.satuan}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-600 font-medium">Status</p>
                                            <p className={`text-xs font-semibold ${selectedProduk.stok <= 10 ? 'text-red-600' :
                                                selectedProduk.stok <= 50 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                {selectedProduk.stok <= 10 ? 'Stok Rendah' :
                                                    selectedProduk.stok <= 50 ? 'Stok Cukup' :
                                                        'Stok Aman'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Update Form */}
                                <div className="space-y-3">
                                    {/* Jumlah Update */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Jumlah Perubahan Stok
                                        </label>
                                        <input
                                            type="text"
                                            value={jumlahUpdate}
                                            onChange={(e) => setJumlahUpdate(e.target.value.replace(/\D/g, ''))}
                                            placeholder="Masukkan jumlah"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                        />
                                    </div>

                                    {/* Supplier */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Supplier
                                        </label>
                                        <input
                                            type="text"
                                            value={supplier}
                                            onChange={(e) => setSupplier(e.target.value)}
                                            placeholder="Nama supplier (opsional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                        />
                                    </div>

                                    {/* Masa Simpan (only for tambah) */}
                                    {updateType === 'tambah' && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <label className="block text-xs font-semibold text-green-800 mb-1 flex items-center">
                                                <FontAwesomeIcon icon={faCalendarDay} className="mr-2" />
                                                Masa Simpan (Hari) <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={masaSimpanHari}
                                                onChange={(e) => setMasaSimpanHari(e.target.value)}
                                                min="1"
                                                max="365"
                                                placeholder="Contoh: 7 untuk sayuran, 30 untuk buah"
                                                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                                            />
                                            <p className="text-xs text-green-700 mt-1">
                                                Produk akan kadaluarsa setelah {masaSimpanHari || '0'} hari dari tanggal restok
                                            </p>
                                        </div>
                                    )}

                                    {/* Keterangan */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Keterangan
                                        </label>
                                        <textarea
                                            value={keterangan}
                                            onChange={(e) => setKeterangan(e.target.value)}
                                            rows="2"
                                            placeholder="Tambahkan catatan untuk perubahan stok ini..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Preview */}
                                {jumlahUpdate && parseInt(jumlahUpdate) > 0 && (
                                    <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                                        <h4 className="font-semibold text-yellow-800 mb-2 text-sm">Preview Perubahan</h4>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-yellow-700">Stok saat ini:</span>
                                            <span className="font-semibold">{formatStok(selectedProduk.stok, selectedProduk.jenisProduk)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <span className="text-yellow-700">Stok setelah perubahan:</span>
                                            <span className="font-semibold text-green-600">
                                                {formatStok(
                                                    updateType === 'tambah'
                                                        ? (selectedProduk.stok || 0) + parseFloat(jumlahUpdate)
                                                        : (selectedProduk.stok || 0) - parseFloat(jumlahUpdate),
                                                    selectedProduk.jenisProduk
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-300 flex justify-end space-x-2">
                            <button
                                onClick={handleCloseUpdateModal}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-1" />
                                Batal
                            </button>
                            <button
                                onClick={() => handleSaveUpdate('kurang')}
                                disabled={!jumlahUpdate || parseInt(jumlahUpdate) <= 0}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <FontAwesomeIcon icon={faMinus} className="mr-1" />
                                Kurangi Stok
                            </button>
                            <button
                                onClick={() => handleSaveUpdate('tambah')}
                                disabled={!jumlahUpdate || parseInt(jumlahUpdate) <= 0}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                Tambah Stok
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stok History Modal */}
            {showStokHistoryModal && selectedProduk && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={handleCloseStokHistoryModal}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 border border-gray-300 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="bg-purple-500 p-4 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faHistory} className="text-lg text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Riwayat Stok</h3>
                                    <p className="text-purple-100 text-xs mt-1">Riwayat perubahan stok untuk {selectedProduk.nama}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseStokHistoryModal}
                                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white hover:bg-purple-600 rounded-lg"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1">
                            {/* Batch List Section */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                                    <FontAwesomeIcon icon={faBoxOpen} className="text-green-600 mr-2" />
                                    Daftar Batch Stok
                                </h4>
                                {loadingBatches ? (
                                    <div className="flex flex-col justify-center items-center py-6 bg-gray-50 rounded-xl">
                                        <div className="w-6 h-6 border-4 border-green-500 rounded-full border-t-transparent animate-spin mb-2"></div>
                                        <p className="text-gray-600 text-xs">Memuat batch...</p>
                                    </div>
                                ) : !Array.isArray(batches) || batches.length === 0 ? (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                                        <FontAwesomeIcon icon={faBoxOpen} className="text-gray-300 text-3xl mb-2" />
                                        <p className="text-gray-600 text-xs">Belum ada batch stok</p>
                                        <p className="text-gray-500 text-xs mt-1">Batch akan terbuat saat melakukan restok</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Batch ID</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Qty Tersisa</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Tanggal Restok</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Masa Simpan</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Tanggal Kadaluarsa</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Sisa Hari</th>
                                                        <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {batches.map((batch) => {
                                                        const remainingDays = getRemainingDays(batch.tanggalKadaluarsa);
                                                        return (
                                                            <tr key={batch.id} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2">
                                                                    <span className="font-mono text-xs text-gray-700" title={batch.id}>
                                                                        {batch.id.substring(0, 8)}...
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className="font-semibold text-gray-800">{batch.qtyTersisa}</span>
                                                                    <span className="text-gray-500">/{batch.qty}</span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center text-gray-700">
                                                                    {formatDate(batch.tanggalRestok)}
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className="font-semibold text-blue-600">{batch.masaSimpanHari}</span>
                                                                    <span className="text-gray-500 ml-1">hari</span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center text-gray-700">
                                                                    {formatDate(batch.tanggalKadaluarsa)}
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className={`font-semibold ${remainingDays < 0 ? 'text-red-600' :
                                                                        remainingDays <= 2 ? 'text-yellow-600' :
                                                                            'text-green-600'
                                                                        }`}>
                                                                        {remainingDays < 0 ? `${Math.abs(remainingDays)} hari lalu` : `${remainingDays} hari`}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBatchStatusStyle(batch.status)}`}>
                                                                        {getBatchStatusLabel(batch.status)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Riwayat Stok Section */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                                    <FontAwesomeIcon icon={faHistory} className="text-purple-600 mr-2" />
                                    Riwayat Perubahan Stok
                                </h4>
                                {loadingHistory ? (
                                    <div className="flex flex-col justify-center items-center py-6 bg-gray-50 rounded-xl">
                                        <div className="w-6 h-6 border-4 border-purple-500 rounded-full border-t-transparent animate-spin mb-2"></div>
                                        <p className="text-gray-600 text-xs">Memuat riwayat stok...</p>
                                    </div>
                                ) : !Array.isArray(stokHistory) || stokHistory.length === 0 ? (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                                        <FontAwesomeIcon icon={faHistory} className="text-gray-300 text-3xl mb-2" />
                                        <p className="text-gray-600 text-xs">Belum ada riwayat stok</p>
                                        <p className="text-gray-500 text-xs mt-1">Perubahan stok akan tercatat di sini</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {stokHistory.map((history, index) => (
                                            <div key={history.id} className="bg-gray-50 rounded-xl p-3 border border-gray-300">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${history.jenisPerubahan === 'penjualan' ? 'bg-red-100 text-red-800' :
                                                            history.jenisPerubahan === 'pembelian' ? 'bg-green-100 text-green-800' :
                                                                history.jenisPerubahan === 'return' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {history.jenisPerubahan}
                                                        </span>
                                                        <span className={`text-sm font-semibold ${(history.perubahan || 0) > 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {(history.perubahan || 0) > 0 ? '+' : ''}{history.perubahan || 0}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDateTime(history.createdAt)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-gray-600">Stok Sebelum:</span>
                                                        <p className="font-semibold">{selectedProduk ? formatStok(history.stokSebelum, selectedProduk.jenisProduk) : history.stokSebelum}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Stok Sesudah:</span>
                                                        <p className="font-semibold text-green-600">{selectedProduk ? formatStok(history.stokSesudah, selectedProduk.jenisProduk) : history.stokSesudah}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Perubahan:</span>
                                                        <p className={`font-semibold ${(history.perubahan || 0) > 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {(history.perubahan || 0) > 0 ? '+' : ''}{history.perubahan || 0}
                                                        </p>
                                                    </div>
                                                </div>

                                                {history.keterangan && (
                                                    <div className="mt-2">
                                                        <span className="text-xs text-gray-600">Keterangan:</span>
                                                        <p className="text-xs text-gray-700 mt-1">{history.keterangan}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-300 flex justify-between items-center">
                            <div className="text-xs text-gray-600 flex items-center space-x-4">
                                <span className="flex items-center">
                                    <FontAwesomeIcon icon={faBoxOpen} className="text-green-600 mr-1" />
                                    {batches.length} batch
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="flex items-center">
                                    <FontAwesomeIcon icon={faHistory} className="text-purple-600 mr-1" />
                                    {stokHistory.length} riwayat
                                </span>
                            </div>
                            <button
                                onClick={handleCloseStokHistoryModal}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Expired Product Confirmation Modal */}
            {showDeleteConfirmModal && produkToDelete && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleCloseDeleteConfirmModal}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300">
                        {/* Header */}
                        <div className="bg-red-500 p-4 text-white relative rounded-t-2xl">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Konfirmasi Hapus Stok</h3>
                                    <p className="text-red-100 text-xs mt-1">Produk yang sudah kadaluarsa</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseDeleteConfirmModal}
                                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white hover:bg-red-600 rounded-lg transition-colors"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl text-red-600" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                    Apakah Anda yakin ingin menghapus stok produk ini?
                                </h4>
                                <p className="text-gray-600 text-sm mb-4">
                                    Stok produk <span className="font-bold">"{produkToDelete.nama}"</span> akan dihapus (stok menjadi 0).
                                </p>
                            </div>

                            {/* Product Info */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">SKU:</span>
                                        <p className="font-semibold text-gray-800">{produkToDelete.sku || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Kategori:</span>
                                        <p className="font-semibold text-gray-800">{produkToDelete.kategori || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Stok Saat Ini:</span>
                                        <p className="font-bold text-red-600">{formatStok(produkToDelete.stok, produkToDelete.jenisProduk)} {produkToDelete.satuan || 'pcs'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Tanggal Kadaluarsa:</span>
                                        <p className="font-semibold text-gray-800">{formatDate(produkToDelete.kadaluarsa)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <div className="flex items-start space-x-2">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-sm mt-0.5" />
                                    <p className="text-xs text-yellow-800">
                                        <span className="font-semibold">Perhatian:</span> Tindakan ini tidak dapat dibatalkan. Stok produk akan menjadi 0 dan tercatat dalam riwayat stok.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-300 flex justify-end space-x-2 rounded-b-2xl">
                            <button
                                onClick={handleCloseDeleteConfirmModal}
                                className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmDeleteExpired}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                                Yaa, Hapus Stok
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loss Reason Modal - Modal untuk alasan pengurangan stok */}
            {showLossReasonModal && pendingUpdateData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
                            <h3 className="text-2xl font-bold text-white flex items-center">
                                <FontAwesomeIcon icon={faExclamationCircle} className="mr-3" />
                                Alasan Pengurangan Stok
                            </h3>
                            <p className="text-red-100 text-sm mt-2">
                                Produk: {pendingUpdateData.produk.nama}
                            </p>
                            <div className="mt-2 text-red-100 text-sm">
                                <span>Harga Beli: Rp {pendingUpdateData.produk.hargaBeli.toLocaleString('id-ID')}</span>
                                <span className="mx-2">×</span>
                                <span>Jumlah: {pendingUpdateData.jumlah}</span>
                                <span className="mx-2">=</span>
                                <span className="font-bold">Rp {(pendingUpdateData.produk.hargaBeli * pendingUpdateData.jumlah).toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {/* Tipe Kerugian */}
                            <div>
                                <CustomSelect
                                    label="Alasan Pengurangan"
                                    name="lossType"
                                    value={lossType}
                                    onChange={(e) => setLossType(e.target.value)}
                                    options={[
                                        { value: 'rusak', label: 'Barang Rusak', description: 'Produk rusak atau cacat' },
                                        { value: 'hilang', label: 'Kehilangan', description: 'Produk hilang atau dicuri' },
                                        { value: 'kadaluarsa', label: 'Kadaluarsa', description: 'Produk kadaluarsa' },
                                        { value: 'lainnya', label: 'Lainnya', description: 'Alasan lain' }
                                    ]}
                                    placeholder="Pilih alasan..."
                                    icon={faExclamationTriangle}
                                />
                            </div>

                            {/* Nilai Kerugian */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Nilai Kerugian (Otomatis)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        Rp
                                    </span>
                                    <input
                                        type="text"
                                        value={parseInt(lossValue).toLocaleString('id-ID')}
                                        readOnly
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Dihitung otomatis: Harga Beli × Jumlah
                                </p>
                            </div>

                            {/* Keterangan Tambahan */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Keterangan Tambahan (Opsional)
                                </label>
                                <textarea
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                                    rows="3"
                                    placeholder="Tambahkan catatan detail jika diperlukan..."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowLossReasonModal(false);
                                    setPendingUpdateData(null);
                                    setLossType('');
                                    setLossValue('');
                                    setKeterangan('');
                                }}
                                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmLossReason}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                Konfirmasi Pengurangan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdateStok;