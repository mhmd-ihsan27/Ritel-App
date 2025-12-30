import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMoneyBillWave,
    faReceipt,
    faShoppingBasket,
    faChartLine,
    faArrowUp,
    faArrowDown,
    faEye,
    faBell,
    faGem,
    faShieldAlt,
    faChartBar,
    faExclamationTriangle,
    faBoxOpen,
    faClock,
    faPlus,
    faUndo,
    faTags,
    faUsers,
    faTrophy,
    faStar,
    faFire,
    faSync,
    faPercent,
    faChartPie,
    faCalendarAlt,
    faFilter
} from '@fortawesome/free-solid-svg-icons';
import { salesReportAPI } from '../../../api';

// Impor komponen dari react-chartjs-2
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Import Wails API
// Impor CustomSelect untuk filter
import CustomSelect from '../../common/CustomSelect';

// Daftarkan komponen Chart.js yang akan digunakan
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

/**
 * Komponen LaporanPenjualan
 * Menampilkan dashboard analitik penjualan yang komprehensif dengan desain modern.
 *
 * @param {object} props - Properti komponen.
 * @param {function(number): string} props.formatRupiah - Fungsi untuk memformat angka menjadi mata uang Rupiah.
 * @param {string} props.userName - Nama pengguna yang sedang login.
 */
