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
    faExclamationTriangle,
    faBoxOpen,
    faClock,
    faPlus,
    faUndo,
    faTags,
    faUsers,
    faChartBar,
    faFilter,
    faCalendarAlt,
    faUser,
    faSearch,
    faPrint,
    faFileExcel,
    faFilePdf,
    faSignOutAlt,
    faSignInAlt,
    faChevronDown,
    faChevronUp,
    faTimes,
    faCheck,
    faTimesCircle,
    faCheckCircle,
    faSyncAlt,
    faUserClock,
    faHourglassHalf,
    faChartPie,
    faTable,
    faCalendarWeek,
    faCalendarDay,
    faSun,
    faMoon,
    faList
} from '@fortawesome/free-solid-svg-icons';
import { staffReportAPI, userAPI } from '../../../api';

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

// Impor CustomSelect dari folder common
import CustomSelect from '../../common/CustomSelect';

// Impor data dummy dari file terpisah (akan diganti dengan API call)
// import { data, monthlyReportData } from '../../../data/laporanStaffData';

// Import Wails API
import { useToast } from '../../common/ToastContainer';
import { useAuth } from '../../../contexts/AuthContext';

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

const LaporanStaff = ({ formatRupiah, userName = "Admin" }) => {
    const { showToast } = useToast();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const [activeTab, setActiveTab] = useState('harian');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showStaffDetail, setShowStaffDetail] = useState(false);
    const [dateFilter, setDateFilter] = useState('hari');
    const [customDateRange, setCustomDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [expandedStaff, setExpandedStaff] = useState(null);

    // Real data from backend
    const [staffReports, setStaffReports] = useState([]);
    const [allStaff, setAllStaff] = useState([]);
    const [monthlyReportData, setMonthlyReportData] = useState({});
    const [loadingStaffDetail, setLoadingStaffDetail] = useState(false);
    const [comprehensiveReport, setComprehensiveReport] = useState(null);
    const [data, setData] = useState({
        ringkasanHarian: {
            totalPendapatan: 0,
            totalProfit: 0,
            totalTransaksi: 0,
            totalProdukTerjual: 0,
            totalRefund: 0,
            rataRataTransaksi: 0,
            trendProfit: 0
        },
        staffList: [],
        grafikPendapatan: { hari: { labels: [], data: [] }, minggu: { labels: [], data: [] }, bulan: { labels: [], data: [] } },
        grafikTransaksi: { hari: { labels: [], data: [] }, minggu: { labels: [], data: [] }, bulan: { labels: [], data: [] } },
        grafikProduktivitasShift: { labels: [], data: [] },
        grafikPerbandinganStaff: { labels: [], data: [] },
        laporanBulanan: {
            totalPendapatan: 0,
            totalTransaksi: 0,
            produkTerlaris: '-',
            tren: 'naik',
            staffPalingProduktif: '-',
            staffPalingSedikitKontribusi: '-',
            trendPendapatanPercent: 0,
            trendTransaksiPercent: 0,
            produkTerlarisCount: 0,
            produkTerlarisCountPrev: 0,
            staffPalingProduktifPendapatan: 0,
            staffPalingProduktifPendapatanPrev: 0,
            staffPalingSedikitKontribusiPendapatan: 0,
            staffPalingSedikitKontribusiPendapatanPrev: 0
        }
    });

    // Load data from backend
    const loadStaffReports = async () => {
        setIsLoading(true);
        try {
            console.log('[LAPORAN STAFF] Loading staff reports with trend data...');

            // Get all staff reports WITH TREND for today vs yesterday
            const reportsWithTrend = await staffReportAPI.getAllWithTrend();
            console.log('[LAPORAN STAFF] Reports with trend:', reportsWithTrend);

            // Get all staff list
            const staff = await userAPI.getAll();
            setAllStaff(staff);

            // Transform backend data to match frontend structure
            await transformDataForUI(reportsWithTrend, staff);

            // Load comprehensive report for monthly data
            try {
                const compReport = await staffReportAPI.getComprehensive();
                console.log('[LAPORAN STAFF] Comprehensive report:', compReport);

                // Save to state
                setComprehensiveReport(compReport);

                // Get monthly comparison trend for actual percentage
                const monthlyTrend = await staffReportAPI.getMonthlyTrend();
                console.log('[LAPORAN STAFF] Monthly trend:', monthlyTrend);

                // Update monthly data with real trends
                setData(prevData => ({
                    ...prevData,
                    laporanBulanan: {
                        ...prevData.laporanBulanan,
                        totalPendapatan: compReport.totalPenjualan30Hari || 0,
                        totalTransaksi: compReport.totalTransaksi30Hari || 0,
                        produkTerlaris: compReport.produkTerlaris || '-',
                        tren: compReport.trendVsPrevious || 'tetap',
                        trendPendapatanPercent: monthlyTrend?.trends?.penjualan || 0,
                        trendTransaksiPercent: monthlyTrend?.trends?.transaksi || 0,
                        // Product data
                        produkTerlarisCount: monthlyTrend?.topProduct?.current?.count || 0,
                        produkTerlarisCountPrev: monthlyTrend?.topProduct?.previous?.count || 0,
                        // Best staff data
                        staffPalingProduktifPendapatan: monthlyTrend?.bestStaff?.current?.totalPenjualan || 0,
                        staffPalingProduktifPendapatanPrev: monthlyTrend?.bestStaff?.previous?.totalPenjualan || 0,
                        // Worst staff data
                        staffPalingSedikitKontribusiPendapatan: monthlyTrend?.worstStaff?.current?.totalPenjualan || 0,
                        staffPalingSedikitKontribusiPendapatanPrev: monthlyTrend?.worstStaff?.previous?.totalPenjualan || 0
                    }
                }));
            } catch (error) {
                console.error('Error loading comprehensive report:', error);
            }
        } catch (error) {
            console.error('Error loading staff reports:', error);
            showToast('error', 'Gagal memuat data laporan staff');
        } finally {
            setIsLoading(false);
        }
    };

    // Transform backend data to UI format with real trend data
    const transformDataForUI = async (reportsWithTrend, staff) => {
        // Calculate totals from current and previous period reports
        console.log('[STAFF REPORTS] Total staff with reports:', reportsWithTrend.length);

        const totals = reportsWithTrend.reduce((acc, reportTrend, index) => {
            const currentRefund = reportTrend.current?.totalRefund || 0;
            const currentReturnCount = reportTrend.current?.totalReturnCount || 0;
            const prevRefund = reportTrend.previous?.totalRefund || 0;
            const prevReturnCount = reportTrend.previous?.totalReturnCount || 0;

            // Debug logging for ALL staff (not just those with refunds)
            console.log(`[STAFF ${index + 1}] ${reportTrend.current?.namaStaff || 'Unknown'}`,
                `| Current Refund: Rp ${currentRefund.toLocaleString()}`,
                `| Return Count: ${currentReturnCount}`,
                `| Prev Refund: Rp ${prevRefund.toLocaleString()}`);

            return {
                totalPendapatan: acc.totalPendapatan + (reportTrend.current?.totalPenjualan || 0),
                totalProfit: acc.totalProfit + (reportTrend.current?.totalProfit || 0),
                totalTransaksi: acc.totalTransaksi + (reportTrend.current?.totalTransaksi || 0),
                totalProdukTerjual: acc.totalProdukTerjual + (reportTrend.current?.totalItemTerjual || 0),
                totalRefund: acc.totalRefund + currentRefund,
                totalReturnCount: acc.totalReturnCount + currentReturnCount,
                prevPendapatan: acc.prevPendapatan + (reportTrend.previous?.totalPenjualan || 0),
                prevProfit: acc.prevProfit + (reportTrend.previous?.totalProfit || 0),
                prevTransaksi: acc.prevTransaksi + (reportTrend.previous?.totalTransaksi || 0),
                prevProdukTerjual: acc.prevProdukTerjual + (reportTrend.previous?.totalItemTerjual || 0),
                prevRefund: acc.prevRefund + prevRefund,
                prevReturnCount: acc.prevReturnCount + prevReturnCount
            };
        }, {
            totalPendapatan: 0,
            totalProfit: 0,
            totalTransaksi: 0,
            totalProdukTerjual: 0,
            totalRefund: 0,
            totalReturnCount: 0,
            prevPendapatan: 0,
            prevProfit: 0,
            prevTransaksi: 0,
            prevProdukTerjual: 0,
            prevRefund: 0,
            prevReturnCount: 0
        });

        console.log('========================================');
        console.log('[AGGREGATE TOTALS]');
        console.log('Total Refund (All Staff):', 'Rp', totals.totalRefund.toLocaleString());
        console.log('Total Return Count:', totals.totalReturnCount);
        console.log('Previous Refund:', 'Rp', totals.prevRefund.toLocaleString());
        console.log('========================================');

        // Calculate trend percentages
        const calculateTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100).toFixed(1);
        };

        const trendPendapatan = calculateTrend(totals.totalPendapatan, totals.prevPendapatan);
        const trendTransaksi = calculateTrend(totals.totalTransaksi, totals.prevTransaksi);
        const trendProduk = calculateTrend(totals.totalProdukTerjual, totals.prevProdukTerjual);
        const trendRefund = calculateTrend(totals.totalRefund, totals.prevRefund);

        const rataRataTransaksi = totals.totalTransaksi > 0 ? totals.totalPendapatan / totals.totalTransaksi : 0;
        const prevRataRataTransaksi = totals.prevTransaksi > 0 ? totals.prevPendapatan / totals.prevTransaksi : 0;
        const trendRataRata = calculateTrend(rataRataTransaksi, prevRataRataTransaksi);

        // Create staff list with report and trend data
        const staffList = staff.map(s => {
            const reportTrend = reportsWithTrend.find(r => r.current?.staffId === s.id);
            const current = reportTrend?.current || {};
            const trend = reportTrend?.trendPenjualan || 'tetap';
            const percentChange = reportTrend?.percentChange || 0;

            return {
                id: s.id,
                nama: s.namaLengkap || s.username,
                shift: s.shift || 'Belum ditentukan',
                totalPendapatan: current.totalPenjualan || 0,
                totalTransaksi: current.totalTransaksi || 0,
                produkTerjual: current.totalItemTerjual || 0,
                trend: trend,
                percentChange: percentChange,
                akurasiInput: 98.5,
                waktuLogin: '-',
                waktuLogout: '-',
                status: s.status === 'active' ? 'aktif' : 'tidak aktif',
                jamKerja: '-',
                rataRataTransaksiPerJam: 0,
                aktivitas: [],
                transaksi: []
            };
        });

        // Find best and worst performing staff
        const sortedByRevenue = [...staffList].sort((a, b) => b.totalPendapatan - a.totalPendapatan);
        const bestStaff = sortedByRevenue[0]?.nama || '-';
        const worstStaff = sortedByRevenue[sortedByRevenue.length - 1]?.nama || '-';

        // Calculate overall trend
        const prevTotals = reportsWithTrend.reduce((acc, reportTrend) => ({
            totalPendapatan: acc.totalPendapatan + (reportTrend.previous?.totalPenjualan || 0)
        }), { totalPendapatan: 0 });

        const overallTrend = totals.totalPendapatan > prevTotals.totalPendapatan ? 'naik' :
            totals.totalPendapatan < prevTotals.totalPendapatan ? 'turun' : 'tetap';

        // Load historical data for first staff to populate charts (aggregate all staff)
        let chartData = {
            hari: { labels: [], data: [] },
            minggu: { labels: [], data: [] },
            bulan: { labels: [], data: [] }
        };

        try {
            // Get historical data for all staff and aggregate
            const allHistoricalData = await Promise.all(
                staff.slice(0, 5).map(s => staffReportAPI.getHistoricalData(s.id).catch(err => {
                    console.error(`[CHART DATA] Error loading historical data for staff ${s.id}:`, err);
                    return null;
                }))
            );

            console.log('[CHART DATA] All historical data loaded:', allHistoricalData.filter(d => d !== null).length, 'of', staff.slice(0, 5).length);

            // Aggregate daily data (last 7 days) - properly aligned with current day
            const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            const dailyLabels = [];
            const dailyData = new Array(7).fill(0);

            // Get current day and build labels starting from 6 days ago
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc
                dailyLabels.push(dayNames[dayOfWeek]);
            }

            // Aggregate data from all staff
            allHistoricalData.forEach(histData => {
                if (histData?.daily) {
                    histData.daily.forEach((day, idx) => {
                        if (idx < 7) {
                            dailyData[idx] += day.totalPenjualan || 0;
                        }
                    });
                }
            });

            console.log('[CHART DATA] Daily labels:', dailyLabels);
            console.log('[CHART DATA] Daily data:', dailyData);

            // Aggregate weekly data (last 4 weeks)
            const weeklyLabels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
            const weeklyData = new Array(4).fill(0);

            allHistoricalData.forEach(histData => {
                if (histData?.weekly) {
                    histData.weekly.forEach((week, idx) => {
                        if (idx < 4) {
                            weeklyData[idx] += week.totalPenjualan || 0;
                        }
                    });
                }
            });

            // Aggregate monthly data (last 6 months)
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const monthlyLabels = [];
            const monthlyData = new Array(6).fill(0);

            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthlyLabels.push(monthNames[month.getMonth()]);
            }

            allHistoricalData.forEach(histData => {
                if (histData?.monthly) {
                    histData.monthly.forEach((month, idx) => {
                        if (idx < 6) {
                            monthlyData[idx] += month.totalPenjualan || 0;
                        }
                    });
                }
            });

            chartData = {
                hari: { labels: dailyLabels, data: dailyData },
                minggu: { labels: weeklyLabels, data: weeklyData },
                bulan: { labels: monthlyLabels, data: monthlyData }
            };
        } catch (error) {
            console.error('Error loading historical data:', error);
        }

        // Get shift productivity data
        let shiftData = { labels: ['Pagi (06:00-14:00)', 'Sore (14:00-22:00)', 'Malam (22:00-06:00)'], data: [0, 0, 0] };
        try {
            const shiftProductivity = await staffReportAPI.getShiftProductivity();
            console.log('[SHIFT PRODUCTIVITY] Data received:', shiftProductivity);
            if (shiftProductivity) {
                shiftData = {
                    labels: ['Pagi (06:00-14:00)', 'Sore (14:00-22:00)', 'Malam (22:00-06:00)'],
                    data: [
                        shiftProductivity.Pagi || 0,
                        shiftProductivity.Sore || 0,
                        shiftProductivity.Malam || 0
                    ]
                };
            }
        } catch (error) {
            console.error('Error loading shift productivity:', error);
        }

        // Get transaction counts data for charts
        let transactionChartData = {
            hari: { labels: chartData.hari.labels, data: new Array(7).fill(0) },
            minggu: { labels: chartData.minggu.labels, data: new Array(4).fill(0) },
            bulan: { labels: chartData.bulan.labels, data: new Array(6).fill(0) }
        };

        try {
            // Aggregate transaction counts from all staff historical data
            console.log('[TRANSACTION CHART] Processing historical data, count:', allHistoricalData.length);
            allHistoricalData.forEach((histData, staffIdx) => {
                console.log(`[TRANSACTION CHART] Processing staff ${staffIdx}:`, histData);

                if (histData?.daily) {
                    console.log(`[TRANSACTION CHART] Staff ${staffIdx} daily data:`, histData.daily);
                    histData.daily.forEach((day, idx) => {
                        if (idx < 7) {
                            const txCount = day.totalTransaksi || 0;
                            transactionChartData.hari.data[idx] += txCount;
                            console.log(`[TRANSACTION CHART] Day ${idx}: adding ${txCount}, new total: ${transactionChartData.hari.data[idx]}`);
                        }
                    });
                }
                if (histData?.weekly) {
                    console.log(`[TRANSACTION CHART] Staff ${staffIdx} weekly data:`, histData.weekly);
                    histData.weekly.forEach((week, idx) => {
                        if (idx < 4) {
                            const txCount = week.totalTransaksi || 0;
                            transactionChartData.minggu.data[idx] += txCount;
                            console.log(`[TRANSACTION CHART] Week ${idx}: adding ${txCount}, new total: ${transactionChartData.minggu.data[idx]}`);
                        }
                    });
                }
                if (histData?.monthly) {
                    console.log(`[TRANSACTION CHART] Staff ${staffIdx} monthly data:`, histData.monthly);
                    histData.monthly.forEach((month, idx) => {
                        if (idx < 6) {
                            const txCount = month.totalTransaksi || 0;
                            transactionChartData.bulan.data[idx] += txCount;
                            console.log(`[TRANSACTION CHART] Month ${idx}: adding ${txCount}, new total: ${transactionChartData.bulan.data[idx]}`);
                        }
                    });
                }
            });

            console.log('[TRANSACTION CHART] Daily data:', transactionChartData.hari.data);
            console.log('[TRANSACTION CHART] Weekly data:', transactionChartData.minggu.data);
            console.log('[TRANSACTION CHART] Monthly data:', transactionChartData.bulan.data);
            console.log('[TRANSACTION CHART] Full transactionChartData:', JSON.stringify(transactionChartData, null, 2));
        } catch (error) {
            console.error('Error calculating transaction chart data:', error);
        }

        console.log('[DATA TRANSFORM] Final grafikTransaksi to be set:', JSON.stringify(transactionChartData, null, 2));

        // Calculate profit trend
        const trendProfit = calculateTrend(totals.totalProfit, totals.prevProfit);

        // Update data state with REAL DATA
        setData({
            ringkasanHarian: {
                totalPendapatan: totals.totalPendapatan,
                totalProfit: totals.totalProfit,
                totalTransaksi: totals.totalTransaksi,
                totalProdukTerjual: totals.totalProdukTerjual,
                totalRefund: totals.totalRefund,  // Real refund data (based on harga_beli)
                totalReturnCount: totals.totalReturnCount,  // Number of return transactions
                rataRataTransaksi: rataRataTransaksi,
                trendPendapatan: parseFloat(trendPendapatan),
                trendProfit: parseFloat(trendProfit),
                trendTransaksi: parseFloat(trendTransaksi),
                trendProduk: parseFloat(trendProduk),
                trendRefund: parseFloat(trendRefund),  // Trend for refund
                trendRataRata: parseFloat(trendRataRata)
            },
            staffList: staffList,
            grafikPendapatan: chartData,
            grafikTransaksi: transactionChartData,
            grafikProduktivitasShift: shiftData,
            grafikPerbandinganStaff: {
                labels: staffList.slice(0, 4).map(s => s.nama),
                data: staffList.slice(0, 4).map(s => s.totalPendapatan)
            },
            laporanBulanan: {
                totalPendapatan: 0, // Will be updated by comprehensive report
                totalTransaksi: 0, // Will be updated by comprehensive report
                produkTerlaris: '-', // Will be updated by comprehensive report
                tren: overallTrend,
                staffPalingProduktif: bestStaff,
                staffPalingSedikitKontribusi: worstStaff
            }
        });
    };

    // Load data on component mount
    useEffect(() => {
        loadStaffReports();
    }, []);

    // Manual refresh function
    const handleRefresh = () => {
        console.log('[LAPORAN STAFF] Manual refresh triggered');
        loadStaffReports();
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

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb';
        return num.toString();
    };

    const handleStaffClick = async (staff) => {
        setSelectedStaff(staff);
        setShowStaffDetail(true);
        setLoadingStaffDetail(true);

        // Simpan posisi scroll sebelum membuka modal
        const scrollYBeforeModal = window.scrollY;
        sessionStorage.setItem('scrollYBeforeModal', scrollYBeforeModal);

        try {
            // Load monthly data for selected staff - last 31 days
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            console.log('[STAFF DETAIL] Loading detail for staff:', staff.id, 'from', startDate, 'to', endDate);

            const detailReport = await staffReportAPI.getReportDetail(staff.id, startDate, endDate);
            console.log('[STAFF DETAIL] Detail report received:', detailReport);

            // Get historical data untuk daily breakdown
            const historicalData = await staffReportAPI.getHistoricalData(staff.id);
            console.log('[STAFF DETAIL] Historical data:', historicalData);

            // Create daily data array from transactions
            const dailyMap = {};

            // Initialize all 31 days with 0
            for (let i = 0; i < 31; i++) {
                const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toISOString().split('T')[0];
                dailyMap[dateStr] = {
                    tanggal: dateStr,
                    totalBelanja: 0,
                    totalTransaksi: 0,
                    produkTerjual: 0
                };
            }

            // Populate with real data from transactions
            if (detailReport?.transaksi) {
                detailReport.transaksi.forEach(t => {
                    const dateStr = new Date(t.tanggal).toISOString().split('T')[0];
                    if (dailyMap[dateStr]) {
                        dailyMap[dateStr].totalBelanja += t.total || 0;
                        dailyMap[dateStr].totalTransaksi += 1;
                    }
                });
            }

            // Populate item counts from itemCountsByDate
            if (detailReport?.itemCountsByDate) {
                Object.entries(detailReport.itemCountsByDate).forEach(([dateStr, itemCount]) => {
                    if (dailyMap[dateStr]) {
                        dailyMap[dateStr].produkTerjual = itemCount;
                    }
                });
            }

            // Convert to array and sort by date
            const dailyData = Object.values(dailyMap).sort((a, b) =>
                new Date(a.tanggal) - new Date(b.tanggal)
            );

            setMonthlyReportData({
                ...monthlyReportData,
                [staff.id]: dailyData
            });
        } catch (error) {
            console.error('Error loading staff detail:', error);
            showToast('error', 'Gagal memuat detail laporan staff');
        } finally {
            setLoadingStaffDetail(false);
        }
    };

    // Effect untuk mencegah scroll body saat modal terbuka
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        if (showStaffDetail) {
            // Simpan posisi scroll saat ini
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            // Set overflow ke hidden dan position fixed pada body
            html.style.overflow = 'hidden';
            body.style.overflow = 'hidden';
            body.style.position = 'fixed';
            body.style.top = `-${scrollY}px`;
            body.style.left = `-${scrollX}px`;
            body.style.width = '100%';

            return () => {
                // Restore body styles dan scroll position saat modal ditutup
                body.style.position = '';
                body.style.top = '';
                body.style.left = '';
                body.style.width = '';
                body.style.overflow = '';
                html.style.overflow = '';

                // Pulihkan scroll ke posisi yang disimpan di sessionStorage
                const savedScrollY = sessionStorage.getItem('scrollYBeforeModal');
                if (savedScrollY) {
                    window.scrollTo(0, parseInt(savedScrollY));
                    sessionStorage.removeItem('scrollYBeforeModal');
                }
            };
        }
    }, [showStaffDetail]);

    const toggleExpandStaff = (staffId, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setExpandedStaff(expandedStaff === staffId ? null : staffId);
    };

    const handleExport = (format, e) => {
        if (e) e.preventDefault();
        // Implementasi export data
        console.log(`Export data in ${format} format`);
    };

    const handlePrint = (e) => {
        if (e) e.preventDefault();
        // Implementasi print
        console.log('Print report');
    };

    // Close modal and restore scroll
    const handleCloseModal = () => {
        setShowStaffDetail(false);
        // Restore scroll position
        const savedScrollY = sessionStorage.getItem('scrollYBeforeModal');
        if (savedScrollY) {
            window.scrollTo(0, parseInt(savedScrollY));
            sessionStorage.removeItem('scrollYBeforeModal');
        }
    };

    // Helper function untuk menghitung trend data
    const calculateTrendData = (current, previous) => {
        const denominator = previous || 1;

        const value = current > previous
            ? ((current - previous) / denominator * 100)
            : -((previous - current) / denominator * 100);

        const text = current > previous
            ? `+${(((current - previous) / denominator * 100).toFixed(1))}% vs periode sebelumnya`
            : `${(((current - previous) / denominator * 100).toFixed(1))}% vs periode sebelumnya`;

        return { value, text };
    };

    // Komponen Kartu Statistik dengan layout horizontal icon dan title, value di bawah dengan items-start
    const StatCard = ({ title, value, trend, icon, isCurrency = false, color = 'green' }) => (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-3">
                <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-${color}-200`}>
                    <FontAwesomeIcon icon={icon} className={`text-xl text-${color}-700`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 font-medium truncate">{title}</p>
                </div>
            </div>
            <div className="flex flex-col items-start">
                <p className="text-2xl font-bold text-gray-800">
                    {isCurrency ? formatRupiah(value) : formatNumber(value)}
                </p>
                {trend !== undefined && (
                    <div className="flex items-center mt-2">
                        <FontAwesomeIcon
                            icon={trend > 0 ? faArrowUp : faArrowDown}
                            className={`text-sm mr-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
                        />
                        <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(trend)}% dari hari sebelumnya
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    // Komponen Card untuk Ringkasan Mingguan dan Bulanan dengan items-start
    const SummaryCard = ({ title, value, trend, icon, color = 'green', additionalText }) => (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-3">
                <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-${color}-200`}>
                    <FontAwesomeIcon icon={icon} className={`text-xl text-${color}-700`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 font-medium truncate">{title}</p>
                </div>
            </div>
            <div className="flex flex-col items-start">
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <div className="flex items-center mt-2">
                    {trend && (
                        <>
                            <FontAwesomeIcon
                                icon={trend.icon || (trend.value > 0 ? faArrowUp : faArrowDown)}
                                className={`text-sm mr-1 ${trend.color || (trend.value > 0 ? 'text-green-600' : 'text-red-600')}`}
                            />
                            <span className={`text-xs font-medium ${trend.color || (trend.value > 0 ? 'text-green-600' : 'text-red-600')}`}>
                                {trend.text}
                            </span>
                        </>
                    )}
                    {additionalText && (
                        <>
                            <FontAwesomeIcon icon={additionalText.icon} className="h-4 w-4 mr-1 text-green-600" />
                            <span className="text-xs font-medium text-green-600">{additionalText.text}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // Komponen Card Staff dengan desain baru - FIXED SCROLL ISSUE & MODIFIED AS REQUESTED
    const StaffCard = ({ staff }) => {
        const handleDetailClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleStaffClick(staff);
        };

        return (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-green-400 group">
                {/* Header Staff */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shadow-sm border border-green-200">
                            <FontAwesomeIcon icon={faUser} className="text-xl text-green-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">{staff.nama}</h3>
                            <p className="text-sm text-gray-600">{staff.shift}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${staff.status === 'aktif' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className={`text-xs font-medium ${staff.status === 'aktif' ? 'text-green-600' : 'text-gray-600'}`}>
                            {staff.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                    </div>
                </div>

                {/* Stats Grid - MODIFIED: Removed Akurasi Input, changed to 3 columns */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Pendapatan</p>
                        <p className="text-lg font-semibold text-gray-800">{formatRupiah(staff.totalPendapatan)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Transaksi</p>
                        <p className="text-lg font-semibold text-gray-800">{staff.totalTransaksi}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Produk Terjual</p>
                        <p className="text-lg font-semibold text-gray-800">{staff.produkTerjual}</p>
                    </div>
                </div>

                {/* Time Info - REMOVED Sign In/Sign Out icons and times */}
                
                {/* Action Buttons - REMOVED Expand Dropdown */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={handleDetailClick}
                        className="text-sm font-medium text-green-700 hover:text-green-900 hover:underline"
                    >
                        Lihat Detail
                    </button>
                </div>
            </div>
        );
    };

    // Komponen Container dengan Header Gradient
    const SectionContainer = ({ title, children, className = "" }) => (
        <div className={`bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8 ${className}`}>
            {/* Header dengan Gradient */}
            <div className="bg-green-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faUsers} className="text-white text-lg" />
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                    </div>
                    <div className="text-green-100 text-xs bg-green-600 px-3 py-1 rounded-full font-medium border border-green-400">
                        Total: {data.staffList.length} Staff
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    // Komponen Modal Detail Staff - DIPERBARUI DENGAN BACKDROP BLUR
    const StaffDetailModal = () => {
        if (!showStaffDetail || !selectedStaff) return null;

        // State untuk filter bulan
        const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
        const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

        // Dapatkan data bulanan berdasarkan staff yang dipilih
        const getMonthlyData = () => {
            return monthlyReportData[selectedStaff.id] || [];
        };

        const monthlyData = getMonthlyData();

        // Filter data berdasarkan bulan dan tahun yang dipilih
        const filteredMonthlyData = monthlyData.filter(day => {
            const date = new Date(day.tanggal);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });

        // Hitung total untuk bulan ini
        const calculateMonthlyTotals = () => {
            return filteredMonthlyData.reduce((acc, day) => ({
                totalBelanja: acc.totalBelanja + day.totalBelanja,
                totalTransaksi: acc.totalTransaksi + day.totalTransaksi,
                produkTerjual: acc.produkTerjual + day.produkTerjual
            }), { totalBelanja: 0, totalTransaksi: 0, produkTerjual: 0 });
        };

        const monthlyTotals = calculateMonthlyTotals();

        // Format nama bulan
        const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        // Generate tahun options (3 tahun terakhir)
        const yearOptions = [2022, 2023, 2024];

        return (
            <div className="fixed inset-0 bg-gray-200/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Detail Laporan Staff - {selectedStaff.nama}</h2>
                        <button
                            onClick={handleCloseModal}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Filter Bulan dan Tahun */}
                        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faFilter} className="h-5 w-5 mr-2 text-green-700" />
                                Filter Laporan Bulanan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
                                    <CustomSelect
                                        name="selectedMonth"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        options={monthNames.map((month, index) => ({
                                            value: index,
                                            label: month
                                        }))}
                                        placeholder="Pilih bulan"
                                        icon={faCalendarAlt}
                                        size="md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                                    <CustomSelect
                                        name="selectedYear"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        options={yearOptions.map(year => ({
                                            value: year,
                                            label: year.toString()
                                        }))}
                                        placeholder="Pilih tahun"
                                        icon={faCalendarAlt}
                                        size="md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ringkasan Bulanan */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 mr-2 text-green-700" />
                                Ringkasan Bulanan - {monthNames[selectedMonth]} {selectedYear}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Total Pendapatan</p>
                                            <p className="text-2xl font-bold text-green-800">{formatRupiah(monthlyTotals.totalBelanja)}</p>
                                        </div>
                                        <FontAwesomeIcon icon={faMoneyBillWave} className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Total Transaksi</p>
                                            <p className="text-2xl font-bold text-blue-800">{monthlyTotals.totalTransaksi}</p>
                                        </div>
                                        <FontAwesomeIcon icon={faReceipt} className="h-8 w-8 text-blue-600" />
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-orange-600 font-medium">Produk Terjual</p>
                                            <p className="text-2xl font-bold text-orange-800">{monthlyTotals.produkTerjual}</p>
                                        </div>
                                        <FontAwesomeIcon icon={faShoppingBasket} className="h-8 w-8 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Laporan Harian Bulanan */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faTable} className="h-5 w-5 mr-2 text-green-700" />
                                Laporan Harian {monthNames[selectedMonth]} {selectedYear}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg overflow-hidden border border-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tanggal</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hari</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Belanja</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Profit</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Transaksi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Produk Terjual</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rata-rata/Transaksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredMonthlyData.map((day, index) => {
                                            const date = new Date(day.tanggal);
                                            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                                            const dayName = dayNames[date.getDay()];
                                            // Fixed: Handle null/undefined values for rata-rata
                                            const rataRata = day.totalTransaksi > 0 ? day.totalBelanja / day.totalTransaksi : 0;

                                            return (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {date.getDate()} {monthNames[selectedMonth]} {selectedYear}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{dayName}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatRupiah(day.totalBelanja)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                                                        {formatRupiah(day.totalProfit || 0)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{day.totalTransaksi}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{day.produkTerjual}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatRupiah(rataRata)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {/* Footer dengan Total */}
                                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                        <tr>
                                            <td colSpan="2" className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                                Total Bulanan:
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {formatRupiah(monthlyTotals.totalBelanja)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {monthlyTotals.totalTransaksi}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {monthlyTotals.produkTerjual}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {/* Fixed: Handle null/undefined values for monthly average */}
                                                {formatRupiah(monthlyTotals.totalTransaksi > 0 ? monthlyTotals.totalBelanja / monthlyTotals.totalTransaksi : 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Statistik Tambahan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Statistik Performa</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Rata-rata Harian:</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {formatRupiah(filteredMonthlyData.length > 0 ? monthlyTotals.totalBelanja / filteredMonthlyData.length : 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Transaksi/Hari:</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {filteredMonthlyData.length > 0 ? (monthlyTotals.totalTransaksi / filteredMonthlyData.length).toFixed(1) : 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Produk/Hari:</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            {filteredMonthlyData.length > 0 ? (monthlyTotals.produkTerjual / filteredMonthlyData.length).toFixed(1) : 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h4 className="text-md font-semibold text-gray-800 mb-3">Hari Terbaik</h4>
                                {filteredMonthlyData.length > 0 ? (() => {
                                    const bestDay = filteredMonthlyData.reduce((best, current) =>
                                        current.totalBelanja > best.totalBelanja ? current : best
                                    );
                                    const date = new Date(bestDay.tanggal);
                                    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

                                    return (
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Tanggal:</span>
                                                <span className="text-sm font-medium text-gray-800">
                                                    {date.getDate()} {monthNames[selectedMonth]} ({dayNames[date.getDay()]})
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Pendapatan:</span>
                                                <span className="text-sm font-medium text-green-600">
                                                    {formatRupiah(bestDay.totalBelanja)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Transaksi:</span>
                                                <span className="text-sm font-medium text-gray-800">
                                                    {bestDay.totalTransaksi}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <p className="text-sm text-gray-500">Tidak ada data untuk bulan ini</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 md:p-8 overflow-x-hidden">
                <div className="animate-pulse space-y-6">
                    {/* Skeleton untuk header */}
                    <div className="h-20 bg-gray-300 rounded-xl w-1/3"></div>
                    {/* Skeleton untuk cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
                        ))}
                    </div>
                    {/* Skeleton untuk grafik */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-80 bg-gray-300 rounded-xl"></div>
                        <div className="h-80 bg-gray-300 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-full mx-auto space-y-8">
                {/* Header Laporan Staff */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                                <FontAwesomeIcon icon={faUsers} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">{greeting}, {userName}!</h2>
                                <p className="text-gray-600 mt-1">Laporan Staff - Monitor performa seluruh staff</p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            <div>
                                <p className="text-sm text-gray-600">
                                    {currentTime.toLocaleDateString('id-ID', {
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {currentTime.toLocaleTimeString('id-ID')}
                                </p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Refresh data"
                            >
                                <FontAwesomeIcon icon={faSyncAlt} className={isLoading ? 'animate-spin' : ''} />
                                <span className="text-sm font-medium">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigasi dengan CustomSelect untuk Mobile */}
                <div className="bg-white rounded-2xl shadow-md p-2 border border-gray-200">
                    <div className="flex flex-wrap items-center justify-between">
                        <div className="flex flex-wrap">
                            <button
                                onClick={() => setActiveTab('harian')}
                                className={`flex items-center px-4 py-2 rounded-lg mr-2 mb-2 ${activeTab === 'harian' ? 'bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <FontAwesomeIcon icon={faCalendarDay} className="h-4 w-4 mr-2" />
                                Laporan Harian
                            </button>
                            <button
                                onClick={() => setActiveTab('bulanan')}
                                className={`flex items-center px-4 py-2 rounded-lg mr-2 mb-2 ${activeTab === 'bulanan' ? 'bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="h-4 w-4 mr-2" />
                                Laporan Bulanan
                            </button>
                            <button
                                onClick={() => setActiveTab('grafik')}
                                className={`flex items-center px-4 py-2 rounded-lg mr-2 mb-2 ${activeTab === 'grafik' ? 'bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 mr-2" />
                                Grafik Performa
                            </button>
                        </div>

                        {/* Quick Navigation Dropdown untuk Mobile */}
                        <div className="lg:hidden w-48">
                            <CustomSelect
                                name="activeTab"
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                                options={[
                                    { value: 'harian', label: 'Laporan Harian', icon: faCalendarDay },
                                    { value: 'bulanan', label: 'Laporan Bulanan', icon: faCalendarAlt },
                                    { value: 'grafik', label: 'Grafik Performa', icon: faChartLine }
                                ]}
                                placeholder="Pilih laporan"
                                icon={faChartBar}
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Konten Tab Harian */}
                {activeTab === 'harian' && (
                    <div className="space-y-6">
                        {/* Ringkasan Harian - DESAIN BARU DENGAN LAYOUT HORIZONTAL DAN ITEMS-START */}
                        <SectionContainer title="Ringkasan Harian (Semua Staff)">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <StatCard
                                    title="Total Pendapatan"
                                    value={data.ringkasanHarian.totalPendapatan}
                                    trend={data.ringkasanHarian.trendPendapatan || 0}
                                    icon={faMoneyBillWave}
                                    isCurrency={true}
                                />
                                <StatCard
                                    title="Total Profit"
                                    value={data.ringkasanHarian.totalProfit}
                                    trend={data.ringkasanHarian.trendProfit || 0}
                                    icon={faChartLine}
                                    isCurrency={true}
                                    color="green"
                                />
                                <StatCard
                                    title="Total Transaksi"
                                    value={data.ringkasanHarian.totalTransaksi}
                                    trend={data.ringkasanHarian.trendTransaksi || 0}
                                    icon={faReceipt}
                                />
                                <StatCard
                                    title="Total Produk Terjual"
                                    value={data.ringkasanHarian.totalProdukTerjual}
                                    trend={data.ringkasanHarian.trendProduk || 0}
                                    icon={faShoppingBasket}
                                />
                                <StatCard
                                    title="Total Refund/Retur"
                                    value={data.ringkasanHarian.totalRefund}
                                    // MODIFIED: Removed trend prop to hide percentage
                                    icon={faUndo}
                                    isCurrency={true}
                                    color="red"
                                />
                                <StatCard
                                    title="Rata-rata Transaksi"
                                    value={data.ringkasanHarian.rataRataTransaksi}
                                    trend={data.ringkasanHarian.trendRataRata || 0}
                                    icon={faMoneyBillWave}
                                    isCurrency={true}
                                />
                            </div>
                        </SectionContainer>

                        {/* Daftar Staff & Performa - FIXED SCROLL ISSUE */}
                        <SectionContainer title="Daftar Staff & Performa">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.staffList.map(staff => (
                                    <StaffCard key={staff.id} staff={staff} />
                                ))}
                            </div>
                        </SectionContainer>
                    </div>
                )}

                {/* Konten Tab Bulanan */}
                {activeTab === 'bulanan' && (
                    <div className="space-y-6">
                        {/* Ringkasan Bulanan - DESAIN BARU DENGAN LAYOUT HORIZONTAL DAN ITEMS-START */}
                        <SectionContainer title="Ringkasan Bulanan">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SummaryCard
                                    title="Total Pendapatan (30 Hari)"
                                    value={formatRupiah(data.laporanBulanan.totalPendapatan)}
                                    trend={{
                                        value: data.laporanBulanan.trendPendapatanPercent || 0,
                                        text: `${Math.abs(data.laporanBulanan.trendPendapatanPercent || 0).toFixed(1)}% dari 30 hari sebelumnya`
                                    }}
                                    icon={faMoneyBillWave}
                                    color="green"
                                />
                                <SummaryCard
                                    title="Total Transaksi (30 Hari)"
                                    value={data.laporanBulanan.totalTransaksi}
                                    trend={{
                                        value: data.laporanBulanan.trendTransaksiPercent || 0,
                                        text: `${Math.abs(data.laporanBulanan.trendTransaksiPercent || 0).toFixed(1)}% dari 30 hari sebelumnya`
                                    }}
                                    icon={faReceipt}
                                    color="blue"
                                />
                                <SummaryCard
                                    title="Produk Paling Banyak Dijual"
                                    value={data.laporanBulanan.produkTerlaris}
                                    additionalText={data.laporanBulanan.produkTerlarisCount > 0 ? {
                                        icon: faShoppingBasket,
                                        text: `${data.laporanBulanan.produkTerlarisCount} unit terjual`
                                    } : undefined}
                                    trend={data.laporanBulanan.produkTerlarisCountPrev !== undefined && data.laporanBulanan.produkTerlarisCountPrev > 0 ? {
                                        value: data.laporanBulanan.produkTerlarisCount > data.laporanBulanan.produkTerlarisCountPrev ?
                                            ((data.laporanBulanan.produkTerlarisCount - data.laporanBulanan.produkTerlarisCountPrev) / data.laporanBulanan.produkTerlarisCountPrev * 100) :
                                            -((data.laporanBulanan.produkTerlarisCountPrev - data.laporanBulanan.produkTerlarisCount) / data.laporanBulanan.produkTerlarisCountPrev * 100),
                                        text: data.laporanBulanan.produkTerlarisCount > data.laporanBulanan.produkTerlarisCountPrev ?
                                            `+${(((data.laporanBulanan.produkTerlarisCount - data.laporanBulanan.produkTerlarisCountPrev) / data.laporanBulanan.produkTerlarisCountPrev * 100).toFixed(1))}% dari periode sebelumnya` :
                                            `${(((data.laporanBulanan.produkTerlarisCount - data.laporanBulanan.produkTerlarisCountPrev) / data.laporanBulanan.produkTerlarisCountPrev * 100).toFixed(1))}% dari periode sebelumnya`
                                    } : undefined}
                                    icon={faShoppingBasket}
                                    color="orange"
                                />
                                <SummaryCard
                                    title="Tren Penjualan"
                                    value={data.laporanBulanan.trendPendapatanPercent >= 0 ? "Naik" : data.laporanBulanan.trendPendapatanPercent < 0 ? "Turun" : "Tetap"}
                                    trend={{
                                        value: data.laporanBulanan.trendPendapatanPercent || 0,
                                        text: `${Math.abs(data.laporanBulanan.trendPendapatanPercent || 0).toFixed(1)}% dari 30 hari sebelumnya`,
                                        color: data.laporanBulanan.trendPendapatanPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                    }}
                                    icon={faChartLine}
                                    color="purple"
                                />
                                <SummaryCard
                                    title="Staff Paling Produktif"
                                    value={data.laporanBulanan.staffPalingProduktif}
                                    additionalText={data.laporanBulanan.staffPalingProduktifPendapatan > 0 ? {
                                        icon: faUser,
                                        text: `${formatRupiah(data.laporanBulanan.staffPalingProduktifPendapatan)} pendapatan`
                                    } : undefined}
                                    trend={data.laporanBulanan.staffPalingProduktifPendapatanPrev > 0 ? {
                                        value: data.laporanBulanan.staffPalingProduktifPendapatan > data.laporanBulanan.staffPalingProduktifPendapatanPrev ?
                                            ((data.laporanBulanan.staffPalingProduktifPendapatan - data.laporanBulanan.staffPalingProduktifPendapatanPrev) / data.laporanBulanan.staffPalingProduktifPendapatanPrev * 100) :
                                            -((data.laporanBulanan.staffPalingProduktifPendapatanPrev - data.laporanBulanan.staffPalingProduktifPendapatan) / data.laporanBulanan.staffPalingProduktifPendapatanPrev * 100),
                                        text: data.laporanBulanan.staffPalingProduktifPendapatan > data.laporanBulanan.staffPalingProduktifPendapatanPrev ?
                                            `+${(((data.laporanBulanan.staffPalingProduktifPendapatan - data.laporanBulanan.staffPalingProduktifPendapatanPrev) / data.laporanBulanan.staffPalingProduktifPendapatanPrev * 100).toFixed(1))}% vs periode sebelumnya` :
                                            `${(((data.laporanBulanan.staffPalingProduktifPendapatan - data.laporanBulanan.staffPalingProduktifPendapatanPrev) / data.laporanBulanan.staffPalingProduktifPendapatanPrev * 100).toFixed(1))}% vs periode sebelumnya`
                                    } : undefined}
                                    icon={faUser}
                                    color="teal"
                                />
                                <SummaryCard
                                    title="Staff Paling Sedikit Kontribusi"
                                    value={data.laporanBulanan.staffPalingSedikitKontribusi}
                                    additionalText={data.laporanBulanan.staffPalingSedikitKontribusiPendapatan >= 0 ? {
                                        icon: faUser,
                                        text: `${formatRupiah(data.laporanBulanan.staffPalingSedikitKontribusiPendapatan)} pendapatan`
                                    } : undefined}
                                    trend={data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev >= 0 ? {
                                        value: data.laporanBulanan.staffPalingSedikitKontribusiPendapatan > data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev ?
                                            ((data.laporanBulanan.staffPalingSedikitKontribusiPendapatan - data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev) / (data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev || 1) * 100) :
                                            -((data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev - data.laporanBulanan.staffPalingSedikitKontribusiPendapatan) / (data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev || 1) * 100),
                                        text: data.laporanBulanan.staffPalingSedikitKontribusiPendapatan > data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev ?
                                            `+${(((data.laporanBulanan.staffPalingSedikitKontribusiPendapatan - data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev) / (data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev || 1) * 100).toFixed(1))}% vs periode sebelumnya` :
                                            `${(((data.laporanBulanan.staffPalingSedikitKontribusiPendapatan - data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev) / (data.laporanBulanan.staffPalingSedikitKontribusiPendapatanPrev || 1) * 100).toFixed(1))}% vs periode sebelumnya`
                                    } : undefined}
                                    icon={faUser}
                                    color="red"
                                />
                            </div>
                        </SectionContainer>

                        {/* Performa Staff Bulanan - FIXED TABLE SCROLL */}
                        <SectionContainer title="Performa Staff Bulanan">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Nama Staff</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Shift</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Pendapatan</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Profit</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Transaksi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Produk Terjual</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rata-rata Transaksi</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {comprehensiveReport && comprehensiveReport.staffReports ? (
                                            comprehensiveReport.staffReports.map(staffReport => {
                                                const staffInfo = data.staffList.find(s => s.id === staffReport.current.staffId) || {};
                                                // Fixed: Handle null/undefined values for rata-rata
                                                const rataRataTransaksi = staffReport.current.totalTransaksi > 0
                                                    ? staffReport.current.totalPenjualan / staffReport.current.totalTransaksi
                                                    : 0;

                                                return (
                                                    <tr key={staffReport.current.staffId} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3 border border-green-200">
                                                                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-green-700" />
                                                                </div>
                                                                <span className="font-medium text-gray-900">{staffReport.current.namaStaff}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{staffInfo.shift || 'Belum ditentukan'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatRupiah(staffReport.current.totalPenjualan || 0)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">{formatRupiah(staffReport.current.totalProfit || 0)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{staffReport.current.totalTransaksi || 0}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{staffReport.current.totalItemTerjual || 0}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {formatRupiah(rataRataTransaksi)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() => handleStaffClick({ id: staffReport.current.staffId, nama: staffReport.current.namaStaff })}
                                                                className="text-green-600 hover:text-green-900 font-medium hover:underline"
                                                            >
                                                                Detail
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            data.staffList.map(staff => (
                                                <tr key={staff.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3 border border-green-200">
                                                                <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-green-700" />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{staff.nama}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{staff.shift}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatRupiah(0)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">0</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">0</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatRupiah(0)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => handleStaffClick(staff)}
                                                            className="text-green-600 hover:text-green-900 font-medium hover:underline"
                                                        >
                                                            Detail
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </SectionContainer>
                    </div>
                )}

                {/* Konten Tab Grafik */}
                {activeTab === 'grafik' && (
                    <div className="space-y-6">
                        {/* Grafik Pendapatan */}
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Grafik Pendapatan</h3>
                                <div className="w-48">
                                    <CustomSelect
                                        name="dateFilter"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        options={[
                                            { value: 'hari', label: 'Hari Ini', icon: faCalendarDay },
                                            { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarWeek },
                                            { value: 'bulan', label: '30 Hari Terakhir', icon: faCalendarAlt }
                                        ]}
                                        placeholder="Pilih periode"
                                        icon={faCalendarAlt}
                                        size="sm"
                                    />
                                </div>
                            </div>
                            <div className="h-64">
                                <Line
                                    data={{
                                        labels: data.grafikPendapatan[dateFilter].labels,
                                        datasets: [{
                                            label: 'Pendapatan',
                                            data: data.grafikPendapatan[dateFilter].data,
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
                                            legend: {
                                                display: false
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        let label = context.dataset.label || '';
                                                        if (label) {
                                                            label += ': ';
                                                        }
                                                        if (context.parsed.y !== null) {
                                                            label += formatRupiah(context.parsed.y);
                                                        }
                                                        return label;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: false,
                                                ticks: {
                                                    callback: function (value) {
                                                        if (value >= 1000000) {
                                                            return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                                        }
                                                        return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Grafik Transaksi */}
                        {/* <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Grafik Transaksi</h3>
                                <div className="w-48">
                                    <CustomSelect
                                        name="dateFilter"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        options={[
                                            { value: 'hari', label: 'Hari Ini', icon: faCalendarDay },
                                            { value: 'minggu', label: '7 Hari Terakhir', icon: faCalendarWeek },
                                            { value: 'bulan', label: '30 Hari Terakhir', icon: faCalendarAlt }
                                        ]}
                                        placeholder="Pilih periode"
                                        icon={faCalendarAlt}
                                        size="sm"
                                    />
                                </div>
                            </div>
                            <div className="h-64">
                                <Bar
                                    data={{
                                        labels: data.grafikTransaksi[dateFilter].labels,
                                        datasets: [{
                                            label: 'Transaksi',
                                            data: data.grafikTransaksi[dateFilter].data,
                                            backgroundColor: '#16a34a',
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div> */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Grafik Produktivitas Shift */}
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Produktivitas per Shift</h3>
                                <div className="h-64">
                                    <Doughnut
                                        data={{
                                            labels: data.grafikProduktivitasShift.labels,
                                            datasets: [{
                                                data: data.grafikProduktivitasShift.data,
                                                backgroundColor: [
                                                    '#16a34a',
                                                    '#2563eb',
                                                    '#f59e0b'
                                                ],
                                                borderWidth: 0
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom'
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function (context) {
                                                            let label = context.label || '';
                                                            if (label) {
                                                                label += ': ';
                                                            }
                                                            if (context.parsed !== null) {
                                                                label += formatRupiah(context.parsed);
                                                            }
                                                            return label;
                                                        }
                                                    }
                                                }
                                            },
                                            cutout: '70%'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Perbandingan antar Staff</h3>
                                <div className="h-64">
                                    <Bar
                                        data={{
                                            labels: data.grafikPerbandinganStaff.labels,
                                            datasets: [{
                                                label: 'Pendapatan',
                                                data: data.grafikPerbandinganStaff.data,
                                                backgroundColor: '#16a34a',
                                                borderWidth: 0
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function (context) {
                                                            let label = context.dataset.label || '';
                                                            if (label) {
                                                                label += ': ';
                                                            }
                                                            if (context.parsed.y !== null) {
                                                                label += formatRupiah(context.parsed.y);
                                                            }
                                                            return label;
                                                        }
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        callback: function (value) {
                                                            if (value >= 1000000) {
                                                                return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                                            }
                                                            return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <StaffDetailModal />
            </div>
        </div>
    );
};

LaporanStaff.defaultProps = {
    formatRupiah: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },
    userName: "Admin"
};

export default LaporanStaff;