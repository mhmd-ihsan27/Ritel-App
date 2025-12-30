import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMoneyBillWave,
    faReceipt,
    faShoppingBasket,
    faChartLine,
    faArrowUp,
    faArrowDown,
    faBell,
    faChartBar,
    faExclamationTriangle,
    faBoxOpen,
    faClock,
    faPlus,
    faTags,
    faUsers,
    faUndo,
    faCalendarAlt,
    faFilter
} from '@fortawesome/free-solid-svg-icons';
import { dashboardAPI } from '../../../api';

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

// Import CustomSelect
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

// Mock data untuk fallback jika API belum siap
const mockDashboardData = {
    statistikBulanan: {
        totalPendapatan: 12500000,
        totalTransaksi: 45,
        produkTerjual: 320,
        keuntunganBersih: 4500000,
        vsBulanLalu: 12.5
    },
    notifikasi: [
        {
            id: 1,
            type: "low-stock",
            title: "Stok Menipis",
            message: "5 produk dengan stok kurang dari 10 item",
            priority: "high",
            time: "10:30"
        },
        {
            id: 2,
            type: "promo",
            title: "Promo Akan Berakhir",
            message: "2 promo akan berakhir dalam 2 hari",
            priority: "medium",
            time: "09:15"
        },
        {
            id: 3,
            type: "new-product",
            title: "Produk Baru Masuk",
            message: "3 produk baru telah ditambahkan ke inventory",
            priority: "low",
            time: "08:45"
        }
    ],
    performaHariIni: [
        {
            id: 1,
            title: "Omzet Hari Ini",
            value: 850000,
            trend: 15.2,
            icon: "faMoneyBillWave",
            color: "green"
        },
        {
            id: 2,
            title: "Transaksi Hari Ini",
            value: 8,
            trend: -5.3,
            icon: "faReceipt",
            color: "blue"
        },
        {
            id: 3,
            title: "Produk Terjual",
            value: 25,
            trend: 8.7,
            icon: "faShoppingBasket",
            color: "purple"
        },
        {
            id: 4,
            title: "Pelanggan Baru",
            value: 3,
            trend: 25.0,
            icon: "faUsers",
            color: "red"
        }
    ],
    produkTerlaris: [
        {
            id: 1,
            nama: "Bayam Segar",
            kategori: "Sayur",
            harga: 8000,
            terjual: 45,
            satuan: "ikat",
            color: "green"
        },
        {
            id: 2,
            nama: "Jeruk Medan",
            kategori: "Buah",
            harga: 15000,
            terjual: 38,
            satuan: "kg",
            color: "orange"
        },
        {
            id: 3,
            nama: "Bawang Merah",
            kategori: "Bumbu",
            harga: 12000,
            terjual: 32,
            satuan: "kg",
            color: "red"
        },
        {
            id: 4,
            nama: "Wortel Organik",
            kategori: "Organik",
            harga: 10000,
            terjual: 28,
            satuan: "kg",
            color: "yellow"
        },
        {
            id: 5,
            nama: "Kangkung Segar",
            kategori: "Sayur",
            harga: 6000,
            terjual: 25,
            satuan: "ikat",
            color: "green"
        }
    ],
    aktivitasTerakhir: [
        {
            id: 1,
            title: "Transaksi Baru",
            time: "10 menit yang lalu",
            icon: "faReceipt",
            color: "blue"
        },
        {
            id: 2,
            title: "Produk Masuk",
            time: "1 jam yang lalu",
            icon: "faBoxOpen",
            color: "green"
        },
        {
            id: 3,
            title: "Promo Dibuat",
            time: "2 jam yang lalu",
            icon: "faTags",
            color: "purple"
        },
        {
            id: 4,
            title: "Stok Menipis",
            time: "3 jam yang lalu",
            icon: "faExclamationTriangle",
            color: "yellow"
        },
        {
            id: 5,
            title: "Pelanggan Baru",
            time: "5 jam yang lalu",
            icon: "faUsers",
            color: "indigo"
        }
    ]
};