const LaporanPenjualan = ({ formatRupiah, userName = "Admin" }) => {
    // --- State Management ---
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [greeting, setGreeting] = useState('');

    // State untuk filter pada setiap grafik
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    const [salesTrendFilter, setSalesTrendFilter] = useState('bulan'); // Filter untuk Tren Penjualan
    const [discountTrendFilter, setDiscountTrendFilter] = useState('bulan'); // Filter untuk Tren Penjualan Diskon
    const [transaksiDateFilter, setTransaksiDateFilter] = useState('bulan');

    // State for API data
    const [reportData, setReportData] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [monthlySalesData, setMonthlySalesData] = useState(null);
    const [compositionData, setCompositionData] = useState(null);
    const [lossAnalysisData, setLossAnalysisData] = useState(null);
    const [discountTypeData, setDiscountTypeData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [detailReportData, setDetailReportData] = useState([]);

    // --- Effects ---
    // Effect untuk memperbarui waktu dan sapaan setiap detik
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            const hour = now.getHours();
            if (hour >= 5 && hour < 12) {
                setGreeting('Selamat Pagi');
            } else if (hour >= 12 && hour < 15) {
                setGreeting('Selamat Siang');
            } else if (hour >= 15 && hour < 19) {
                setGreeting('Selamat Sore');
            } else {
                setGreeting('Selamat Malam');
            }
        }, 1000);

        return () => clearInterval(timer); // Cleanup timer
    }, []);

    // Effect untuk mencegah scroll saat loading
    useEffect(() => {
        if (isLoading) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isLoading]);

    // Effect untuk memuat data laporan saat komponen mount atau filter berubah
    useEffect(() => {
        loadSalesReport();
    }, [yearFilter]); // Hanya bergantung pada yearFilter

    // --- Data Fetching and Transformation ---
    /**
     * Memuat data laporan penjualan dari API.
     * Dibungkus dalam useCallback untuk mencegah re-creation pada setiap render.
     */
    const loadSalesReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentYear = new Date().getFullYear();

            let startDate, endDate;
            startDate = `${yearFilter}-01-01`;
            endDate = `${yearFilter}-12-31`;

            const data = await salesReportAPI.getComprehensive(startDate, endDate);

            setReportData(data);

            // Transform API data to UI format
            transformDataForUI(data);
        } catch (error) {
            console.error('Error loading sales report:', error);
            // TODO: Tampilkan notifikasi error ke user
        } finally {
            setIsLoading(false);
        }
    }, [yearFilter]); // Hanya bergantung pada yearFilter

    /**
     * Mengubah data dari format API menjadi format yang siap digunakan oleh UI.
     */
    const transformDataForUI = (data) => {
        if (!data) {
            return;
        }

        // Transform summary data
        const totalOmset = data.summary?.totalOmset || 0;
        const totalProfit = data.summary?.totalProfit || 0;
        const totalLoss = data.lossAnalysis?.totalLoss || 0;
        const totalDiskon = data.discountAnalysis?.totalDiskon || 0;

        setSummaryData({
            totalOmset: totalOmset,
            estimatedProfit: totalProfit,
            avgTransaction: data.summary?.rataRataTransaksi || 0,
            totalTransactions: data.summary?.totalTransaksi || 0,
            totalProducts: data.summary?.totalProdukTerjual || 0,
            margin: totalOmset > 0 ? ((totalProfit / totalOmset) * 100).toFixed(1) : 0,
            discountSales: totalDiskon,
            discountPercent: data.discountAnalysis?.persentaseTransaksi ? data.discountAnalysis.persentaseTransaksi.toFixed(1) : 0,
            lossImpact: totalLoss,
            lossPercent: totalOmset > 0 ? ((totalLoss / totalOmset) * 100).toFixed(1) : 0
        });

        // Transform payment method composition
        if (data.paymentMethodBreakdown && data.paymentMethodBreakdown.length > 0) {
            const methodMap = {
                'tunai': 'Tunai',
                'qris': 'QRIS',
                'debit': 'Debit',
                'kredit': 'Kredit',
                'transfer': 'Transfer'
            };
            const labels = data.paymentMethodBreakdown.map(p => methodMap[p.method] || p.method);
            const dataValues = data.paymentMethodBreakdown.map(p => p.persentase);
            const colors = ['#15803d', '#22c55e', '#86efac', '#dcfce7', '#f0fdf4'];

            setCompositionData({
                labels,
                data: dataValues,
                colors: colors.slice(0, labels.length)
            });
        }

        // Transform loss analysis data
        if (data.lossAnalysis) {
            setLossAnalysisData({
                labels: data.lossAnalysis.labels || [],
                data: data.lossAnalysis.data || [],
                total: data.lossAnalysis.totalLoss || 0,
                colors: data.lossAnalysis.colors || []
            });
        }

        // Transform discount type breakdown
        if (data.discountTypeBreakdown && data.discountTypeBreakdown.length > 0) {
            const discountTypes = data.discountTypeBreakdown.map(d => ({
                type: d.type === 'promo' ? 'Diskon Promo' : 'Diskon Manual',
                amount: d.totalDiskon,
                transactions: d.jumlah
            }));
            setDiscountTypeData(discountTypes);
        }

        // Transform top products
        if (data.topProducts && data.topProducts.length > 0) {
            const products = data.topProducts.map(p => ({
                rank: p.rank,
                name: p.namaProduk,
                category: p.kategori,
                units: p.totalTerjual,
                revenue: p.totalOmset,
                discountTransactions: p.jumlahTransaksiDiskon || 0 // Asumsi ada field ini
            }));
            setTopProducts(products);
        }

        // Generate detail report data from monthly sales (or use an API for this if needed)
        if (data.monthlySales && data.monthlySales.length > 0) {
            const detailData = data.monthlySales.map((m) => {
                // Estimate products sold based on average items per transaction
                const avgItemsPerTrx = data.summary?.totalProdukTerjual && data.summary?.totalTransaksi
                    ? data.summary.totalProdukTerjual / data.summary.totalTransaksi
                    : 0;
                const estimatedProducts = Math.floor(m.transaksi * avgItemsPerTrx);

                // Calculate net profit: omset - HPP - discount - loss
                const netProfit = (m.omset || 0) - (m.hpp || 0) - (m.diskon || 0) - (m.loss || 0);

                return {
                    month: m.month,
                    transactions: m.transaksi,
                    products: estimatedProducts,
                    sales: m.omset,
                    discount: m.diskon || 0,  // Gunakan data aktual dari backend
                    loss: m.loss || 0,        // Gunakan data aktual dari backend
                    profit: m.profit || 0,    // Gunakan data aktual dari backend
                    hpp: m.hpp || 0,
                    netProfit: netProfit
                };
            });
            setDetailReportData(detailData);
        }
    };

    // Memoized sales trend data
    const memoizedSalesTrendData = useMemo(() => {
        if (!reportData?.salesTrendData) return null;
        return reportData.salesTrendData[salesTrendFilter];
    }, [reportData?.salesTrendData, salesTrendFilter]);

    // Memoized discount trend data
    const memoizedDiscountTrendData = useMemo(() => {
        if (!reportData?.discountTrendData) return null;
        return reportData.discountTrendData[discountTrendFilter];
    }, [reportData?.discountTrendData, discountTrendFilter]);

    // PERBAIKAN: Memoized transaction data dengan filter yang benar
    const memoizedTransactionData = useMemo(() => {
        if (!reportData?.hourlySalesTrendData) return null;

        const trendData = reportData.hourlySalesTrendData[transaksiDateFilter];
        if (!trendData || !trendData.labels || !trendData.data) return null;

        // PERBAIKAN: Format label sesuai dengan permintaan
        let labels = [...trendData.labels];

        // Untuk filter minggu, format label menjadi nama hari
        if (transaksiDateFilter === 'minggu') {
            const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            labels = trendData.labels.map((label, index) => {
                // Jika label adalah format tanggal, konversi ke nama hari
                if (label.includes('-')) {
                    const date = new Date(label);
                    return dayNames[date.getDay()];
                }
                return label;
            });
        }

        // Untuk filter bulan, format label menjadi tanggal
        if (transaksiDateFilter === 'bulan') {
            labels = trendData.labels.map((label, index) => {
                // Jika label adalah format tanggal, konversi ke format DD/MM
                if (label.includes('-')) {
                    const date = new Date(label);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                }
                return label;
            });
        }

        // Untuk filter hari, label sudah dalam format jam yang benar

        return {
            labels,
            revenue: trendData.data,
            // PERBAIKAN: Hitung transaksi dari data yang tersedia
            transactions: trendData.data.map(value => {
                // Estimasi jumlah transaksi berdasarkan rata-rata transaksi
                const avgTransaction = summaryData?.avgTransaction || 0;
                return avgTransaction > 0 ? Math.round(value / avgTransaction) : 0;
            })
        };
    }, [reportData?.hourlySalesTrendData, transaksiDateFilter, summaryData?.avgTransaction]);

    // --- Helper Functions ---
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb';
        return num.toString();
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadSalesReport().finally(() => setIsRefreshing(false));
    };

    // --- Subcomponents ---
    /**
     * Komponen Kartu Statistik untuk menampilkan metrik kunci.
     */
    const StatCard = ({ title, value, trend, icon, isCurrency = false, badge, color = 'green' }) => (
        <div className="bg-white rounded-xl shadow-md p-4 card-hover border border-gray-200">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <div className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center mr-2 border border-${color}-200`}>
                        <FontAwesomeIcon icon={icon} className={`h-5 w-5 text-${color}-700`} />
                    </div>
                    <div>
                        <h3 className="text-gray-600 text-xs font-medium">{title}</h3>
                        <p className="text-lg font-bold text-gray-800 mt-1">{isCurrency ? formatRupiah(value) : formatNumber(value)}</p>
                    </div>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-300">{badge}</span>
            </div>
            {trend !== undefined && (
                <div className="flex items-center mt-1">
                    <FontAwesomeIcon
                        icon={trend > 0 ? faArrowUp : faArrowDown}
                        className={`h-3 w-3 mr-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
                    />
                    <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(trend)}% dari bulan lalu
                    </span>
                </div>
            )}
        </div>
    );

    /**
     * Komponen Item Produk Terlaris.
     */
    const TopProductItem = ({ product }) => {
        const getRankIcon = (rank) => {
            if (rank === 1) return { icon: faStar, color: 'yellow' }; // PERBAIKAN: Mengganti faTrophy dengan faStar
            if (rank === 2) return { icon: faStar, color: 'gray' };
            if (rank === 3) return { icon: faStar, color: 'orange' };
            return { icon: null, color: 'gray' };
        };

        const rankInfo = getRankIcon(product.rank);

        return (
            <div className="flex items-center p-2 border border-gray-200 rounded-lg card-hover hover:shadow-md transition-all duration-200 hover:border-green-300">
                <div className="shrink-0 mr-2">
                    {rankInfo.icon ? (
                        <div className={`w-8 h-8 bg-${rankInfo.color}-100 rounded-full flex items-center justify-center border border-${rankInfo.color}-200`}>
                            <FontAwesomeIcon icon={rankInfo.icon} className={`h-4 w-4 text-${rankInfo.color}-600`} />
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                            <span className="text-gray-600 font-bold text-xs">{product.rank}</span>
                        </div>
                    )}
                </div>
                <div className="grow">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-medium text-gray-800 text-xs">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.category}</p>
                            <p className="text-xs text-gray-500">{product.units} unit</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-green-700">{formatRupiah(product.revenue)}</p>
                            <p className="text-xs text-gray-500">{product.discountTransactions} diskon</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Komponen Kartu Diskon.
     */
    const DiscountCard = ({ type, amount, transactions }) => {
        const avgDiscount = transactions > 0 ? amount / transactions : 0;
        return (
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 card-hover">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">{type}</h3>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                        <FontAwesomeIcon icon={faPercent} className="h-4 w-4 text-green-700" />
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Total</span>
                        <span className="text-xs font-bold text-gray-800">{formatRupiah(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Transaksi</span>
                        <span className="text-xs font-bold text-gray-800">{transactions}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Rata-rata</span>
                        <span className="text-xs font-bold text-gray-800">{formatRupiah(avgDiscount)}</span>
                    </div>
                </div>
            </div>
        );
    };

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 md:p-8 overflow-x-hidden">
                <div className="animate-pulse space-y-6">
                    {/* Skeleton untuk header */}
                    <div className="h-20 bg-gray-300 rounded-xl w-1/3"></div>
                    {/* Skeleton untuk cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
                        ))}
                    </div>
                    {/* Skeleton untuk grafik */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-80 bg-gray-300 rounded-xl"></div>
                        <div className="h-80 bg-gray-300 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Main Render ---
    return (
        <div className="min-h-screen bg-green-50 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Laporan Penjualan */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                                <FontAwesomeIcon icon={faChartLine} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Laporan Penjualan</h2>
                                <p className="text-gray-600 mt-1">Analisis komprehensif performa penjualan</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-green-800"
                            disabled={isRefreshing || isLoading}
                        >
                            <FontAwesomeIcon icon={faSync} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Ringkasan Penjualan Detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Omset"
                        value={summaryData?.totalOmset || 0}
                        icon={faMoneyBillWave}
                        isCurrency={true}
                        badge={`${summaryData?.totalTransactions || 0} transaksi`}
                        color="green"
                    />
                    <StatCard
                        title="Estimasi Profit"
                        value={summaryData?.estimatedProfit || 0}
                        icon={faChartLine}
                        isCurrency={true}
                        badge={`${summaryData?.margin || 0}% margin`}
                        color="blue"
                    />
                    <StatCard
                        title="Rata-rata Transaksi"
                        value={summaryData?.avgTransaction || 0}
                        icon={faReceipt}
                        isCurrency={true}
                        color="purple"
                    />
                    <StatCard
                        title="Total Produk Terjual"
                        value={summaryData?.totalProducts || 0}
                        icon={faShoppingBasket}
                        badge="unit"
                        color="orange"
                    />
                    <StatCard
                        title="Penjualan dari Diskon"
                        value={summaryData?.discountSales || 0}
                        icon={faPercent}
                        isCurrency={true}
                        badge={`${summaryData?.discountPercent || 0}% dari total`}
                        color="indigo"
                    />
                    <StatCard
                        title="Dampak Kerugian"
                        value={summaryData?.lossImpact || 0}
                        icon={faExclamationTriangle}
                        isCurrency={true}
                        badge={`${summaryData?.lossPercent || 0}% dari omset`}
                        color="red"
                    />
                </div>

                {/* PERUBAHAN LAYOUT: Desain ulang bagian Chart & Grafik dengan kontainer modern */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tren Penjualan Bulanan dengan Desain Baru - Menggunakan desain dari grafik pendapatan */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 mr-2 text-green-700" />
                                Tren Penjualan
                            </h3>
                            <div className="w-48">
                                <CustomSelect
                                    name="salesTrendFilter"
                                    value={salesTrendFilter}
                                    onChange={(e) => setSalesTrendFilter(e.target.value)}
                                    options={[
                                        { value: 'hari', label: 'Hari Ini', icon: faCalendarAlt },
                                        { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarAlt },
                                        { value: 'bulan', label: '30 Hari Terakhir', icon: faCalendarAlt }
                                    ]}
                                    placeholder="Pilih periode"
                                    icon={faFilter}
                                    size="sm"
                                />
                            </div>
                        </div>
                        <div className="h-64">
                            {memoizedSalesTrendData ? (
                                <Line
                                    data={{
                                        labels: memoizedSalesTrendData.labels,
                                        datasets: [{
                                            label: 'Omset',
                                            data: memoizedSalesTrendData.data,
                                            borderColor: '#15803d',
                                            backgroundColor: 'rgba(21, 128, 61, 0.1)',
                                            borderWidth: 2,
                                            fill: true,
                                            tension: 0.4,
                                            pointRadius: 3,
                                            pointHoverRadius: 5,
                                            pointBackgroundColor: '#15803d'
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
                                                        const value = Math.round(context.parsed.y || 0);
                                                        const formattedValue = 'Rp' + value.toLocaleString('id-ID');
                                                        return `Omset: ${formattedValue}`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: false,
                                                ticks: {
                                                    callback: (value) => {
                                                        if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                                        return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : <div className="flex items-center justify-center h-full text-gray-400"><p>Tidak ada data</p></div>}
                        </div>
                    </div>

                    {/* Komposisi Penjualan dengan Desain Baru */}
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FontAwesomeIcon icon={faChartPie} className="h-5 w-5 mr-2 text-green-700" />
                            Komposisi Penjualan
                        </h3>
                        <div className="h-64">
                            {compositionData ? (
                                <Doughnut
                                    data={{
                                        labels: compositionData.labels,
                                        datasets: [{
                                            data: compositionData.data,
                                            backgroundColor: compositionData.colors,
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'bottom' },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => `${context.label}: ${context.parsed}%`
                                                }
                                            }
                                        },
                                        cutout: '70%'
                                    }}
                                />
                            ) : <div className="flex items-center justify-center h-full text-gray-400"><p>Tidak ada data</p></div>}
                        </div>
                    </div>
                </div>

                {/* PERUBAHAN LAYOUT: Layout baru untuk Grafik Transaksi dan Analisis Kerugian */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Grafik Transaksi */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <FontAwesomeIcon icon={faReceipt} className="h-5 w-5 mr-2 text-green-700" />
                                Grafik Transaksi
                            </h3>
                            <div className="w-48">
                                <CustomSelect
                                    name="transaksiDateFilter"
                                    value={transaksiDateFilter}
                                    onChange={(e) => setTransaksiDateFilter(e.target.value)}
                                    options={[
                                        { value: 'hari', label: 'Hari Ini', icon: faCalendarAlt },
                                        { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarAlt },
                                        { value: 'bulan', label: '30 Hari Terakhir', icon: faCalendarAlt }
                                    ]}
                                    placeholder="Pilih periode"
                                    icon={faFilter}
                                    size="sm"
                                />
                            </div>
                        </div>
                        <div className="h-64">
                            {memoizedTransactionData ? (
                                <Bar
                                    data={{
                                        labels: memoizedTransactionData.labels,
                                        datasets: [
                                            {
                                                label: 'Omset',
                                                data: memoizedTransactionData.revenue,
                                                backgroundColor: '#15803d',
                                                borderRadius: 4,
                                                yAxisID: 'y'
                                            },
                                            {
                                                label: 'Transaksi',
                                                data: memoizedTransactionData.transactions,
                                                backgroundColor: '#22c55e',
                                                borderRadius: 4,
                                                yAxisID: 'y1'
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                                labels: { boxWidth: 12, padding: 15, font: { size: 10 } }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
                                                        if (context.dataset.label === 'Omset') {
                                                            const value = Math.round(context.parsed.y || 0);
                                                            const formattedValue = 'Rp' + value.toLocaleString('id-ID');
                                                            return `Omset: ${formattedValue}`;
                                                        }
                                                        return `Transaksi: ${context.parsed.y} trx`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                                            y: {
                                                type: 'linear', display: true, position: 'left',
                                                ticks: {
                                                    callback: (value) => {
                                                        if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                                        return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                                    },
                                                    font: { size: 10 }
                                                }
                                            },
                                            y1: {
                                                type: 'linear', display: true, position: 'right',
                                                grid: { drawOnChartArea: false },
                                                ticks: { callback: (value) => value + ' trx', font: { size: 10 } }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <div className="text-center">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="h-8 w-8 mb-2 mx-auto" />
                                        <p>Tidak ada data untuk periode ini</p>
                                        <p className="text-xs mt-1">Coba refresh atau pilih periode lain</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Analisis Kerugian - Dipindahkan ke sini */}
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2 text-red-700" />
                            Analisis Kerugian
                        </h3>
                        <div className="h-64">
                            {lossAnalysisData ? (
                                <Doughnut
                                    data={{
                                        labels: lossAnalysisData.labels,
                                        datasets: [{
                                            data: lossAnalysisData.data,
                                            backgroundColor: lossAnalysisData.colors,
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
                                                        const value = Math.round(context.parsed || context.raw || 0);
                                                        const formattedValue = value.toLocaleString('id-ID') + '%';
                                                        return `${context.label}: ${formattedValue}`;
                                                    }
                                                }
                                            }
                                        },
                                        cutout: '70%'
                                    }}
                                />
                            ) : <div className="flex items-center justify-center h-full text-gray-400"><p>Tidak ada data</p></div>}
                        </div>
                        {lossAnalysisData && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-xs font-medium text-gray-800">Total Kerugian</p>
                                <p className="text-sm font-bold text-red-600">{formatRupiah(lossAnalysisData.total)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* PERUBAHAN LAYOUT: Layout baru untuk Tren Penjualan Diskon dan Diskon Manual */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tren Penjualan Diskon - Menggunakan desain dari grafik pendapatan */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <FontAwesomeIcon icon={faPercent} className="h-5 w-5 mr-2 text-green-700" />
                                Tren Penjualan Diskon
                            </h3>
                            <div className="w-48">
                                <CustomSelect
                                    name="discountTrendFilter"
                                    value={discountTrendFilter}
                                    onChange={(e) => setDiscountTrendFilter(e.target.value)}
                                    options={[
                                        { value: 'hari', label: 'Hari Ini', icon: faCalendarAlt },
                                        { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarAlt },
                                        { value: 'bulan', label: '30 Hari Terakhir', icon: faCalendarAlt }
                                    ]}
                                    placeholder="Pilih periode"
                                    icon={faFilter}
                                    size="sm"
                                />
                            </div>
                        </div>
                        <div className="h-64">
                            {memoizedDiscountTrendData ? (
                                <Line
                                    data={{
                                        labels: memoizedDiscountTrendData.labels,
                                        datasets: [
                                            {
                                                label: 'Penjualan dengan Diskon',
                                                data: memoizedDiscountTrendData.salesWithDiscount,
                                                borderColor: '#15803d',
                                                backgroundColor: 'rgba(21, 128, 61, 0.1)',
                                                borderWidth: 2,
                                                fill: true,
                                                tension: 0.4,
                                                pointRadius: 3,
                                                pointHoverRadius: 5,
                                                pointBackgroundColor: '#15803d'
                                            },
                                            {
                                                label: 'Total Nilai Diskon',
                                                data: memoizedDiscountTrendData.discountValue,
                                                borderColor: '#f97316',
                                                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                                borderWidth: 2,
                                                fill: true,
                                                tension: 0.4,
                                                pointRadius: 3,
                                                pointHoverRadius: 5,
                                                pointBackgroundColor: '#f97316'
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                                labels: { boxWidth: 12, padding: 15, font: { size: 10 } }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
                                                        const value = Math.round(context.parsed.y || 0);
                                                        const formattedValue = 'Rp' + value.toLocaleString('id-ID');
                                                        return `${context.dataset.label}: ${formattedValue}`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: false,
                                                ticks: {
                                                    callback: (value) => {
                                                        if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                                        return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                                    },
                                                    font: { size: 10 }
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : <div className="flex items-center justify-center h-full text-gray-400"><p>Tidak ada data</p></div>}
                        </div>
                    </div>

                    {/* Diskon Manual - Dipindahkan ke sini */}
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FontAwesomeIcon icon={faTags} className="h-5 w-5 mr-2 text-green-700" />
                            Diskon Manual
                        </h3>
                        <div className="h-64 flex items-center justify-center">
                            {discountTypeData.length > 0 ? (
                                <div className="w-full">
                                    {discountTypeData
                                        .filter(discount => discount.type === 'Diskon Manual')
                                        .map((discount, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-600">Total</span>
                                                    <span className="text-xs font-bold text-gray-800">{formatRupiah(discount.amount)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-600">Transaksi</span>
                                                    <span className="text-xs font-bold text-gray-800">{discount.transactions}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-600">Rata-rata</span>
                                                    <span className="text-xs font-bold text-gray-800">{formatRupiah(discount.amount / discount.transactions)}</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Tidak ada data</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Analisis Jenis Diskon (hanya menampilkan Diskon Promo) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {discountTypeData
                        .filter(discount => discount.type === 'Diskon Promo')
                        .map((discount, index) => (
                            <DiscountCard
                                key={index}
                                type={discount.type}
                                amount={discount.amount}
                                transactions={discount.transactions}
                            />
                        ))}
                </div>

                {/* Top 5 Produk Terlaris */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FontAwesomeIcon icon={faStar} className="h-5 w-5 mr-2 text-green-700" /> {/* PERBAIKAN: Mengganti faTrophy dengan faStar */}
                        Top 5 Produk Terlaris
                    </h3>
                    <div className="space-y-2">
                        {topProducts.length > 0 ? topProducts.map(product => (
                            <TopProductItem key={product.rank} product={product} />
                        )) : <p className="text-center text-gray-500 text-sm">Tidak ada data produk</p>}
                    </div>
                </div>

                {/* Tabel Laporan Detail */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 mr-2 text-green-700" />
                            Tabel Laporan Detail
                        </h3>
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            {(() => {
                                const currentYear = new Date().getFullYear();
                                const years = [];
                                for (let i = 0; i < 5; i++) {
                                    years.push(currentYear - i);
                                }
                                return years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ));
                            })()}
                        </select>
                    </div>
                    <div className="overflow-x-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penjualan</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diskon</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kerugian</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {detailReportData.map((row, index) => {
                                    const marginPercent = row.sales > 0 ? (row.profit / row.sales * 100).toFixed(1) : 0;
                                    const prevMarginPercent = index > 0 ? (detailReportData[index - 1].profit / detailReportData[index - 1].sales * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{row.month}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{row.products}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatRupiah(row.sales)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatRupiah(row.discount)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatRupiah(row.loss)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{formatRupiah(row.profit)}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                                <div className="flex items-center">
                                                    {marginPercent}%
                                                    {index > 0 && (
                                                        <FontAwesomeIcon
                                                            icon={marginPercent > prevMarginPercent ? faArrowUp : faArrowDown}
                                                            className={`h-3 w-3 ml-1 ${marginPercent > prevMarginPercent ? 'text-green-600' : 'text-red-600'}`}
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-green-50 font-bold">
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 flex items-center">
                                        <FontAwesomeIcon icon={faTrophy} className="h-3 w-3 text-yellow-500 mr-1" />
                                        Total
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{detailReportData.reduce((sum, row) => sum + row.products, 0)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{formatRupiah(detailReportData.reduce((sum, row) => sum + row.sales, 0))}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{formatRupiah(detailReportData.reduce((sum, row) => sum + row.discount, 0))}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{formatRupiah(detailReportData.reduce((sum, row) => sum + row.loss, 0))}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{formatRupiah(detailReportData.reduce((sum, row) => sum + row.profit, 0))}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                        {(detailReportData.reduce((sum, row) => sum + row.profit, 0) / detailReportData.reduce((sum, row) => sum + row.sales, 0) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

LaporanPenjualan.defaultProps = {
    formatRupiah: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },
    userName: "Admin"
};

export default LaporanPenjualan;