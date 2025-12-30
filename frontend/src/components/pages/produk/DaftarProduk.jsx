// pages/DaftarProduk.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faSearch,
    faEye,
    faEdit,
    faTrash,
    faTimes,
    faSave,
    faImage,
    faBarcode,
    faTags,
    faDollarSign,
    faWeightHanging,
    faBalanceScale,
    faCubes,
    faGripVertical,
    faAppleAlt,
    faShoppingBasket,
    faExclamationTriangle,
    faInfoCircle,
    faFilter,
    faSync,
    faChevronLeft,
    faChevronRight,
    faAngleDoubleLeft,
    faAngleDoubleRight,
    faCheckCircle,
    faTriangleExclamation,
    faWarehouse,
    faPlus,
    faMinus,
    faHistory,
    faCalendar,
    faChevronDown,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import { produkAPI, kategoriAPI } from '../../../api';
import { useToast } from '../../common/ToastContainer';
import Pagination from '../../common/Pagination';
import { getCategoryColor, getCategoryColorSchemes } from '../../../utils/categoryColors';
import { usePreventBodyScrollMultiple } from '../../../hooks/usePreventBodyScroll';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';
import DeleteNotification from '../../common/DeleteNotification';

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
                        ${error ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' :
                            'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'}
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

const DaftarProduk = () => {
    const toast = useToast();

    // State
    const [produks, setProduks] = useState([]);
    const [kategoris, setKategoris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterKategori, setFilterKategori] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showUpdateStokModal, setShowUpdateStokModal] = useState(false);
    const [showStokHistoryModal, setShowStokHistoryModal] = useState(false);
    const [selectedProduk, setSelectedProduk] = useState(null);

    // State untuk notifikasi delete
    const [showDeleteNotification, setShowDeleteNotification] = useState(false);
    const [deleteNotificationMessage, setDeleteNotificationMessage] = useState('');

    // Edit form state
    const [editForm, setEditForm] = useState({
        id: '',
        sku: '',
        barcode: '',
        nama: '',
        kategori: '',
        berat: '',
        hargaBeli: '',
        hargaJual: '',
        satuan: 'kg',
        jenisProduk: 'curah', // 'curah' atau 'satuan'
        tanggalMasuk: '',
        deskripsi: '',
        gambar: '',
        hariPemberitahuanKadaluarsa: '30',
        masaSimpanHari: '7'
    });

    // Stok update form state
    const [stokForm, setStokForm] = useState({
        stokBaru: '',
        perubahan: '',
        jenis: 'manual',
        keterangan: '',
        supplier: ''
    });

    // Stok history state
    const [stokHistory, setStokHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Reset to first page when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterKategori]);

    // Prevent body scroll when any modal is open (Global hook)
    usePreventBodyScrollMultiple(
        showPreviewModal,
        showEditModal,
        showDeleteModal,
        showImageModal,
        showUpdateStokModal,
        showStokHistoryModal
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const [produkData, kategoriData] = await Promise.all([
                produkAPI.getAll(),
                kategoriAPI.getAll()
            ]);
            setProduks(produkData || []);
            setKategoris(kategoriData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.showError('Gagal memuat data produk');
        } finally {
            setLoading(false);
        }
    };

    // Format Rupiah
    const formatRupiah = (value) => {
        if (!value && value !== 0) return 'Rp 0';
        const numericValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) || 0 : value;
        return 'Rp ' + numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Format Rupiah for input
    const formatRupiahInput = (value) => {
        if (!value) return '';
        const numberString = value.toString().replace(/\D/g, '');
        if (!numberString) return '';
        return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Parse Rupiah
    const parseRupiah = (rupiahString) => {
        if (!rupiahString) return 0;
        const numericString = rupiahString.replace(/\./g, '').replace(/\D/g, '');
        return parseInt(numericString) || 0;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (error) {
            return '-';
        }
    };

    // Format datetime for history
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '-';
        }
    };

    // Filter products
    const filteredProduks = produks.filter(produk => {
        const matchSearch =
            (produk.nama?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (produk.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (produk.barcode?.toLowerCase() || '').includes(searchTerm.toLowerCase());

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
    };

    // Handle items per page change
    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Handle preview
    const handlePreview = (produk) => {
        setSelectedProduk(produk);
        setShowPreviewModal(true);
    };

    // Handle edit
    const handleEdit = (produk) => {
        setSelectedProduk(produk);
        setEditForm({
            id: produk.id || '',
            sku: produk.sku || '',
            barcode: produk.barcode || '',
            nama: produk.nama || '',
            kategori: produk.kategori || '',
            berat: produk.berat || '',
            hargaBeli: formatRupiahInput(produk.hargaBeli),
            hargaJual: formatRupiahInput(produk.hargaJual),
            satuan: produk.satuan || 'kg',
            jenisProduk: produk.jenisProduk || 'curah', // Load jenis produk
            tanggalMasuk: produk.tanggalMasuk || '',
            deskripsi: produk.deskripsi || '',
            gambar: produk.gambar || '',
            hariPemberitahuanKadaluarsa: produk.hariPemberitahuanKadaluarsa || '30',
            masaSimpanHari: produk.masaSimpanHari || '7'
        });
        setShowEditModal(true);
    };

    // Handle delete
    const handleDelete = (produk) => {
        setSelectedProduk(produk);
        setShowDeleteModal(true);
    };

    // Handle update stok
    const handleUpdateStok = (produk) => {
        setSelectedProduk(produk);
        setStokForm({
            stokBaru: produk.stok || 0,
            perubahan: '',
            jenis: 'manual',
            keterangan: '',
            supplier: ''
        });
        setShowUpdateStokModal(true);
    };

    // Handle view stok history
    const handleViewStokHistory = async (produk) => {
        setSelectedProduk(produk);
        setLoadingHistory(true);
        setShowStokHistoryModal(true);

        try {
            // TODO: GetStokHistory not implemented yet in API
            // const history = await produkAPI.getStokHistory(produk.id);
            // setStokHistory(history || []);
            setStokHistory([]);
            toast.showWarning('Fitur riwayat stok belum tersedia di web mode');
        } catch (error) {
            console.error('Error loading stock history:', error);
            toast.showError('Gagal memuat riwayat stok');
            setStokHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Handle edit form change
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;

        if (name === 'hargaBeli' || name === 'hargaJual') {
            const formatted = formatRupiahInput(value);
            setEditForm({ ...editForm, [name]: formatted });
        } else if (name === 'barcode') {
            const numericValue = value.replace(/\D/g, '');
            setEditForm({ ...editForm, [name]: numericValue });
        } else {
            setEditForm({ ...editForm, [name]: value });
        }
    };

    // Handle stok form change
    const handleStokFormChange = (e) => {
        const { name, value } = e.target;

        if (name === 'stokBaru' || name === 'perubahan') {
            const numericValue = value.replace(/\D/g, '');
            setStokForm({ ...stokForm, [name]: numericValue });

            if (name === 'stokBaru' && value !== '') {
                setStokForm(prev => ({ ...prev, perubahan: '' }));
            } else if (name === 'perubahan' && value !== '') {
                setStokForm(prev => ({ ...prev, stokBaru: '' }));
            }
        } else {
            setStokForm({ ...stokForm, [name]: value });
        }
    };

    // Save edit
    const handleSaveEdit = async () => {
        try {
            // Validate
            if (!editForm.sku || !editForm.nama || !editForm.hargaJual) {
                toast.showWarning('SKU, Nama Produk, dan Harga Jual wajib diisi');
                return;
            }

            // Validate masa simpan and pemberitahuan
            const masaSimpan = parseInt(editForm.masaSimpanHari) || 7;
            const pemberitahuan = parseInt(editForm.hariPemberitahuanKadaluarsa) || 30;

            if (pemberitahuan > masaSimpan) {
                toast.showError(`Pemberitahuan kadaluarsa (${pemberitahuan} hari) tidak boleh melebihi masa simpan (${masaSimpan} hari)`);
                return;
            }

            console.log('[EDIT PRODUK] Saving:', {
                id: editForm.id,
                masaSimpanHari: masaSimpan,
                hariPemberitahuanKadaluarsa: pemberitahuan
            });

            // Prepare data for API
            const updateData = {
                id: editForm.id,
                sku: editForm.sku,
                barcode: editForm.barcode,
                nama: editForm.nama,
                kategori: editForm.kategori,
                berat: parseFloat(editForm.berat) || 0,
                hargaBeli: parseRupiah(editForm.hargaBeli),
                hargaJual: parseRupiah(editForm.hargaJual),
                stok: selectedProduk?.stok || 0,
                satuan: editForm.satuan,
                jenisProduk: editForm.jenisProduk, // NEW: Jenis produk
                tanggalMasuk: editForm.tanggalMasuk,
                deskripsi: editForm.deskripsi,
                gambar: editForm.gambar,
                hariPemberitahuanKadaluarsa: pemberitahuan,
                masaSimpanHari: masaSimpan
            };

            // Call API to update in database
            await produkAPI.update(updateData);

            // Refresh data from server
            await loadData();

            toast.showSuccess('Produk berhasil diupdate!');
            setShowEditModal(false);
            setSelectedProduk(null);
        } catch (error) {
            console.error('Error updating produk:', error);
            toast.showError('Gagal mengupdate produk: ' + error.message);
        }
    };

    // Save stok update
    const handleSaveStok = async () => {
        try {
            if (!stokForm.stokBaru && !stokForm.perubahan) {
                toast.showWarning('Masukkan stok baru atau perubahan stok');
                return;
            }

            let req = {
                produkId: selectedProduk.id,
                jenis: stokForm.jenis,
                keterangan: stokForm.keterangan || `Update stok manual`
            };

            if (stokForm.stokBaru !== '') {
                req.stokBaru = parseInt(stokForm.stokBaru);
                await produkAPI.updateStok(req);
            } else if (stokForm.perubahan !== '') {
                req.perubahan = parseInt(stokForm.perubahan);
                await produkAPI.updateStokIncrement(req);
            }

            // Refresh data
            await loadData();
            toast.showSuccess('Stok berhasil diupdate!');
            setShowUpdateStokModal(false);
            setSelectedProduk(null);
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.showError('Gagal mengupdate stok: ' + error.message);
        }
    };

    // Quick stok adjustment buttons
    const handleQuickStokAdjust = (perubahan) => {
        const newStok = (selectedProduk?.stok || 0) + perubahan;
        if (newStok < 0) {
            toast.showWarning('Stok tidak boleh negatif');
            return;
        }

        setStokForm({
            stokBaru: '',
            perubahan: perubahan.toString(),
            jenis: 'manual',
            keterangan: `Penyesuaian stok: ${perubahan > 0 ? '+' : ''}${perubahan}`
        });
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!selectedProduk) return;

        try {
            // Call API to delete from database
            await produkAPI.delete(selectedProduk.id);

            // Update local state
            setProduks(produks.filter(p => p.id !== selectedProduk.id));

            setDeleteNotificationMessage('Produk berhasil dihapus!');
            setShowDeleteNotification(true);

            setTimeout(() => {
                setShowDeleteNotification(false);
            }, 3000);

            setShowDeleteModal(false);
            setSelectedProduk(null);
        } catch (error) {
            console.error('Error deleting produk:', error);

            // Handle different error formats from Wails
            let errorMessage = 'Terjadi kesalahan saat menghapus produk';

            if (error) {
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (error.toString) {
                    errorMessage = error.toString();
                }
            }

            toast.showError(errorMessage);
            setShowDeleteModal(false);
        }
    };

    // Handle delete modal close
    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
        setSelectedProduk(null);
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setFilterKategori('');
    };

    // Simple category color function as fallback
    const getSimpleCategoryColor = (kategori) => {
        if (!kategori) return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };

        const colors = {
            'Sayuran': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
            'Buah': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
            'Daging': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
            'Ikan': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
            'Bumbu': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
            'default': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
        };

        return colors[kategori] || colors.default;
    };

    return (
        <div className="page overflow-x-hidden min-h-screen bg-gray-50 p-8">
            {/* Notifikasi Delete */}
            {showDeleteNotification && (
                <DeleteNotification
                    message={deleteNotificationMessage}
                    duration={3000}
                />
            )}

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center space-x-4 mb-3">
                    <div className="bg-green-700 p-4 rounded-2xl shadow-lg">
                        <FontAwesomeIcon icon={faBox} className="text-white text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Daftar Produk</h2>
                        <p className="text-gray-600 mt-1">Kelola dan monitor semua produk dalam sistem</p>
                    </div>
                </div>
            </div>

            {/* Main Container - Search, Filter, and Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className="bg-green-700 border-b border-green-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faShoppingBasket} className="text-white text-xl" />
                            <h3 className="text-xl font-semibold text-white">Daftar Semua Produk</h3>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="text-white text-sm bg-green-700 px-3 py-1 rounded-full font-medium">
                                Total: {filteredProduks.length} produk
                            </div>
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="bg-white hover:bg-gray-100 text-green-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faSync} className={`${loading ? 'animate-spin' : ''}`} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="p-6 border-b border-gray-200">
                    <div className="space-y-4">
                        {/* Search and Filter Form */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama produk, SKU, atau barcode..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 outline-none"
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
                </div>

                {/* Products Table Section */}
                <div className="overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <div className="w-12 h-12 border-4 border-green-500 rounded-full border-t-transparent animate-spin mb-4"></div>
                            <p className="text-gray-600 font-medium">Memuat data produk...</p>
                        </div>
                    ) : filteredProduks.length === 0 ? (
                        <div className="text-center py-12">
                            <FontAwesomeIcon icon={faBox} className="text-gray-300 text-6xl mb-4" />
                            <h4 className="text-lg font-semibold text-gray-600 mb-2">
                                {searchTerm || filterKategori ? 'Produk tidak ditemukan' : 'Belum ada produk'}
                            </h4>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || filterKategori
                                    ? 'Coba ubah kata kunci pencarian atau filter kategori'
                                    : 'Tambahkan produk baru untuk memulai'}
                            </p>
                            {(searchTerm || filterKategori) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterKategori('');
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                                >
                                    Reset Pencarian
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="w-full">
                            {/* Table Container */}
                            <div className="w-full">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-300">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                No
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                SKU
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Barcode
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Nama Produk
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Kategori
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Harga Jual
                                            </th>
                                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Stok
                                            </th>
                                            <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentItems.map((produk, index) => (
                                            <tr
                                                key={produk.id || index}
                                                className="hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                {/* Number */}
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {startIndex + index + 1}
                                                    </span>
                                                </td>

                                                {/* SKU */}
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-semibold text-gray-800">
                                                        {produk.sku || '-'}
                                                    </div>
                                                </td>

                                                {/* Barcode */}
                                                <td className="px-4 py-4">
                                                    <div className="text-sm text-gray-500">
                                                        {produk.barcode || '-'}
                                                    </div>
                                                </td>

                                                {/* Product Name */}
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-semibold text-gray-800">
                                                        {produk.nama || 'Nama tidak tersedia'}
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td className="px-4 py-4">
                                                    {(() => {
                                                        const colors = getSimpleCategoryColor(produk.kategori);
                                                        return (
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                                {produk.kategori || '-'}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>

                                                {/* Price */}
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-bold text-green-600">
                                                        {formatRupiah(produk.hargaJual)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        per 1000 gram
                                                    </div>
                                                </td>

                                                {/* Stock */}
                                                <td className="px-4 py-4">
                                                    <div className={`text-sm font-bold ${(produk.stok || 0) <= 10 ? 'text-red-600' :
                                                        (produk.stok || 0) <= 50 ? 'text-yellow-600' :
                                                            'text-green-600'
                                                        }`}>
                                                        {(produk.stok || 0).toFixed(2)} kg
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <button
                                                            onClick={() => handlePreview(produk)}
                                                            className="text-green-600 hover:text-green-800 transition-colors p-2 rounded-lg hover:bg-green-50"
                                                            title="Lihat Detail"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} className="text-sm" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleEdit(produk)}
                                                            className="text-yellow-600 hover:text-yellow-800 transition-colors p-2 rounded-lg hover:bg-yellow-50"
                                                            title="Edit Produk"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="text-sm" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(produk)}
                                                            className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                                                            title="Hapus Produk"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
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
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        showItemsPerPage={true}
                    />
                )}
            </div>

            {/* Preview Modal */}
            {showPreviewModal && selectedProduk && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowPreviewModal(false)}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-green-600 p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faEye} className="text-lg text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Detail Produk</h3>
                                        <p className="text-green-100 text-sm">Informasi lengkap tentang produk</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-green-700 rounded-lg"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Kolom Kiri - Gambar dan Deskripsi */}
                                <div className="space-y-4">
                                    {/* Gambar Produk */}
                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FontAwesomeIcon icon={faImage} className="text-blue-500 mr-2" />
                                            Gambar Produk
                                        </h4>
                                        {selectedProduk.gambar ? (
                                            <div className="relative">
                                                <img
                                                    src={selectedProduk.gambar}
                                                    alt={selectedProduk.nama || 'Produk'}
                                                    className="w-full h-48 object-cover rounded-lg border cursor-pointer"
                                                    onClick={() => setShowImageModal(true)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center border">
                                                <FontAwesomeIcon icon={faImage} className="text-gray-400 text-4xl mb-2" />
                                                <p className="text-gray-500">Tidak ada gambar</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Deskripsi */}
                                    <div className="bg-gray-50 rounded-lg p-4 border ">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
                                            Deskripsi
                                        </h4>
                                        <p className="text-gray-600">
                                            {selectedProduk.deskripsi || 'Tidak ada deskripsi tersedia.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Kolom Kanan - Informasi Produk */}
                                <div className="space-y-4">
                                    {/* Informasi Dasar */}
                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FontAwesomeIcon icon={faInfoCircle} className="text-green-500 mr-2" />
                                            Informasi Dasar
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Nama Produk</label>
                                                <p className="text-lg font-semibold text-gray-800 mt-1">
                                                    {selectedProduk.nama || 'Nama tidak tersedia'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600">SKU</label>
                                                    <p className="text-md font-medium text-gray-700 mt-1">
                                                        {selectedProduk.sku || '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600">Barcode</label>
                                                    <p className="text-md font-medium text-gray-700 mt-1">
                                                        {selectedProduk.barcode || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Kategori</label>
                                                <div className="mt-1">
                                                    {selectedProduk.kategori ? (
                                                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                            {selectedProduk.kategori}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                                            Tanpa Kategori
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informasi Harga & Stok */}
                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FontAwesomeIcon icon={faDollarSign} className="text-green-500 mr-2" />
                                            Informasi Harga & Stok
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Harga Beli</label>
                                                <p className="text-lg font-semibold text-gray-700 mt-1">
                                                    {formatRupiah(selectedProduk.hargaBeli)}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Harga Jual</label>
                                                <p className="text-lg font-semibold text-green-600 mt-1">
                                                    {formatRupiah(selectedProduk.hargaJual)}
                                                </p>
                                                <p className="text-xs text-gray-500">per 1000 gram</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Stok</label>
                                                <p className={`text-lg font-bold mt-1 ${(selectedProduk.stok || 0) <= 10 ? 'text-red-600' :
                                                    (selectedProduk.stok || 0) <= 50 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                    {(selectedProduk.stok || 0).toFixed(2)} {selectedProduk.satuan}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Berat</label>
                                                <p className="text-lg font-medium text-gray-700 mt-1">
                                                    {selectedProduk.berat ? `${selectedProduk.berat} ${selectedProduk.satuan || 'kg'}` : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informasi Tambahan */}
                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FontAwesomeIcon icon={faCalendar} className="text-blue-500 mr-2" />
                                            Informasi Tambahan
                                        </h4>
                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Tanggal Masuk</label>
                                                <p className="text-md text-gray-700 mt-1">
                                                    {selectedProduk.tanggalMasuk ? formatDate(selectedProduk.tanggalMasuk) : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600">Masa Simpan</label>
                                                <p className="text-md text-gray-700 mt-1">
                                                    {(selectedProduk.masaSimpanHari || '7')} hari
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedProduk && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowEditModal(false)}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-300 max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="bg-yellow-500 p-4 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faEdit} className="text-lg text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Edit Produk</h3>
                                    <p className="text-yellow-100 text-xs mt-1">Perbarui informasi produk</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white hover:bg-yellow-600 rounded-lg transition-colors"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                {/* Jenis Produk */}
                                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
                                    <label className="block text-xs font-semibold text-gray-700 mb-3">
                                        Jenis Produk <span className="text-red-500">*</span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Radio: Curah (Ditimbang) */}
                                        <label className={`relative flex items-start p-3 cursor-pointer rounded-lg border-2 transition-all ${
                                            editForm.jenisProduk === 'curah'
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 bg-white hover:border-green-300'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="jenisProduk"
                                                value="curah"
                                                checked={editForm.jenisProduk === 'curah'}
                                                onChange={handleEditFormChange}
                                                className="mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500"
                                            />
                                            <div className="ml-2">
                                                <div className="flex items-center space-x-2">
                                                    <FontAwesomeIcon icon={faWeightHanging} className="text-green-600 text-sm" />
                                                    <span className="font-semibold text-sm text-gray-900">Curah (Ditimbang)</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">• Harga per kg/liter</p>
                                                <p className="text-xs text-gray-600">• PLU timbangan</p>
                                            </div>
                                        </label>

                                        {/* Radio: Satuan Tetap */}
                                        <label className={`relative flex items-start p-3 cursor-pointer rounded-lg border-2 transition-all ${
                                            editForm.jenisProduk === 'satuan'
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 bg-white hover:border-blue-300'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="jenisProduk"
                                                value="satuan"
                                                checked={editForm.jenisProduk === 'satuan'}
                                                onChange={handleEditFormChange}
                                                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="ml-2">
                                                <div className="flex items-center space-x-2">
                                                    <FontAwesomeIcon icon={faBox} className="text-blue-600 text-sm" />
                                                    <span className="font-semibold text-sm text-gray-900">Satuan Tetap</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">• Harga per pcs/unit</p>
                                                <p className="text-xs text-gray-600">• Barcode/SKU tetap</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* SKU & Barcode */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            {editForm.jenisProduk === 'satuan' ? 'Kode SKU' : 'Kode PLU Timbangan'} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={editForm.sku}
                                            onChange={handleEditFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                        />
                                    </div> 
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Kode Barcode
                                        </label>
                                        <input
                                            type="text"
                                            name="barcode"
                                            value={editForm.barcode}
                                            onChange={handleEditFormChange}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                {/* Nama Produk */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                        Nama Produk <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nama"
                                        value={editForm.nama}
                                        onChange={handleEditFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                    />
                                </div>

                                {/* Kategori & Satuan */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <CustomSelect
                                            name="kategori"
                                            value={editForm.kategori}
                                            onChange={handleEditFormChange}
                                            options={kategoris.map(kat => ({
                                                value: kat.nama,
                                                label: kat.nama,
                                                description: kat.deskripsi
                                            }))}
                                            placeholder="Pilih Kategori"
                                            label="Kategori"
                                            icon={faTags}
                                            size="sm"
                                        />
                                    </div>

                                    <div>
                                        <CustomSelect
                                            name="satuan"
                                            value={editForm.satuan}
                                            onChange={handleEditFormChange}
                                            options={[
                                                { value: 'kg', label: 'Kg', icon: faBalanceScale },
                                                { value: 'gram', label: 'Gram', icon: faBalanceScale },
                                                { value: 'pcs', label: 'Pieces', icon: faCubes },
                                                { value: 'ikat', label: 'Ikat', icon: faGripVertical },
                                                { value: 'buah', label: 'Buah', icon: faAppleAlt },
                                                { value: 'pack', label: 'Pack', icon: faBox },
                                                { value: 'bungkus', label: 'Bungkus', icon: faBox }
                                            ]}
                                            placeholder="Pilih Satuan"
                                            label="Satuan"
                                            size="sm"
                                        />
                                    </div>
                                </div>

                                {/* Berat */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                        Berat per Unit
                                    </label>
                                    <input
                                        type="number"
                                        name="berat"
                                        value={editForm.berat}
                                        onChange={handleEditFormChange}
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                    />
                                </div>

                                {/* Harga */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Harga Beli
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500 font-medium text-sm">Rp</span>
                                            <input
                                                type="text"
                                                name="hargaBeli"
                                                value={editForm.hargaBeli}
                                                onChange={handleEditFormChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            {editForm.jenisProduk === 'satuan' ? 'Harga per pcs' : 'Harga per 1000 gram'} <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {editForm.jenisProduk === 'satuan'
                                                ? 'Harga untuk 1 pcs/unit produk'
                                                : 'Harga untuk 1 kg atau 1000 gram produk'}
                                        </p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500 font-medium text-sm">Rp</span>
                                            <input
                                                type="text"
                                                name="hargaJual"
                                                value={editForm.hargaJual}
                                                onChange={handleEditFormChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dates and Expiry Settings */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Tanggal Masuk
                                        </label>
                                        <input
                                            type="date"
                                            name="tanggalMasuk"
                                            value={editForm.tanggalMasuk}
                                            onChange={handleEditFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Masa Simpan (Hari)
                                        </label>
                                        <input
                                            type="number"
                                            name="masaSimpanHari"
                                            value={editForm.masaSimpanHari}
                                            onChange={handleEditFormChange}
                                            min="1"
                                            max="365"
                                            placeholder="7"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Default untuk batch baru</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Pemberitahuan (hari)
                                        </label>
                                        <input
                                            type="number"
                                            name="hariPemberitahuanKadaluarsa"
                                            value={editForm.hariPemberitahuanKadaluarsa}
                                            onChange={handleEditFormChange}
                                            min="1"
                                            max="365"
                                            placeholder="30"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm transition-all duration-200"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Hari notif sebelum exp</p>
                                    </div>
                                </div>

                                {/* Deskripsi */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        name="deskripsi"
                                        value={editForm.deskripsi}
                                        onChange={handleEditFormChange}
                                        rows="3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm resize-none transition-all duration-200"
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Stok Modal */}
            {showUpdateStokModal && selectedProduk && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowUpdateStokModal(false)}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-300 max-h-[85vh] overflow-hidden flex flex-col">
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
                                onClick={() => setShowUpdateStokModal(false)}
                                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white hover:bg-blue-600 rounded-lg transition-colors"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                {/* Current Stock Info */}
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium">Stok Saat Ini</p>
                                            <p className={`text-xl font-bold ${(selectedProduk.stok || 0) <= 10 ? 'text-red-600' :
                                                (selectedProduk.stok || 0) <= 50 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                {selectedProduk.stok || 0} {selectedProduk.satuan || 'pcs'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-600 font-medium">Status</p>
                                            <p className={`text-xs font-semibold ${(selectedProduk.stok || 0) <= 10 ? 'text-red-600' :
                                                (selectedProduk.stok || 0) <= 50 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                {(selectedProduk.stok || 0) <= 10 ? 'Stok Rendah' :
                                                    (selectedProduk.stok || 0) <= 50 ? 'Stok Cukup' :
                                                        'Stok Aman'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Adjustment Buttons */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-300">
                                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Penyesuaian Cepat</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button
                                            onClick={() => handleQuickStokAdjust(-10)}
                                            className="bg-red-500 hover:bg-red-600 text-white py-2 px-2 rounded-lg font-medium transition-colors text-xs"
                                        >
                                            -10
                                        </button>
                                        <button
                                            onClick={() => handleQuickStokAdjust(-5)}
                                            className="bg-red-400 hover:bg-red-500 text-white py-2 px-2 rounded-lg font-medium transition-colors text-xs"
                                        >
                                            -5
                                        </button>
                                        <button
                                            onClick={() => handleQuickStokAdjust(5)}
                                            className="bg-green-400 hover:bg-green-700 text-white py-2 px-2 rounded-lg font-medium transition-colors text-xs"
                                        >
                                            +5
                                        </button>
                                        <button
                                            onClick={() => handleQuickStokAdjust(10)}
                                            className="bg-green-700 hover:bg-green-600 text-white py-2 px-2 rounded-lg font-medium transition-colors text-xs"
                                        >
                                            +10
                                        </button>
                                    </div>
                                </div>

                                {/* Stock Update Form */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Set Stock Absolute */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                                Set Stok Baru
                                            </label>
                                            <input
                                                type="text"
                                                name="stokBaru"
                                                value={stokForm.stokBaru}
                                                onChange={handleStokFormChange}
                                                placeholder="Masukkan stok baru"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all duration-200"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Stok akan diatur ke nilai ini</p>
                                        </div>

                                        {/* Adjust Stock Relative */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                                Tambah/Kurangi Stok
                                            </label>
                                            <input
                                                type="text"
                                                name="perubahan"
                                                value={stokForm.perubahan}
                                                onChange={handleStokFormChange}
                                                placeholder="Contoh: +5 atau -3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all duration-200"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Gunakan + untuk tambah, - untuk kurang</p>
                                        </div>
                                    </div>

                                    {/* Jenis Perubahan */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Jenis Perubahan
                                        </label>
                                        <select
                                            name="jenis"
                                            value={stokForm.jenis}
                                            onChange={handleStokFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all duration-200"
                                        >
                                            <option value="manual">Manual</option>
                                            <option value="pembelian">Pembelian</option>
                                            <option value="penjualan">Penjualan</option>
                                            <option value="adjustment">Penyesuaian</option>
                                            <option value="return">Return</option>
                                        </select>
                                    </div>

                                    {/* Supplier */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Supplier
                                        </label>
                                        <input
                                            type="text"
                                            name="supplier"
                                            value={stokForm.supplier}
                                            onChange={handleStokFormChange}
                                            placeholder="Nama supplier (opsional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all duration-200"
                                        />
                                    </div>

                                    {/* Keterangan */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                                            Keterangan
                                        </label>
                                        <textarea
                                            name="keterangan"
                                            value={stokForm.keterangan}
                                            onChange={handleStokFormChange}
                                            rows="3"
                                            placeholder="Tambahkan catatan untuk perubahan stok ini..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm resize-none transition-all duration-200"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Preview */}
                                {(stokForm.stokBaru || stokForm.perubahan) && (
                                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                        <h4 className="font-semibold text-yellow-800 mb-2 text-sm">Preview Perubahan</h4>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-yellow-700">Stok saat ini:</span>
                                            <span className="font-semibold">{selectedProduk.stok || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm mt-1">
                                            <span className="text-yellow-700">Stok setelah perubahan:</span>
                                            <span className="font-semibold text-green-600">
                                                {stokForm.stokBaru
                                                    ? parseInt(stokForm.stokBaru)
                                                    : (selectedProduk.stok || 0) + parseInt(stokForm.perubahan || 0)
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowUpdateStokModal(false)}
                                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center text-sm"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Batal
                            </button>
                            <button
                                onClick={handleSaveStok}
                                disabled={!stokForm.stokBaru && !stokForm.perubahan}
                                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                Simpan Stok
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
                        onClick={() => setShowStokHistoryModal(false)}
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
                                onClick={() => setShowStokHistoryModal(false)}
                                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white hover:bg-purple-600 rounded-lg transition-colors"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingHistory ? (
                                <div className="flex flex-col justify-center items-center py-8">
                                    <div className="w-8 h-8 border-4 border-purple-500 rounded-full border-t-transparent animate-spin mb-3"></div>
                                    <p className="text-gray-600 text-sm">Memuat riwayat stok...</p>
                                </div>
                            ) : stokHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <FontAwesomeIcon icon={faHistory} className="text-gray-300 text-5xl mb-4" />
                                    <h4 className="text-lg font-semibold text-gray-600 mb-2">Belum ada riwayat stok</h4>
                                    <p className="text-gray-500 text-sm">Perubahan stok akan tercatat di sini</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stokHistory.map((history, index) => (
                                        <div key={history.id || index} className="bg-gray-50 rounded-xl p-4 border border-gray-300">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${history.jenisPerubahan === 'penjualan' ? 'bg-red-100 text-red-800' :
                                                        history.jenisPerubahan === 'pembelian' ? 'bg-green-100 text-green-800' :
                                                            history.jenisPerubahan === 'return' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {history.jenisPerubahan || 'manual'}
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

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Stok Sebelum:</span>
                                                    <p className="font-semibold">{history.stokSebelum || 0}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Stok Sesudah:</span>
                                                    <p className="font-semibold text-green-600">{history.stokSesudah || 0}</p>
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
                                                <div className="mt-3">
                                                    <span className="text-xs text-gray-600">Keterangan:</span>
                                                    <p className="text-sm text-gray-700 mt-1">{history.keterangan}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-300 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Total {stokHistory.length} riwayat perubahan
                            </div>
                            <button
                                onClick={() => setShowStokHistoryModal(false)}
                                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal Fullscreen */}
            {showImageModal && selectedProduk && selectedProduk.gambar && (
                <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
                    <div
                        className="absolute inset-0 bg-black bg-opacity-90 transition-all duration-300"
                        onClick={() => setShowImageModal(false)}
                    ></div>

                    <div className="relative z-10 max-w-7xl max-h-[95vh] w-full">
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute -top-12 right-0 bg-white hover:bg-gray-200 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg z-20"
                            title="Tutup"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-lg" />
                        </button>

                        <div className="absolute -top-12 left-0 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">
                            <p className="text-sm font-semibold text-gray-800">{selectedProduk.nama || 'Produk'}</p>
                        </div>

                        <div className="flex items-center justify-center">
                            <img
                                src={selectedProduk.gambar}
                                alt={selectedProduk.nama || 'Produk'}
                                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                            />
                        </div>

                        <div className="absolute -bottom-12 left-0 right-0 text-center">
                            <p className="text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-lg inline-block">
                                Klik di luar gambar untuk menutup
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleDeleteModalClose}
                onConfirm={handleConfirmDelete}
                item={selectedProduk}
                itemType="produk"
                title="Hapus Produk"
                description="Konfirmasi penghapusan produk"
                confirmButtonText="Ya, Hapus"
                cancelButtonText="Batal"
            />
        </div>
    );
};

export default DaftarProduk;