const mockSalesData = {
    salesData: {
        hari: {
            labels: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
            data: [0, 0, 150000, 450000, 650000, 850000, 720000, 350000]
        },
        minggu: {
            labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
            data: [1250000, 980000, 1560000, 1420000, 1890000, 2350000, 1850000]
        },
        bulan: {
            labels: ["1", "5", "10", "15", "20", "25", "30"],
            data: [4500000, 3200000, 5800000, 6200000, 7100000, 8900000, 12500000]
        }
    }
};

const Dashboard = ({ formatRupiah, userName = "Admin" }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const [error, setError] = useState(null);
    const [useMockData, setUseMockData] = useState(false);

    // State untuk filter pada setiap grafik
    const [salesFilter, setSalesFilter] = useState('minggu');
    const [compositionFilter, setCompositionFilter] = useState('minggu');
    const [categoryFilter, setCategoryFilter] = useState('minggu');

    // State untuk data dari API
    const [data, setData] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [compositionData, setCompositionData] = useState(null);
    const [categoryData, setCategoryData] = useState(null);

    // Helper function for dynamic category colors
    const getCategoryColor = (categoryName, index) => {
        const colors = ['#15803d', '#22c55e', '#86efac', '#a78bfa', '#f97316']; // Example palette
        if (categoryName === 'Lainnya') {
            return '#cbd5e1'; // Slate-300 for "Lainnya"
        }
        return colors[index % colors.length];
    };

    // Set greeting based on time
    useEffect(() => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) {
            setGreeting('Selamat Pagi');
        } else if (hour >= 12 && hour < 15) {
            setGreeting('Selamat Siang');
        } else if (hour >= 15 && hour < 19) {
            setGreeting('Selamat Sore');
        } else {
            setGreeting('Selamat Malam');
        }
    }, [currentTime]);

    // Load data dari API
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setUseMockData(false);

                // Load semua data secara paralel
                const [dashboardData, salesChartData, compositionChartData, categoryChartData] = await Promise.all([
                    dashboardAPI.getData(),
                    dashboardAPI.getSalesChart(),
                    dashboardAPI.getCompositionChart(), // DI-AKTIFKAN KEMBALI
                    dashboardAPI.getCategoryChart()      // DI-AKTIFKAN KEMBALI
                ]);

                // Sanitize performaHariIni data to prevent negative values
                if (dashboardData?.performaHariIni) {
                    dashboardData.performaHariIni = dashboardData.performaHariIni.map(item => ({
                        ...item,
                        value: Math.max(0, item.value || 0)
                    }));
                }

                setData(dashboardData);

                // Debug logging
                console.log('📊 Dashboard API Responses:');
                console.log('Sales Chart:', salesChartData);
                console.log('Composition Chart:', compositionChartData);
                console.log('Category Chart:', categoryChartData);

                // Fix: Access data from response.data for web mode
                const sales = salesChartData?.data?.salesData || salesChartData?.salesData || null;
                const composition = compositionChartData?.data?.compositionData || compositionChartData?.compositionData || null;
                const category = categoryChartData?.data?.categoryData || categoryChartData?.categoryData || null;

                console.log('Extracted Sales:', sales);
                console.log('Extracted Composition:', composition);
                console.log('Extracted Category:', category);

                setSalesData(sales);
                setCompositionData(composition);
                setCategoryData(category);

            } catch (err) {
                console.error("Failed to load dashboard data:", err);
                // Fallback ke mock data
                setData(mockDashboardData);
                setSalesData(mockSalesData.salesData);
                // Jika API gagal, pastikan data grafik juga kosong untuk menampilkan pesan error
                setCompositionData(null);
                setCategoryData(null);
                setUseMockData(true);
                setError('Menggunakan data contoh. Pastikan backend Wails berjalan untuk data real-time.');
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const formatNumber = (num) => {
        if (!num && num !== 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb';
        return num.toString();
    };

    // Komponen Kartu Statistik
    // Total Pendapatan dan Keuntungan Bersih tidak bisa minus (minimum 0)
    const StatCard = ({ title, value, trend, icon, isCurrency = false, badge }) => {
        // Pastikan nilai tidak negatif untuk currency (Total Pendapatan, Keuntungan Bersih)
        const safeValue = isCurrency ? Math.max(0, value || 0) : (value || 0);

        return (
            <div className="bg-white rounded-xl shadow-md p-6 card-hover border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 border border-green-200">
                            <FontAwesomeIcon icon={icon} className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {isCurrency ? formatRupiah(safeValue) : formatNumber(safeValue)}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-300">{badge}</span>
                </div>
                <div className="flex items-center mt-2">
                    <FontAwesomeIcon
                        icon={trend > 0 ? faArrowUp : faArrowDown}
                        className={`h-4 w-4 mr-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
                    />
                    <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(Math.abs(trend || 0)).toFixed(1)}% dari bulan lalu
                    </span>
                </div>
            </div>
        );
    };

    // Komponen Notifikasi
    const NotificationItem = ({ title, message, priority, time, type }) => {
        const priorityStyles = {
            high: 'bg-orange-50 border-orange-200',
            medium: 'bg-yellow-50 border-yellow-200',
            low: 'bg-green-50 border-green-200'
        };

        const iconStyles = {
            high: 'text-orange-600 bg-orange-100',
            medium: 'text-yellow-600 bg-yellow-100',
            low: 'text-green-700 bg-green-100'
        };

        const getNotificationIcon = () => {
            switch (type) {
                case 'low-stock': return faExclamationTriangle;
                case 'promo': return faTags;
                case 'new-product': return faPlus;
                case 'return': return faUndo;
                default: return faBell;
            }
        };

        return (
            <div className={`flex items-start p-3 rounded-lg border ${priorityStyles[priority]} hover:shadow-md transition-all duration-200 hover:border-green-300`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${iconStyles[priority]}`}>
                    <FontAwesomeIcon icon={getNotificationIcon()} className="h-5 w-5" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{title}</p>
                    <p className="text-xs text-gray-600 mt-1">{message}</p>
                    <p className="text-xs text-gray-500 mt-1">{time}</p>
                </div>
            </div>
        );
    };

    // Komponen Item Produk Terlaris
    const ProductItem = ({ produk, rank }) => {
        const colorMap = {
            green: 'bg-green-100 border-green-200 text-green-600',
            orange: 'bg-orange-100 border-orange-200 text-orange-600',
            red: 'bg-red-100 border-red-200 text-red-600',
            yellow: 'bg-yellow-100 border-yellow-200 text-yellow-600',
            gray: 'bg-gray-100 border-gray-200 text-gray-600'
        };

        return (
            <div className="flex items-center p-2 border border-gray-200 rounded-lg card-hover hover:shadow-md transition-all duration-200 hover:border-green-300">
                <div className={`w-10 h-10 ${colorMap[produk.color] || colorMap.gray} rounded-full flex items-center justify-center mr-3 shrink-0`}>
                    <FontAwesomeIcon icon={faBoxOpen} className="h-6 w-6" />
                </div>
                <div className="grow">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-medium text-gray-800 text-sm">{produk.nama}</h4>
                            <p className="text-xs text-gray-500">{produk.kategori}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-green-700">{formatRupiah(produk.harga)}/{produk.satuan}</p>
                            <p className="text-xs text-gray-500">Terjual: {produk.terjual} {produk.satuan}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Komponen Item Aktivitas
    const ActivityItem = ({ item }) => {
        const colorMap = {
            blue: 'bg-blue-100 border-blue-200 text-blue-600',
            green: 'bg-green-100 border-green-200 text-green-600',
            purple: 'bg-purple-100 border-purple-200 text-purple-600',
            yellow: 'bg-yellow-100 border-yellow-200 text-yellow-600',
            indigo: 'bg-indigo-100 border-indigo-200 text-indigo-600',
            red: 'bg-red-100 border-red-200 text-red-600'
        };

        const iconMap = {
            faReceipt: faReceipt,
            faBoxOpen: faBoxOpen,
            faTags: faTags,
            faExclamationTriangle: faExclamationTriangle,
            faUsers: faUsers,
            faUndo: faUndo
        };

        return (
            <div className="flex items-start p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
                <div className={`w-8 h-8 ${colorMap[item.color] || colorMap.blue} rounded-full flex items-center justify-center shrink-0`}>
                    <FontAwesomeIcon icon={iconMap[item.icon] || faClock} className="h-4 w-4" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                </div>
            </div>
        );
    };

    // Komponen Item Performa
    const PerformanceItem = ({ item }) => {
        const colorMap = {
            green: 'bg-green-100 border-green-200 text-green-600',
            blue: 'bg-blue-100 border-blue-200 text-blue-600',
            purple: 'bg-purple-100 border-purple-200 text-purple-600',
            red: 'bg-red-100 border-red-200 text-red-600'
        };

        const iconMap = {
            faMoneyBillWave: faMoneyBillWave,
            faReceipt: faReceipt,
            faShoppingBasket: faShoppingBasket,
            faUsers: faUsers
        };

        // Ensure value is never negative
        const safeValue = Math.max(0, item.value || 0);

        return (
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-green-300">
                <div className="flex items-center">
                    <div className={`w-10 h-10 ${colorMap[item.color] || colorMap.green} rounded-full flex items-center justify-center mr-3`}>
                        <FontAwesomeIcon icon={iconMap[item.icon] || faChartLine} className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                        {item.title.includes('Omzet') || item.title.includes('Omset') ? formatRupiah(safeValue) : safeValue}
                    </p>
                    <span className={`text-xs font-medium ${item.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.trend > 0 ? '+' : ''}{item.trend}%
                    </span>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 md:p-8 overflow-x-hidden">
                <div className="animate-pulse space-y-6">
                    <div className="h-20 bg-gray-300 rounded-xl w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-80 bg-gray-300 rounded-xl"></div>
                        <div className="h-80 bg-gray-300 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-50 p-6 md:p-8 overflow-x-hidden">
            {useMockData && (
                <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        <span>Menggunakan data contoh. Pastikan backend Wails berjalan untuk data real-time.</span>
                    </div>
                </div>
            )}

            {error && !useMockData && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="max-w-full mx-auto space-y-8">
                {/* Header Dashboard */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                                <FontAwesomeIcon icon={faBoxOpen} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">{greeting}, {userName}!</h2>
                                <p className="text-gray-600 mt-1">Dashboard toko </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 Card Summary Utama */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard title="Total Pendapatan" value={data?.statistikBulanan?.totalPendapatan} trend={data?.statistikBulanan?.vsBulanLalu} icon={faMoneyBillWave} isCurrency={true} badge="Bulan ini" />
                        <StatCard title="Total Transaksi" value={data?.statistikBulanan?.totalTransaksi} trend={data?.statistikBulanan?.vsBulanLalu} icon={faReceipt} badge="Bulan ini" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard title="Produk Terjual" value={data?.statistikBulanan?.produkTerjual} trend={data?.statistikBulanan?.vsBulanLalu} icon={faShoppingBasket} badge="Bulan ini" />
                        <StatCard title="Keuntungan Bersih" value={data?.statistikBulanan?.keuntunganBersih} trend={data?.statistikBulanan?.vsBulanLalu} icon={faChartLine} isCurrency={true} badge="Bulan ini" />
                    </div>
                </div>

                {/* Analytics Grafik */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Line Chart - Trend Penjualan */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                    <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-green-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Trend Penjualan</h3>
                            </div>
                            <div className="w-48">
                                <CustomSelect
                                    name="salesFilter"
                                    value={salesFilter}
                                    onChange={(e) => setSalesFilter(e.target.value)}
                                    options={[
                                        { value: 'hari', label: 'Hari Ini', icon: faCalendarAlt },
                                        { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarAlt },
                                        { value: 'bulan', label: '1 Bulan Terakhir', icon: faCalendarAlt }
                                    ]}
                                    placeholder="Pilih periode"
                                    icon={faFilter}
                                    size="sm"
                                />
                            </div>
                        </div>
                        <div className="h-64">
                            {salesData && salesData[salesFilter] ? (
                                <Line
                                    data={{
                                        labels: salesData[salesFilter].labels || [],
                                        datasets: [{
                                            label: 'Penjualan',
                                            data: (salesData[salesFilter].data || []).map(v => Math.max(0, v || 0)),
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
                                                    label: function (context) {
                                                        let label = context.dataset.label || '';
                                                        if (label) { label += ': '; }
                                                        if (context.parsed.y !== null) {
                                                            label += formatRupiah(Math.max(0, context.parsed.y));
                                                        }
                                                        return label;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                min: 0,
                                                ticks: {
                                                    callback: function (value) {
                                                        if (value >= 1000000) { return 'Rp ' + (value / 1000000).toFixed(1) + 'jt'; }
                                                        return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">Data penjualan tidak tersedia</div>
                            )}
                        </div>
                    </div>

                    {/* Donut Chart - Komposisi Penjualan */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 text-green-700" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Komposisi Penjualan</h3>
                        </div>
                        <div className="flex justify-end items-center mb-4">
                            <CustomSelect
                                name="compositionFilter"
                                value={compositionFilter}
                                onChange={(e) => setCompositionFilter(e.target.value)}
                                options={[
                                    { value: 'hari', label: 'Hari Ini', icon: faCalendarAlt },
                                    { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarAlt },
                                    { value: 'bulan', label: '1 Bulan Terakhir', icon: faCalendarAlt }
                                ]}
                                placeholder="Pilih periode"
                                icon={faFilter}
                                size="sm"
                            />
                        </div>
                        <div className="h-48">
                            {compositionData && compositionData[compositionFilter] && compositionData[compositionFilter].data && compositionData[compositionFilter].data.length > 0 ? (
                                <Doughnut
                                    data={{
                                        labels: compositionData[compositionFilter].labels || [],
                                        datasets: [{
                                            data: compositionData[compositionFilter].data || [],
                                            backgroundColor: (compositionData[compositionFilter].labels || []).map((label, index) => getCategoryColor(label, index)),
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        return context.label + ': ' + context.parsed.toFixed(1) + '%';
                                                    }
                                                }
                                            }
                                        },
                                        cutout: '70%'
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">Data komposisi tidak tersedia.</div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap justify-between">
                            {compositionData && compositionData[compositionFilter] && compositionData[compositionFilter].data && compositionData[compositionFilter].labels ? (
                                compositionData[compositionFilter].labels.map((label, index) => (
                                    <div key={label} className="flex items-center mb-2 mr-4">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getCategoryColor(label, index) }}></div>
                                        <span className="text-sm text-gray-600">{label}</span>
                                        <span className="text-sm font-medium text-gray-800 ml-1">
                                            {compositionData[compositionFilter].data[index]?.toFixed(1) || 0}%
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Tidak ada data komposisi untuk ditampilkan.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bar Chart - Penjualan per Kategori */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 text-green-700" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Penjualan per Kategori</h3>
                        </div>
                        <div className="w-48">
                            <CustomSelect
                                name="categoryFilter"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                options={[
                                    { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarAlt },
                                    { value: 'bulan', label: '1 Bulan Terakhir', icon: faCalendarAlt }
                                ]}
                                placeholder="Pilih periode"
                                icon={faFilter}
                                size="sm"
                            />
                        </div>
                    </div>
                    <div className="h-64">
                        {categoryData && categoryData[categoryFilter] && categoryData[categoryFilter].datasets && categoryData[categoryFilter].datasets.length > 0 ? (
                            <Bar
                                data={{
                                    labels: categoryData[categoryFilter].labels || [],
                                    datasets: categoryData[categoryFilter].datasets.map((dataset, index) => ({
                                        label: dataset.label,
                                        data: dataset.data,
                                        backgroundColor: getCategoryColor(dataset.label, index),
                                        borderRadius: 4,
                                    }))
                                }}
                                options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: { boxWidth: 12, padding: 15 }
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    let label = context.dataset.label || '';
                                                    if (label) { label += ': '; }
                                                    if (context.parsed.y !== null) {
                                                        label += formatRupiah(context.parsed.y);
                                                    }
                                                    return label;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: { stacked: true, grid: { display: false } },
                                        y: {
                                            stacked: true,
                                            ticks: {
                                                callback: function (value) {
                                                    if (value >= 1000000) { return 'Rp ' + (value / 1000000).toFixed(1) + 'jt'; }
                                                    return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">Data kategori tidak tersedia.</div>
                        )}
                    </div>
                    </div>
                </div>

                {/* Notifikasi Penting & Performa Toko Hari Ini */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                <FontAwesomeIcon icon={faBell} className="h-5 w-5 text-green-700" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Notifikasi Penting</h3>
                        </div>
                        <div className="space-y-3">
                            {data?.notifikasi && data.notifikasi.length > 0 ? (
                                data.notifikasi.map(n => <NotificationItem key={n.id} {...n} />)
                            ) : (
                                <p className="text-gray-500 text-center py-4">Tidak ada notifikasi</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-green-700" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Performa Toko Hari Ini</h3>
                        </div>
                        <div className="space-y-4">
                            {data?.performaHariIni && data.performaHariIni.length > 0 ? (
                                data.performaHariIni.map(item => <PerformanceItem key={item.id} item={item} />)
                            ) : (
                                <p className="text-gray-500 text-center py-4">Data performa tidak tersedia</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Produk Terlaris & Ringkasan Aktivitas Terakhir */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                    <FontAwesomeIcon icon={faBoxOpen} className="h-5 w-5 text-green-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Produk Terlaris</h3>
                            </div>
                            <button className="text-sm text-green-700 font-medium hover:underline">Lihat Semua</button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '380px' }}>
                            <div className="space-y-2">
                                {data?.produkTerlaris && data.produkTerlaris.length > 0 ? (
                                    data.produkTerlaris.map((p, i) => <ProductItem key={p.id} produk={p} rank={i + 1} />)
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Tidak ada data produk terlaris</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 flex flex-col h-full border border-gray-200 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-green-700" />
                            </div>
                            <h3 className="text-lg pb-3 font-semibold text-gray-800">Ringkasan Aktivitas Terakhir</h3>
                        </div>
                        <div className="space-y-3 grow flex flex-col justify-between">
                            <div className="space-y-3">
                                {data?.aktivitasTerakhir && data.aktivitasTerakhir.length > 0 ? (
                                    data.aktivitasTerakhir.map(item => <ActivityItem key={item.id} item={item} />)
                                ) : (
                                    <p className="text-gray-500 text-center py-4">Tidak ada aktivitas terbaru</p>
                                )}
                            </div>
                            <button className="w-full mt-6 text-center text-sm text-green-700 font-medium hover:underline py-2 border-t border-gray-100">
                                Lihat Semua Aktivitas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

Dashboard.defaultProps = {
    formatRupiah: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },
    userName: "Admin"
};

export default Dashboard;