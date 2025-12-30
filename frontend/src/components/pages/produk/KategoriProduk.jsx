import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTags,
    faEdit,
    faTrash,
    faPlus,
    faSave,
    faTimes,
    faBox,
    faEye,
    faList,
    faInfoCircle,
    faAppleAlt,
    faCarrot,
    faLeaf,
    faPepperHot,
    faSeedling,
    faLemon,
    faShoppingBasket,
    faExclamationTriangle,
    faCheckCircle,
    faTriangleExclamation,
    faSearch,
    faFilter,
    faSync,
    faChevronDown,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import { produkAPI, kategoriAPI } from '../../../api';
import { useToast } from '../../common/ToastContainer';
import { usePreventBodyScrollMultiple } from '../../../hooks/usePreventBodyScroll';
import Pagination from '../../common/Pagination';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';

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

const KategoriProduk = () => {
    const [kategoris, setKategoris] = useState([]);
    const [filteredKategoris, setFilteredKategoris] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showProductList, setShowProductList] = useState(false);
    const [selectedKategori, setSelectedKategori] = useState(null);
    const [produkList, setProdukList] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [kategoriToDelete, setKategoriToDelete] = useState(null);
    const [formData, setFormData] = useState({
        id: 0,
        nama: '',
        deskripsi: '',
        icon: 'faCarrot'
    });

    // Search & Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('nama');
    const [sortOrder, setSortOrder] = useState('asc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(9);

    const toast = useToast();

    const availableIcons = [
        { value: 'faCarrot', icon: faCarrot, label: 'Wortel' },
        { value: 'faAppleAlt', icon: faAppleAlt, label: 'Apel' },
        { value: 'faLeaf', icon: faLeaf, label: 'Daun' },
        { value: 'faPepperHot', icon: faPepperHot, label: 'Cabai' },
        { value: 'faSeedling', icon: faSeedling, label: 'Kecambah' },
        { value: 'faLemon', icon: faLemon, label: 'Lemon' },
        { value: 'faShoppingBasket', icon: faShoppingBasket, label: 'Keranjang' },
        { value: 'faTags', icon: faTags, label: 'Tag' }
    ];

    const getIconByValue = (iconValue) => {
        const iconObj = availableIcons.find(icon => icon.value === iconValue);
        return iconObj ? iconObj.icon : faCarrot;
    };

    useEffect(() => {
        loadKategoris();
    }, []);

    // Filter kategoris ketika search term atau sort berubah
    useEffect(() => {
        filterAndSortKategoris();
    }, [kategoris, searchTerm, sortBy, sortOrder]);

    // Reset ke halaman pertama ketika search atau filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, sortOrder]);

    // Prevent body scroll when any modal is open (Global hook)
    usePreventBodyScrollMultiple(showModal, showDeleteConfirm, showProductList);

    const loadKategoris = async () => {
        setLoading(true);
        try {
            const data = await kategoriAPI.getAll();
            setKategoris(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.showError('Gagal memuat data kategori');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortKategoris = () => {
        let filtered = [...kategoris];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(kategori =>
                kategori.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (kategori.deskripsi && kategori.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'jumlahProduk':
                    aValue = a.jumlahProduk || 0;
                    bValue = b.jumlahProduk || 0;
                    break;
                case 'nama':
                default:
                    aValue = a.nama.toLowerCase();
                    bValue = b.nama.toLowerCase();
                    break;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredKategoris(filtered);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleIconSelect = (iconValue) => {
        setFormData({ ...formData, icon: iconValue });
    };

    const handleAddNew = () => {
        setEditMode(false);
        setFormData({
            id: 0,
            nama: '',
            deskripsi: '',
            icon: 'faCarrot'
        });
        setShowModal(true);
    };

    const handleEdit = (kategori) => {
        setEditMode(true);
        setFormData({
            id: kategori.id,
            nama: kategori.nama,
            deskripsi: kategori.deskripsi || '',
            icon: kategori.icon || 'faCarrot'
        });
        setShowModal(true);
    };

    const handleViewProducts = async (kategori) => {
        setSelectedKategori(kategori);
        setShowProductList(true);

        try {
            const allProducts = await produkAPI.getAll();
            const filtered = allProducts.filter(p => p.kategori === kategori.nama);
            setProdukList(filtered);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.showError('Gagal memuat daftar produk');
        }
    };

    const handleSave = async () => {
        if (!formData.nama.trim()) {
            toast.showWarning('Nama kategori harus diisi');
            return;
        }

        try {
            if (editMode) {
                await kategoriAPI.update(formData);
                toast.showSuccess('Kategori berhasil diperbarui!');
            } else {
                await kategoriAPI.create(formData);
                toast.showSuccess('Kategori berhasil ditambahkan!');
            }

            setShowModal(false);
            loadKategoris();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.showError(error.message || 'Gagal menyimpan kategori');
        }
    };

    const handleDeleteClick = (kategori) => {
        if (kategori.jumlahProduk > 0) {
            toast.showWarning(`Tidak dapat menghapus kategori yang memiliki ${kategori.jumlahProduk} produk`);
            return;
        }
        setKategoriToDelete(kategori);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!kategoriToDelete) return;

        try {
            await kategoriAPI.delete(kategoriToDelete.id);
            toast.showSuccess('Kategori berhasil dihapus!');

            setShowDeleteConfirm(false);
            setKategoriToDelete(null);
            loadKategoris();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.showError(error.message || 'Gagal menghapus kategori');
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setKategoriToDelete(null);
    };

    // Search handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSortChange = (value) => {
        setSortBy(value);
    };

    const handleSortOrderToggle = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Pagination calculation
    const totalItems = filteredKategoris.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedKategoris = filteredKategoris.slice(startIndex, endIndex);

    return (
        <div className="page overflow-x-hidden min-h-screen bg-gray-50 p-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center space-x-4 mb-3">
                    <div className="bg-primary p-4 rounded-2xl shadow-lg">
                        <FontAwesomeIcon icon={faTags} className="text-white text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Kategori Produk</h2>
                        <p className="text-gray-600 mt-1">Kelola dan organisir kategori produk Anda</p>
                    </div>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow--hidden mb-8">
                <div className="bg-primary border-b rounded-t-2xl border-green-100 px-6 py-4 ">
                    <div className="flex items-center justify-between  ">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faSearch} className="text-white text-xl" />
                            <h3 className="text-xl font-semibold text-white">Pencarian & Filter Kategori</h3>
                        </div>
                        <button
                            onClick={loadKategoris}
                            disabled={loading}
                            className="bg-white hover:bg-gray-100 text-green-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faSync} className={`${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh Data</span>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="space-y-6">
                        {/* Search & Filter Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Search Input */}
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cari Kategori
                                </label>
                                <div className="relative">
                                    <FontAwesomeIcon
                                        icon={faSearch}
                                        className="absolute left-4 top-3.5 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        placeholder="Cari berdasarkan nama kategori atau deskripsi..."
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={clearSearch}
                                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Hapus pencarian"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Urutkan Berdasarkan
                                </label>
                                <CustomSelect
                                    name="sortBy"
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    options={[
                                        { value: 'nama', label: 'Nama Kategori' },
                                        { value: 'jumlahProduk', label: 'Jumlah Produk' }
                                    ]}
                                    placeholder="Pilih urutan"
                                    icon={faFilter}
                                    size="md"
                                />
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Urutan
                                </label>
                                <button
                                    onClick={handleSortOrderToggle}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                                >
                                    <span>{sortOrder === 'asc' ? 'A → Z' : 'Z → A'}</span>
                                    <FontAwesomeIcon
                                        icon={sortOrder === 'asc' ? faFilter : faFilter}
                                        className="text-gray-400"
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Search Results Info */}
                        {searchTerm && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <div className="flex items-center space-x-3">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600 text-lg" />
                                    <div>
                                        <p className="text-yellow-800 font-medium">
                                            Menampilkan {filteredKategoris.length} dari {kategoris.length} kategori
                                        </p>
                                        <p className="text-yellow-700 text-sm">
                                            Hasil pencarian untuk: <span className="font-semibold">"{searchTerm}"</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={clearSearch}
                                        className="ml-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Hapus Pencarian
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-primary border-b border-green-100 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faList} className="text-white text-xl" />
                        <h3 className="text-xl font-semibold text-white">Daftar Kategori</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-white text-sm bg-green-600 px-3 py-1 rounded-full font-medium">
                            Menampilkan: {filteredKategoris.length} kategori
                        </div>
                        <button
                            onClick={handleAddNew}
                            className="bg-white hover:bg-gray-100 text-green-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium shadow hover:shadow-lg"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Tambah Kategori</span>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <div className="w-12 h-12 border-4 border-green-500 rounded-full border-t-transparent animate-spin mb-4"></div>
                            <p className="text-gray-600 font-medium">Memuat data kategori...</p>
                        </div>
                    ) : filteredKategoris.length === 0 ? (
                        <div className="text-center py-12">
                            <FontAwesomeIcon icon={faTags} className="text-gray-300 text-6xl mb-4" />
                            <h4 className="text-lg font-semibold text-gray-600 mb-2">
                                {searchTerm ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
                            </h4>
                            <p className="text-gray-500 mb-6">
                                {searchTerm
                                    ? 'Coba ubah kata kunci pencarian atau hapus filter'
                                    : 'Klik tombol "Tambah Kategori" untuk memulai'
                                }
                            </p>
                            {searchTerm ? (
                                <button
                                    onClick={clearSearch}
                                    className="bg-primary hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                                >
                                    Hapus Pencarian
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddNew}
                                    className="bg-primary hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                                >
                                    Tambah Kategori Pertama
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedKategoris.map((kategori) => (
                                    <div
                                        key={kategori.id}
                                        className="bg-white rounded-xl border-2 border-gray-100 hover:border-green-300 transition-all duration-300 p-5 group"
                                    >
                                        <div className="flex items-start space-x-4 mb-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-all duration-300">
                                                    <FontAwesomeIcon
                                                        icon={getIconByValue(kategori.icon)}
                                                        className="text-green-600 text-xl"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-800 text-lg truncate group-hover:text-green-700 transition-colors">
                                                    {kategori.nama}
                                                </h3>
                                                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${kategori.jumlahProduk > 0
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {kategori.jumlahProduk || 0} Produk
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                                                <div
                                                    className="p-3 text-sm text-gray-500 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                                                    style={{
                                                        minHeight: '60px',
                                                        scrollbarWidth: 'thin',
                                                        scrollbarColor: '#d1d5db #f3f4f6'
                                                    }}
                                                >
                                                    {kategori.deskripsi || 'Tidak ada deskripsi'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex space-x-2 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleViewProducts(kategori)}
                                                className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 px-2 py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 text-xs font-medium hover:scale-105 min-w-0"
                                            >
                                                <FontAwesomeIcon icon={faEye} className="text-xs" />
                                                <span className="truncate">Lihat</span>
                                            </button>
                                            <button
                                                onClick={() => handleEdit(kategori)}
                                                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 text-xs font-medium hover:scale-105 min-w-0"
                                            >
                                                <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                                <span className="truncate">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(kategori)}
                                                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 text-xs font-medium hover:scale-105 min-w-0"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                <span className="truncate">Hapus</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-8">
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
                        </>
                    )}
                </div>
            </div>

            {/* Modal Kategori */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowModal(false)}
                    ></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-primary p-6 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={editMode ? faEdit : faPlus} className="text-lg text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">
                                        {editMode ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                                    </h3>
                                    <p className="text-green-100 text-sm mt-1">
                                        {editMode ? 'Perbarui informasi kategori' : 'Tambahkan kategori baru ke sistem'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-primary hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Nama Kategori <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nama"
                                    value={formData.nama}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200"
                                    placeholder="Contoh: Sayuran Hijau"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Pilih Icon
                                </label>
                                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-xl">
                                    {availableIcons.map((iconObj) => (
                                        <button
                                            key={iconObj.value}
                                            type="button"
                                            onClick={() => handleIconSelect(iconObj.value)}
                                            className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${formData.icon === iconObj.value
                                                ? 'border-green-500 bg-green-50 text-green-600'
                                                : 'border-gray-300 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50'
                                                }`}
                                            title={iconObj.label}
                                        >
                                            <FontAwesomeIcon icon={iconObj.icon} className="text-lg" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Deskripsi
                                </label>
                                <textarea
                                    name="deskripsi"
                                    value={formData.deskripsi}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white resize-none transition-all duration-200"
                                    rows="3"
                                    placeholder="Deskripsi kategori (opsional)"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow hover:shadow-lg"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-primary hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                            >
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                item={kategoriToDelete}
                itemType="kategori"
                title="Hapus Kategori"
                description="Konfirmasi penghapusan kategori"
                confirmButtonText="Ya, Hapus"
                cancelButtonText="Batal"
            />

            {/* Modal Daftar Produk */}
            {showProductList && selectedKategori && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowProductList(false)}
                    ></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 border border-gray-300 max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="bg-primary p-6 text-white relative">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                                    <FontAwesomeIcon icon={faList} className="text-xl text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">
                                        Daftar Produk - {selectedKategori.nama}
                                    </h3>
                                    <p className="text-green-100 text-sm mt-1">
                                        Total {produkList.length} produk dalam kategori ini
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowProductList(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-primary hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            {produkList.length === 0 ? (
                                <div className="text-center py-12">
                                    <FontAwesomeIcon icon={faBox} className="text-gray-300 text-6xl mb-4" />
                                    <h4 className="text-lg font-semibold text-gray-600 mb-2">Belum ada produk</h4>
                                    <p className="text-gray-500">Tidak ada produk dalam kategori ini</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {produkList.map((produk, index) => (
                                        <div
                                            key={produk.id}
                                            className="bg-white p-5 rounded-xl border border-gray-300 hover:border-green-300 transition-all duration-300"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 flex-1">
                                                    <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold min-w-12 text-center">
                                                        #{index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-800 text-lg mb-1">{produk.nama}</h4>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                            <span>SKU: {produk.sku}</span>
                                                            <span>•</span>
                                                            <span>Stok: {produk.stok} {produk.satuan}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-green-600">
                                                        Rp {produk.hargaJual?.toLocaleString('id-ID') || '0'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">Harga Jual</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white border-t border-gray-300 flex justify-end">
                            <button
                                onClick={() => setShowProductList(false)}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 shadow hover:shadow-lg"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KategoriProduk;