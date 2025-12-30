


import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUndo,
    faSearch,
    faPlus,
    faTimes,
    faCheck,
    faExchangeAlt,
    faMoneyBillWave,
    faInfoCircle,
    faList,
    faBox,
    faExclamationTriangle,
    faCheckCircle,
    faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { produkAPI, transaksiAPI, returnAPI } from '../../../api';
import { useToast } from '../../common/ToastContainer';
import { usePreventBodyScrollMultiple } from '../../../hooks/usePreventBodyScroll';
import Pagination from '../../common/Pagination';
import CustomSelect from '../../common/CustomSelect';

const ReturnBarang = () => {
    const toast = useToast();
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showFinalConfirmModal, setShowFinalConfirmModal] = useState(false);
    const [searchNoTransaksi, setSearchNoTransaksi] = useState('');
    const [transaksi, setTransaksi] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [returnQuantities, setReturnQuantities] = useState({});
    const [returnReason, setReturnReason] = useState('');
    const [returnType, setReturnType] = useState('refund');
    const [replacementProduct, setReplacementProduct] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [returnHistory, setReturnHistory] = useState([]);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [processingReturn, setProcessingReturn] = useState(false);

    usePreventBodyScrollMultiple(showFormModal, showDetailModal, showConfirmModal, showFinalConfirmModal);

    useEffect(() => {
        loadReturnHistory();
        loadAllProducts();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterPeriod]);

    const loadReturnHistory = async () => {
        setLoading(true);
        try {
            const data = await returnAPI.getAll();
            setReturnHistory(data || []);
        } catch (error) {
            console.error('Error loading return history:', error);
            toast.showError('Gagal memuat riwayat return');
        } finally {
            setLoading(false);
        }
    };

    const loadAllProducts = async () => {
        try {
            const data = await produkAPI.getAll();
            setAllProducts(data || []);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleSearchTransaksi = async () => {
        if (!searchNoTransaksi.trim()) {
            toast.showWarning('Masukkan nomor transaksi');
            return;
        }

        setLoading(true);
        try {
            const data = await transaksiAPI.getByNoTransaksi(searchNoTransaksi);
            if (data) {
                setTransaksi(data);
                setSelectedProducts([]);
                setReturnQuantities({});
                toast.showSuccess('Transaksi ditemukan');
            } else {
                toast.showError('Transaksi tidak ditemukan');
                setTransaksi(null);
            }
        } catch (error) {
            toast.showError('Error mencari transaksi');
            setTransaksi(null);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (productId) => {
        if (selectedProducts.includes(productId)) {
            setSelectedProducts(selectedProducts.filter(id => id !== productId));
            const newQuantities = { ...returnQuantities };
            delete newQuantities[productId];
            setReturnQuantities(newQuantities);
        } else {
            setSelectedProducts([...selectedProducts, productId]);
        }
    };

    const handleQuantityChange = (productId, value) => {
        const product = transaksi?.items?.find(p => p.produkId === productId);
        if (!product) return;

        const qty = parseInt(value) || 0;
        if (qty > product.jumlah) {
            toast.showWarning(`Jumlah tidak boleh melebihi ${product.jumlah}`);
            return;
        }

        setReturnQuantities({
            ...returnQuantities,
            [productId]: qty
        });
    };

    const validateReturnData = () => {
        if (selectedProducts.length === 0) {
            toast.showWarning('Pilih minimal 1 produk untuk dikembalikan');
            return false;
        }

        for (const productId of selectedProducts) {
            if (!returnQuantities[productId] || returnQuantities[productId] <= 0) {
                toast.showWarning('Masukkan jumlah return untuk semua produk yang dipilih');
                return false;
            }
        }

        if (!returnReason) {
            toast.showWarning('Pilih alasan return');
            return false;
        }

        if (returnType === 'exchange' && !replacementProduct) {
            toast.showWarning('Pilih produk pengganti');
            return false;
        }

        return true;
    };

    const handleConfirmReturn = () => {
        if (!validateReturnData()) {
            return;
        }
        setShowConfirmModal(true);
    };

    const handleFinalConfirmReturn = () => {
        setShowConfirmModal(false);
        setShowFinalConfirmModal(true);
    };

    const handleSubmitReturn = async () => {
        setProcessingReturn(true);

        const returnData = {
            transaksi_id: transaksi.transaksi.id,
            no_transaksi: transaksi.transaksi.nomorTransaksi,
            products: selectedProducts.map(productId => ({
                product_id: productId,
                quantity: returnQuantities[productId]
            })),
            reason: returnReason,
            type: returnType,
            replacement_product_id: returnType === 'exchange' ? parseInt(replacementProduct) : 0,
            return_date: new Date().toISOString()
        };

        try {
            await returnAPI.create(returnData);
            toast.showSuccess('Return barang berhasil diproses');
            resetForm();
            setShowFinalConfirmModal(false);
            setShowFormModal(false);
            loadReturnHistory();
        } catch (error) {
            toast.showError('Gagal memproses return barang');
        } finally {
            setProcessingReturn(false);
        }
    };

    const resetForm = () => {
        setSearchNoTransaksi('');
        setTransaksi(null);
        setSelectedProducts([]);
        setReturnQuantities({});
        setReturnReason('');
        setReturnType('refund');
        setReplacementProduct('');
    };

    const openFormModal = () => {
        resetForm();
        setShowFormModal(true);
    };

    const openDetailModal = (returnItem) => {
        setSelectedReturn(returnItem);
        setShowDetailModal(true);
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getSelectedProductsDetails = () => {
        return selectedProducts.map(productId => {
            const product = transaksi.items.find(p => p.produkId === productId);
            return {
                name: product.produkNama,
                quantity: returnQuantities[productId],
                originalQuantity: product.jumlah
            };
        });
    };

    const getReplacementProductName = () => {
        if (returnType === 'exchange' && replacementProduct) {
            const product = allProducts.find(p => p.id === parseInt(replacementProduct));
            return product ? product.nama : 'Produk tidak ditemukan';
        }
        return '';
    };

    const getTotalReturnItems = () => {
        return selectedProducts.reduce((total, productId) => {
            return total + (returnQuantities[productId] || 0);
        }, 0);
    };

    const filteredHistory = returnHistory.filter(item => {
        const returnData = item.return || item;
        const noTransaksi = returnData.no_transaksi || returnData.noTransaksi || '';
        const matchSearch = noTransaksi.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === 'all' || returnData.type === filterType;

        let matchPeriod = true;
        const dateField = returnData.return_date || returnData.returnDate;
        if (filterPeriod !== 'all' && dateField) {
            const returnDate = new Date(dateField);
            const today = new Date();

            if (filterPeriod === 'today') {
                matchPeriod = returnDate.toDateString() === today.toDateString();
            } else if (filterPeriod === 'month') {
                matchPeriod = returnDate.getMonth() === today.getMonth() &&
                    returnDate.getFullYear() === today.getFullYear();
            } else if (filterPeriod === 'year') {
                matchPeriod = returnDate.getFullYear() === today.getFullYear();
            }
        }

        return matchSearch && matchType && matchPeriod;
    });

    const totalItems = filteredHistory.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const returnReasons = [
        { value: 'damaged', label: 'Barang Rusak' },
        { value: 'wrong_item', label: 'Tidak Sesuai Pesanan' },
        { value: 'expired', label: 'Kadaluarsa' },
        { value: 'other', label: 'Lainnya' }
    ];

    // Options untuk filter
    const filterTypeOptions = [
        { value: 'all', label: 'Semua Tipe' },
        { value: 'refund', label: 'Refund' },
        { value: 'exchange', label: 'Tukar Produk' }
    ];

    const filterPeriodOptions = [
        { value: 'all', label: 'Semua Periode' },
        { value: 'today', label: 'Hari Ini' },
        { value: 'month', label: 'Bulan Ini' },
        { value: 'year', label: 'Tahun Ini' }
    ];

    // Options untuk produk pengganti
    const replacementProductOptions = allProducts.map(product => ({
        value: product.id.toString(),
        label: `${product.nama} - ${formatRupiah(product.harga)}`
    }));

    return (
        <div className="page overflow-x-hidden min-h-screen bg-gray-50 p-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-primary p-4 rounded-2xl shadow-lg">
                            <FontAwesomeIcon icon={faUndo} className="text-white text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Return Barang</h2>
                            <p className="text-gray-600 mt-1">Kelola pengembalian dan retur produk</p>
                        </div>
                    </div>
                    <button
                        onClick={openFormModal}
                        className="bg-primary hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Return Barang</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="bg-primary border-b border-green-100 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faList} className="text-white text-xl" />
                        <h3 className="text-xl font-semibold text-white">Riwayat Return</h3>
                    </div>
                    <div className="text-white text-sm bg-green-600 px-3 py-1 rounded-full font-medium">
                        Total: {returnHistory.length} return
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="p-6 bg-gray-50 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-600 mb-2">Cari Transaksi</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="No. transaksi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Tipe Return</label>
                            <CustomSelect
                                name="filterType"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                options={filterTypeOptions}
                                placeholder="Pilih tipe return"
                                size="md"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Periode</label>
                            <CustomSelect
                                name="filterPeriod"
                                value={filterPeriod}
                                onChange={(e) => setFilterPeriod(e.target.value)}
                                options={filterPeriodOptions}
                                placeholder="Pilih periode"
                                size="md"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Memuat data return...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <FontAwesomeIcon icon={faUndo} className="text-gray-300 text-6xl mb-4" />
                            <p className="text-gray-600 font-medium text-lg mb-2">Belum ada riwayat return</p>
                            <p className="text-gray-500 mb-4">Klik tombol "Return Barang" untuk memulai</p>
                            <button
                                onClick={openFormModal}
                                className="bg-primary hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                <span>Buat Return Pertama</span>
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">No. Transaksi</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">Tanggal Return</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">Tipe</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">Alasan</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">Jumlah Produk</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedHistory.map((item, index) => {
                                        const returnData = item.return || item;
                                        const dateField = returnData.return_date || returnData.returnDate;
                                        return (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {returnData.no_transaksi || returnData.noTransaksi || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {dateField ? new Date(dateField).toLocaleDateString('id-ID') : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${returnData.type === 'refund'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {returnData.type === 'refund' ? 'Refund' : 'Tukar Produk'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {returnReasons.find(r => r.value === returnData.reason)?.label || returnData.reason}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {item.products?.length || 0} produk
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => openDetailModal(item)}
                                                        className="relative group w-10 h-10 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                                                    >
                                                        <FontAwesomeIcon icon={faInfoCircle} />
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            Detail
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Pagination Component */}
                    {!loading && filteredHistory.length > 0 && (
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
            </div>

            {/* Modal Form Return */}
            {showFormModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowFormModal(false)}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-primary p-6 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faUndo} className="text-lg text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Return Barang</h3>
                                    <p className="text-green-100 text-sm mt-1">Proses pengembalian produk dari transaksi</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFormModal(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-primary hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {/* Search Transaction */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Cari Transaksi <span className="text-red-500">*</span>
                                </label>
                                <div className="flex space-x-3">
                                    <div className="flex-1 relative">
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Masukkan nomor transaksi..."
                                            value={searchNoTransaksi}
                                            onChange={(e) => setSearchNoTransaksi(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearchTransaksi()}
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearchTransaksi}
                                        className="bg-primary hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                                    >
                                        <FontAwesomeIcon icon={faSearch} />
                                        <span>Cari</span>
                                    </button>
                                </div>
                            </div>

                            {/* Transaction Details */}
                            {transaksi && (
                                <div className="space-y-6">
                                    {/* Transaction Info */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-300">
                                        <h3 className="font-semibold text-gray-800 mb-3">Informasi Transaksi</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">No. Transaksi:</span>
                                                <span className="ml-2 font-medium text-gray-800">{transaksi.transaksi.nomorTransaksi}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Tanggal:</span>
                                                <span className="ml-2 font-medium text-gray-800">
                                                    {new Date(transaksi.transaksi.tanggal).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Pilih Produk yang Akan Dikembalikan <span className="text-red-500">*</span>
                                        </label>
                                        <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
                                            <table className="w-full">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pilih</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Produk</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jumlah Beli</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jumlah Return</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {transaksi.items?.map((item) => (
                                                        <tr key={item.produkId} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedProducts.includes(item.produkId)}
                                                                    onChange={() => handleProductSelect(item.produkId)}
                                                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.produkNama}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{item.jumlah}</td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.jumlah}
                                                                    value={returnQuantities[item.produkId] || ''}
                                                                    onChange={(e) => handleQuantityChange(item.produkId, e.target.value)}
                                                                    disabled={!selectedProducts.includes(item.produkId)}
                                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-100 transition-all duration-200"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Return Reason */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Alasan Return <span className="text-red-500">*</span>
                                        </label>
                                        <CustomSelect
                                            name="returnReason"
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            options={returnReasons}
                                            placeholder="Pilih alasan return"
                                            size="md"
                                        />
                                    </div>

                                    {/* Return Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Tipe Return <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setReturnType('refund')}
                                                className={`p-4 border-2 rounded-xl transition-all duration-300 ${returnType === 'refund'
                                                    ? 'border-green-500 bg-green-50 shadow-md'
                                                    : 'border-gray-300 hover:border-green-400 hover:shadow-sm'
                                                    }`}
                                            >
                                                <FontAwesomeIcon icon={faMoneyBillWave} className={`text-2xl mb-2 ${returnType === 'refund' ? 'text-green-600' : 'text-gray-400'
                                                    }`} />
                                                <div className="text-sm font-medium text-gray-800">Refund</div>
                                                <div className="text-xs text-gray-600">Pengembalian uang</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReturnType('exchange')}
                                                className={`p-4 border-2 rounded-xl transition-all duration-300 ${returnType === 'exchange'
                                                    ? 'border-green-500 bg-green-50 shadow-md'
                                                    : 'border-gray-300 hover:border-green-400 hover:shadow-sm'
                                                    }`}
                                            >
                                                <FontAwesomeIcon icon={faExchangeAlt} className={`text-2xl mb-2 ${returnType === 'exchange' ? 'text-green-600' : 'text-gray-400'
                                                    }`} />
                                                <div className="text-sm font-medium text-gray-800">Tukar Produk</div>
                                                <div className="text-xs text-gray-600">Ganti dengan produk lain</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Replacement Product (if exchange) */}
                                    {returnType === 'exchange' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                Produk Pengganti <span className="text-red-500">*</span>
                                            </label>
                                            <CustomSelect
                                                name="replacementProduct"
                                                value={replacementProduct}
                                                onChange={(e) => setReplacementProduct(e.target.value)}
                                                options={replacementProductOptions}
                                                placeholder="Pilih produk pengganti"
                                                size="md"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {transaksi && (
                            <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowFormModal(false)}
                                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow hover:shadow-lg"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                    Batal
                                </button>
                                <button
                                    onClick={handleConfirmReturn}
                                    className="bg-primary hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                                >
                                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                    Lanjutkan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Konfirmasi Pertama - Ringkasan Return */}
            {showConfirmModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
                    <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300">
                        <div className="bg-yellow-500 p-6 text-white rounded-t-2xl">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                                    <FontAwesomeIcon icon={faQuestionCircle} className="text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Konfirmasi Return</h3>
                                    <p className="text-yellow-100 text-sm mt-1">Periksa kembali data return</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <div className="flex items-center space-x-2 text-yellow-800">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span className="font-semibold">Ringkasan Return:</span>
                                </div>
                                <div className="mt-3 space-y-2 text-sm text-gray-700">
                                    <div className="flex justify-between">
                                        <span>No. Transaksi:</span>
                                        <span className="font-medium">{transaksi?.transaksi?.nomorTransaksi}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Item Return:</span>
                                        <span className="font-medium">{getTotalReturnItems()} item</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tipe Return:</span>
                                        <span className="font-medium">{returnType === 'refund' ? 'Refund' : 'Tukar Produk'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Alasan:</span>
                                        <span className="font-medium">{returnReasons.find(r => r.value === returnReason)?.label}</span>
                                    </div>
                                    {returnType === 'exchange' && (
                                        <div className="flex justify-between">
                                            <span>Produk Pengganti:</span>
                                            <span className="font-medium text-right">{getReplacementProductName()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-800 text-sm mb-2">Produk yang Dikembalikan:</h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {getSelectedProductsDetails().map((product, index) => (
                                        <div key={index} className="flex justify-between text-sm text-gray-600">
                                            <span className="truncate flex-1">{product.name}</span>
                                            <span className="ml-2 font-medium">
                                                {product.quantity}/{product.originalQuantity}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow hover:shadow-lg"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Periksa Lagi
                            </button>
                            <button
                                onClick={handleFinalConfirmReturn}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                            >
                                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Konfirmasi Kedua - Final Confirmation */}
            {showFinalConfirmModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
                    <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={() => setShowFinalConfirmModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300">
                        <div className="bg-red-500 p-6 text-white rounded-t-2xl">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Konfirmasi Akhir</h3>
                                    <p className="text-red-100 text-sm mt-1">Return tidak dapat dibatalkan</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <div className="flex items-center space-x-2 text-red-800 mb-3">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    <span className="font-semibold">Peringatan!</span>
                                </div>
                                <p className="text-sm text-red-700">
                                    Apakah Anda yakin ingin memproses return ini? Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi stok produk.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="text-center">
                                    <FontAwesomeIcon icon={faUndo} className="text-4xl text-gray-400 mb-3" />
                                    <p className="text-sm text-gray-600 font-medium">
                                        Return akan dicatat dalam sistem dan stok akan disesuaikan
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowFinalConfirmModal(false)}
                                disabled={processingReturn}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                Batalkan
                            </button>
                            <button
                                onClick={handleSubmitReturn}
                                disabled={processingReturn}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processingReturn ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                        Ya, Proses Return
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Return */}
            {showDetailModal && selectedReturn && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div
                        className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowDetailModal(false)}
                    ></div>

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-300 max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="bg-primary p-6 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-lg text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Detail Return</h3>
                                    <p className="text-green-100 text-sm mt-1">Informasi lengkap return barang</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-primary hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {(() => {
                                const returnData = selectedReturn.return || selectedReturn;
                                const dateField = returnData.return_date || returnData.returnDate;
                                const replacementId = returnData.replacement_product_id || returnData.replacementProductID;
                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-2">No. Transaksi</label>
                                                <p className="text-gray-900 font-medium text-lg">
                                                    {returnData.no_transaksi || returnData.noTransaksi || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-2">Tanggal Return</label>
                                                <p className="text-gray-900 font-medium text-lg">
                                                    {dateField ? new Date(dateField).toLocaleDateString('id-ID') : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-2">Tipe Return</label>
                                                <p className="text-gray-900 font-medium text-lg">
                                                    {returnData.type === 'refund' ? 'Refund' : 'Tukar Produk'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-2">Alasan Return</label>
                                                <p className="text-gray-900 font-medium text-lg">
                                                    {returnReasons.find(r => r.value === returnData.reason)?.label || returnData.reason}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-600 mb-3 block">Produk yang Dikembalikan</label>
                                            <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
                                                <table className="w-full">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Produk</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jumlah</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {selectedReturn.products?.map((product, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                                                    {product.nama || `ID: ${product.product_id}` || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600">{product.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {returnData.type === 'exchange' && replacementId && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600 block mb-2">Produk Pengganti</label>
                                                <p className="text-gray-900 font-medium text-lg">
                                                    ID Produk: {replacementId}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
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

export default ReturnBarang;