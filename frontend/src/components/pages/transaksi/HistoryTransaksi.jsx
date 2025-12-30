import { useState, useEffect } from 'react';
import { usePreventBodyScrollMultiple } from '../../../hooks/usePreventBodyScroll';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHistory, faEye, faCalendar, faSearch, faTimes,
    faReceipt, faMoneyBill, faShoppingCart, faUser,
    faFilter, faFileExport, faPrint, faList,
    faInfoCircle, faTags, faBox
} from '@fortawesome/free-solid-svg-icons';
import { transaksiAPI, printerAPI } from '../../../api';
import { useToast } from '../../common/ToastContainer';
import Pagination from '../../common/Pagination';
import CustomDatePicker from '../../common/CustomDatePicker';

export default function HistoryTransaksi() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
    const [transactionToPrint, setTransactionToPrint] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    const [limit] = useState(100);
    const [offset] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { addToast } = useToast();

    // Prevent body scroll when any modal is open
    usePreventBodyScrollMultiple(showDetailModal, showPrintPreviewModal);

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
        setCurrentPage(1); // Reset to first page when filters change
    }, [transactions, searchTerm, dateFilter]);

    const loadTransactions = async () => {
        console.log('[FRONTEND] Loading transactions...');
        setLoading(true);
        try {
            console.log(`[FRONTEND] Calling GetAllTransaksi with limit=${limit}, offset=${offset}`);
            const data = await transaksiAPI.getAll(limit, offset);
            console.log('[FRONTEND] GetAllTransaksi response:', data);
            console.log(`[FRONTEND] Received ${data ? data.length : 0} transactions`);
            setTransactions(data || []);
        } catch (error) {
            console.error('[FRONTEND] Error loading transactions:', error);
            addToast('Gagal memuat data transaksi: ' + error.message, 'error');
        } finally {
            setLoading(false);
            console.log('[FRONTEND] Loading transactions completed');
        }
    };

    const loadTransactionDetail = async (id) => {
        console.log(`[FRONTEND] Loading transaction detail for ID: ${id}`);
        try {
            console.log(`[FRONTEND] Calling GetTransaksiByID with id=${id}`);
            const detail = await transaksiAPI.getByID(id);
            console.log('[FRONTEND] GetTransaksiByID response:', detail);

            if (!detail) {
                console.error('[FRONTEND] Transaction detail is null or undefined');
                addToast('Data transaksi tidak ditemukan', 'error');
                return;
            }

            // Check if transaction has items
            if (!detail.items || detail.items.length === 0) {
                console.warn(`[FRONTEND] Transaction ${detail.transaksi?.nomorTransaksi} has 0 items - this might be corrupted data`);
                // Still show the modal but with a warning
            }

            console.log(`[FRONTEND] Transaction loaded: ${detail.transaksi?.nomorTransaksi}, items: ${detail.items?.length || 0}`);
            setSelectedTransaction(detail);
            setShowDetailModal(true);
        } catch (error) {
            console.error('[FRONTEND] Error loading transaction detail:', error);
            console.error('[FRONTEND] Error stack:', error.stack);
            addToast('Gagal memuat detail transaksi: ' + (error.message || error), 'error');
        }
    };

    const filterTransactions = () => {
        let filtered = [...transactions];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.nomorTransaksi.toLowerCase().includes(term) ||
                t.pelangganNama.toLowerCase().includes(term) ||
                t.kasir.toLowerCase().includes(term)
            );
        }

        // Date filter
        if (dateFilter.startDate) {
            filtered = filtered.filter(t => {
                const transDate = new Date(t.tanggal).toISOString().split('T')[0];
                return transDate >= dateFilter.startDate;
            });
        }

        if (dateFilter.endDate) {
            filtered = filtered.filter(t => {
                const transDate = new Date(t.tanggal).toISOString().split('T')[0];
                return transDate <= dateFilter.endDate;
            });
        }

        setFilteredTransactions(filtered);
    };

    const applyDateRangeFilter = async () => {
        if (!dateFilter.startDate || !dateFilter.endDate) {
            addToast('Pilih tanggal awal dan akhir', 'warning');
            return;
        }

        setLoading(true);
        try {
            const data = await transaksiAPI.getByDateRange(dateFilter.startDate, dateFilter.endDate);
            setTransactions(data || []);
            addToast('Filter tanggal diterapkan', 'success');
        } catch (error) {
            addToast('Gagal memuat transaksi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setDateFilter({ startDate: '', endDate: '' });
        loadTransactions();
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatShortDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateForReceipt = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openPrintPreview = async (transactionId) => {
        console.log(`[FRONTEND] Opening print preview for transaction ID: ${transactionId}`);
        try {
            console.log(`[FRONTEND] Calling GetTransaksiByID for print preview with id=${transactionId}`);
            const detail = await transaksiAPI.getByID(transactionId);
            console.log('[FRONTEND] GetTransaksiByID (print preview) response:', detail);

            if (!detail) {
                console.error('[FRONTEND] Transaction detail for print is null or undefined');
                addToast('Data transaksi tidak ditemukan', 'error');
                return;
            }

            console.log(`[FRONTEND] Print preview transaction loaded: ${detail.transaksi?.nomorTransaksi}`);
            setTransactionToPrint(detail);
            setShowPrintPreviewModal(true);
        } catch (error) {
            console.error('[FRONTEND] Error loading print preview:', error);
            console.error('[FRONTEND] Error stack:', error.stack);
            addToast('Gagal memuat data struk: ' + (error.message || error), 'error');
        }
    };

    const handlePrint = async () => {
        if (transactionToPrint) {
            try {
                await printerAPI.printReceipt({
                    transactionNo: transactionToPrint.transaksi.nomorTransaksi,
                    printerName: '',
                });

                setShowPrintPreviewModal(false);
                addToast('Struk berhasil dicetak!', 'success');
            } catch (error) {
                console.error('Error printing receipt:', error);
                addToast(`Gagal mencetak struk: ${error.message || error}`, 'error');
                fallbackBrowserPrint(transactionToPrint);
            }
        }
    };

    // Fallback print browser dengan format struk yang rapi
    const fallbackBrowserPrint = (transaction) => {
        const printWindow = window.open('', '_blank', 'height=600,width=350');

        const receiptContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk - ${transaction.transaksi.nomorTransaksi}</title>
                <style>
                    @media print {
                        body { 
                            margin: 0;
                            padding: 0;
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            width: 58mm;
                        }
                        .no-print { display: none !important; }
                        .button-container { display: none !important; }
                    }
                    
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        margin: 0;
                        padding: 10px;
                        width: 58mm;
                        line-height: 1.2;
                    }
                    .container {
                        width: 100%;
                        max-width: 58mm;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 8px;
                    }
                    .company-name {
                        font-weight: bold;
                        font-size: 14px;
                        margin-bottom: 2px;
                    }
                    .company-address {
                        font-size: 10px;
                        margin-bottom: 2px;
                    }
                    .company-phone {
                        font-size: 10px;
                        margin-bottom: 5px;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 5px 0;
                        text-align: center;
                    }
                    .double-divider {
                        border-top: 2px solid #000;
                        margin: 5px 0;
                    }
                    .transaction-info {
                        margin-bottom: 8px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 1px;
                    }
                    .info-label {
                        font-weight: bold;
                    }
                    .items {
                        margin: 8px 0;
                    }
                    .item-row {
                        margin-bottom: 3px;
                    }
                    .item-name {
                        font-weight: bold;
                        margin-bottom: 1px;
                    }
                    .item-detail {
                        display: flex;
                        justify-content: space-between;
                    }
                    .totals {
                        margin: 8px 0;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 2px;
                    }
                    .total-main {
                        font-weight: bold;
                        border-top: 1px dashed #000;
                        padding-top: 3px;
                        margin-top: 3px;
                    }
                    .payment-method {
                        margin: 8px 0;
                        text-align: center;
                    }
                    .payment-title {
                        font-weight: bold;
                        margin-bottom: 3px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 10px;
                        font-size: 10px;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .text-bold {
                        font-weight: bold;
                    }
                    .button {
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 5px;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    .button-container {
                        text-align: center;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- Header -->
                    <div class="header">
                        <div class="company-name">TOKO RITEL</div>
                        <div class="company-address">Jl. Contoh No. 123</div>
                        <div class="company-phone">0812-3456-7890</div>
                    </div>
                    
                    <div class="double-divider"></div>
                    
                    <!-- Transaction Info -->
                    <div class="transaction-info">
                        <div class="info-row">
                            <span class="info-label">No</span>
                            <span>: ${transaction.transaksi.nomorTransaksi}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Tgl</span>
                            <span>: ${formatDateForReceipt(transaction.transaksi.tanggal)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Kasir</span>
                            <span>: ${transaction.transaksi.kasir}</span>
                        </div>
                        ${transaction.transaksi.pelangganNama ? `
                        <div class="info-row">
                            <span class="info-label">Pelanggan</span>
                            <span>: ${transaction.transaksi.pelangganNama}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="divider"></div>
                    
                    <!-- Items -->
                    <div class="items">
                        ${transaction.items.map(item => `
                            <div class="item-row">
                                <div class="item-name">${item.produkNama}</div>
                                <div class="item-detail">
                                    <span>${item.jumlah} x ${formatRupiah(item.hargaSatuan).replace('Rp', 'Rp ')}</span>
                                    <span>${formatRupiah(item.subtotal).replace('Rp', 'Rp ')}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="divider"></div>
                    
                    <!-- Totals -->
                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${formatRupiah(transaction.transaksi.subtotal).replace('Rp', 'Rp ')}</span>
                        </div>
                        ${transaction.transaksi.diskon > 0 ? `
                        <div class="total-row">
                            <span>Diskon:</span>
                            <span>-${formatRupiah(transaction.transaksi.diskon).replace('Rp', 'Rp ')}</span>
                        </div>
                        ` : ''}
                        <div class="total-row total-main">
                            <span>TOTAL:</span>
                            <span>${formatRupiah(transaction.transaksi.total).replace('Rp', 'Rp ')}</span>
                        </div>
                        <div class="total-row">
                            <span>Bayar:</span>
                            <span>${formatRupiah(transaction.transaksi.totalBayar).replace('Rp', 'Rp ')}</span>
                        </div>
                        <div class="total-row">
                            <span>Kembalian:</span>
                            <span>${formatRupiah(transaction.transaksi.kembalian).replace('Rp', 'Rp ')}</span>
                        </div>
                    </div>
                    
                    <!-- Payment Methods -->
                    ${transaction.pembayaran && transaction.pembayaran.length > 0 ? `
                    <div class="payment-method">
                        <div class="double-divider"></div>
                        <div class="payment-title">METODE PEMBAYARAN</div>
                        ${transaction.pembayaran.map(payment => `
                            <div class="total-row">
                                <span>${payment.metode}:</span>
                                <span>${formatRupiah(payment.jumlah).replace('Rp', 'Rp ')}</span>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    <div class="double-divider"></div>
                    
                    <!-- Footer -->
                    <div class="footer">
                        <div>Terima kasih atas kunjungan Anda!</div>
                        <div>Barang yang sudah dibeli tidak dapat ditukar</div>
                    </div>
                </div>
                
                <div class="button-container no-print">
                    <button class="button" onclick="window.print()">Cetak Struk</button>
                    <button class="button" onclick="window.close()">Tutup</button>
                </div>
                
                <script>
                    // Auto print when opened
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(receiptContent);
        printWindow.document.close();
    };

    // Fungsi untuk langsung mencetak tanpa preview (dari modal detail)
    const printReceipt = async (transaction) => {
        try {
            // Print ke printer fisik
            await printerAPI.printReceipt({
                transactionNo: transaction.transaksi.nomorTransaksi,
                printerName: '', // akan menggunakan default printer dari settings
            });

            addToast('Struk berhasil dicetak!', 'success');
        } catch (error) {
            console.error('Error printing receipt:', error);
            addToast(`Gagal mencetak struk: ${error.message || error}`, 'error');

            // Fallback ke print browser
            fallbackBrowserPrint(transaction);
        }
    };

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    // Calculate pagination
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
        totalTransactions: filteredTransactions.length,
        totalRevenue: filteredTransactions.reduce((sum, t) => sum + t.total, 0),
        totalDiscount: filteredTransactions.reduce((sum, t) => sum + t.diskon, 0)
    };

    // Handler untuk perubahan tanggal
    const handleDateChange = (field, value) => {
        setDateFilter(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="min-h-screen bg-green-50 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                                <FontAwesomeIcon icon={faHistory} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">History Transaksi</h2>
                                <p className="text-gray-600 mt-1">Riwayat semua transaksi penjualan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Transaksi</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FontAwesomeIcon icon={faShoppingCart} className="text-blue-600 text-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Pendapatan</p>
                                <p className="text-2xl font-bold text-green-600">{formatRupiah(stats.totalRevenue)}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <FontAwesomeIcon icon={faMoneyBill} className="text-green-600 text-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Diskon</p>
                                <p className="text-2xl font-bold text-red-600">{formatRupiah(stats.totalDiscount)}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <FontAwesomeIcon icon={faTags} className="text-red-600 text-xl" />
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                <FontAwesomeIcon icon={faList} className="h-5 w-5 text-green-700" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Daftar Transaksi</h3>
                        </div>
                        <div className="text-green-700 text-sm bg-green-100 px-3 py-1 rounded-full font-medium">
                            Total: {filteredTransactions.length} transaksi
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari no. transaksi, pelanggan, kasir..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <CustomDatePicker
                                    name="startDate"
                                    value={dateFilter.startDate}
                                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                                    placeholder="Tanggal Mulai"
                                    label=""
                                    size="md"
                                />
                                <CustomDatePicker
                                    name="endDate"
                                    value={dateFilter.endDate}
                                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                                    placeholder="Tanggal Akhir"
                                    label=""
                                    size="md"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-4">
                            <button
                                onClick={applyDateRangeFilter}
                                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-green-800"
                            >
                                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                                <span>Filter Tanggal</span>
                            </button>
                            <button
                                onClick={clearFilters}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-gray-600"
                            >
                                <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                <span>Reset Filter</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Content */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Memuat data transaksi...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <FontAwesomeIcon icon={faHistory} className="text-gray-300 text-6xl mb-4" />
                            <p className="text-gray-600 font-medium text-lg mb-2">Belum ada transaksi</p>
                            <p className="text-gray-500">Tidak ada transaksi yang ditemukan</p>
                        </div>
                    ) : (
                        <div className="overflow-x-hidden">
                            <table className="w-full min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            No. Transaksi
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            Tanggal
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            Pelanggan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            Kasir
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedTransactions.map((transaction, index) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {startIndex + index + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {transaction.nomorTransaksi}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {formatShortDate(transaction.tanggal)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(transaction.tanggal).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-900">
                                                    <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400 text-xs" />
                                                    {transaction.pelangganNama || 'Umum'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-green-600">
                                                    {formatRupiah(transaction.total)}
                                                </div>
                                                {transaction.diskon > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        Diskon: {formatRupiah(transaction.diskon)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'selesai'
                                                    ? 'bg-green-100 text-green-800'
                                                    : transaction.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {transaction.kasir}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <button
                                                        onClick={() => loadTransactionDetail(transaction.id)}
                                                        className="group relative p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                        title="Lihat Detail"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="text-sm" />
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            Detail
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => openPrintPreview(transaction.id)}
                                                        className="group relative p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                                                        title="Preview & Cetak Struk"
                                                    >
                                                        <FontAwesomeIcon icon={faPrint} className="text-sm" />
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            Cetak
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Component */}
                    {!loading && filteredTransactions.length > 0 && (
                        <div className="mt-4">
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
            </div>

            {/* Modal Detail Transaksi */}
            {showDetailModal && selectedTransaction && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    {/* Background Overlay - TRANSPARAN */}
                    <div
                        className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowDetailModal(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-green-700 p-6 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faEye} className="text-lg text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Detail Transaksi</h3>
                                    <p className="text-green-100 text-sm mt-1">
                                        {selectedTransaction.transaksi.nomorTransaksi}
                                    </p>
                                </div>
                            </div>
                            {/* Tombol Close */}
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {/* Transaction Info */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center mb-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 border border-blue-200">
                                        <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5 text-blue-700" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-800">Informasi Transaksi</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">No. Transaksi</label>
                                        <p className="text-gray-900 font-medium">{selectedTransaction.transaksi.nomorTransaksi}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">Tanggal</label>
                                        <p className="text-gray-900 font-medium">{formatDate(selectedTransaction.transaksi.tanggal)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">Kasir</label>
                                        <p className="text-gray-900 font-medium">{selectedTransaction.transaksi.kasir}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 block mb-1">Pelanggan</label>
                                        <p className="text-gray-900 font-medium">{selectedTransaction.transaksi.pelangganNama || 'Umum'}</p>
                                        {selectedTransaction.transaksi.pelangganTelp && (
                                            <p className="text-sm text-gray-500">{selectedTransaction.transaksi.pelangganTelp}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center mb-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 border border-purple-200">
                                        <FontAwesomeIcon icon={faBox} className="h-5 w-5 text-purple-700" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-800">Item Produk</h4>
                                </div>
                                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedTransaction.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-800">{item.produkNama}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        SKU: {item.produkSku} | {item.produkKategori || '-'}
                                                        {!item.produkId && <span className="ml-2 text-orange-500">(Produk sudah dihapus)</span>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-600">
                                                        {item.jumlah} x {formatRupiah(item.hargaSatuan)}
                                                    </div>
                                                    <div className="font-semibold text-green-600">{formatRupiah(item.subtotal)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-yellow-800 text-sm">⚠️ Transaksi ini tidak memiliki item produk. Data mungkin korup atau terhapus.</p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Methods */}
                            {selectedTransaction.pembayaran && selectedTransaction.pembayaran.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                            <FontAwesomeIcon icon={faMoneyBill} className="h-5 w-5 text-green-700" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-800">Metode Pembayaran</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedTransaction.pembayaran.map((payment, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                                <div>
                                                    <div className="font-medium text-gray-800 capitalize">{payment.metode}</div>
                                                    {payment.referensi && (
                                                        <div className="text-xs text-gray-500">Ref: {payment.referensi}</div>
                                                    )}
                                                </div>
                                                <div className="font-semibold text-blue-600">{formatRupiah(payment.jumlah)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Totals */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center mb-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 border border-orange-200">
                                        <FontAwesomeIcon icon={faReceipt} className="h-5 w-5 text-orange-700" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-800">Rincian Pembayaran</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-semibold">{formatRupiah(selectedTransaction.transaksi.subtotal)}</span>
                                    </div>
                                    {selectedTransaction.transaksi.diskon > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Diskon</span>
                                            <span className="font-semibold">-{formatRupiah(selectedTransaction.transaksi.diskon)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
                                        <span>Total</span>
                                        <span className="text-green-600">{formatRupiah(selectedTransaction.transaksi.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total Bayar</span>
                                        <span className="font-semibold">{formatRupiah(selectedTransaction.transaksi.totalBayar)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 font-semibold">
                                        <span>Kembalian</span>
                                        <span>{formatRupiah(selectedTransaction.transaksi.kembalian)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3 justify-end">
                            <button
                                onClick={() => openPrintPreview(selectedTransaction.transaksi.id)}
                                className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow hover:shadow-lg flex items-center space-x-2 border border-green-800"
                            >
                                <FontAwesomeIcon icon={faPrint} />
                                <span>Preview & Cetak Struk</span>
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow hover:shadow-lg flex items-center space-x-2 border border-gray-600"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                                <span>Tutup</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Preview Struk */}
            {showPrintPreviewModal && transactionToPrint && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    {/* Background Overlay - TRANSPARAN */}
                    <div
                        className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                        onClick={() => setShowPrintPreviewModal(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-green-700 p-6 text-white relative">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faPrint} className="text-lg text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Preview Struk</h3>
                                    <p className="text-green-100 text-sm mt-1">
                                        {transactionToPrint.transaksi.nomorTransaksi}
                                    </p>
                                </div>
                            </div>
                            {/* Tombol Close */}
                            <button
                                onClick={() => setShowPrintPreviewModal(false)}
                                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-300"
                                title="Tutup"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-sm" />
                            </button>
                        </div>

                        {/* Receipt Preview Content */}
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            <div className="bg-white p-4 rounded-lg border border-gray-300 font-mono text-xs max-w-xs mx-auto">
                                {/* Header */}
                                <div className="text-center mb-3">
                                    <div className="font-bold text-sm">TOKO RITEL</div>
                                    <div className="text-xs">Jl. Contoh No. 123</div>
                                    <div className="text-xs">0812-3456-7890</div>
                                </div>

                                <div className="border-t-2 border-black my-2"></div>

                                {/* Transaction Info */}
                                <div className="space-y-1 mb-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">No</span>
                                        <span>: {transactionToPrint.transaksi.nomorTransaksi}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Tgl</span>
                                        <span>: {formatDateForReceipt(transactionToPrint.transaksi.tanggal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Kasir</span>
                                        <span>: {transactionToPrint.transaksi.kasir}</span>
                                    </div>
                                    {transactionToPrint.transaksi.pelangganNama && (
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Pelanggan</span>
                                            <span>: {transactionToPrint.transaksi.pelangganNama}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-dashed border-gray-400 my-2"></div>

                                {/* Items */}
                                <div className="space-y-2 mb-3">
                                    {transactionToPrint.items && transactionToPrint.items.length > 0 ? (
                                        transactionToPrint.items.map((item, index) => (
                                            <div key={index}>
                                                <div className="font-semibold">{item.produkNama}</div>
                                                <div className="flex justify-between text-gray-600">
                                                    <span>{item.jumlah} x {formatRupiah(item.hargaSatuan).replace('Rp', 'Rp ')}</span>
                                                    <span className="font-semibold">{formatRupiah(item.subtotal).replace('Rp', 'Rp ')}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 text-xs">
                                            Tidak ada item produk
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-dashed border-gray-400 my-2"></div>

                                {/* Totals */}
                                <div className="space-y-1 mb-3">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatRupiah(transactionToPrint.transaksi.subtotal).replace('Rp', 'Rp ')}</span>
                                    </div>
                                    {transactionToPrint.transaksi.diskon > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Diskon:</span>
                                            <span>-{formatRupiah(transactionToPrint.transaksi.diskon).replace('Rp', 'Rp ')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold border-t border-dashed border-gray-400 pt-1">
                                        <span>TOTAL:</span>
                                        <span>{formatRupiah(transactionToPrint.transaksi.total).replace('Rp', 'Rp ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bayar:</span>
                                        <span>{formatRupiah(transactionToPrint.transaksi.totalBayar).replace('Rp', 'Rp ')}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-green-600">
                                        <span>Kembalian:</span>
                                        <span>{formatRupiah(transactionToPrint.transaksi.kembalian).replace('Rp', 'Rp ')}</span>
                                    </div>
                                </div>

                                {/* Payment Methods */}
                                {transactionToPrint.pembayaran && transactionToPrint.pembayaran.length > 0 && (
                                    <>
                                        <div className="border-t-2 border-black my-2"></div>
                                        <div className="text-center font-bold mb-2">METODE PEMBAYARAN</div>
                                        {transactionToPrint.pembayaran.map((payment, index) => (
                                            <div key={index} className="flex justify-between">
                                                <span className="capitalize">{payment.metode}:</span>
                                                <span>{formatRupiah(payment.jumlah).replace('Rp', 'Rp ')}</span>
                                            </div>
                                        ))}
                                    </>
                                )}

                                <div className="border-t-2 border-black my-2"></div>

                                {/* Footer */}
                                <div className="text-center text-xs">
                                    <div>Terima kasih atas kunjungan Anda!</div>
                                    <div>Barang yang sudah dibeli tidak dapat ditukar</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-3">
                            <button
                                onClick={handlePrint}
                                className="w-full px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition-all duration-300 shadow hover:shadow-lg flex items-center justify-center space-x-2 border border-green-800"
                            >
                                <FontAwesomeIcon icon={faPrint} />
                                <span>Cetak Struk</span>
                            </button>
                            <button
                                onClick={() => setShowPrintPreviewModal(false)}
                                className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-300 shadow hover:shadow-lg border border-gray-600"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}