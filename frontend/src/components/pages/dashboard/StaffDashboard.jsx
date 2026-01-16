// DashboardStaff.js
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
  faSync,
  faCalendarAlt,
  faTable,
  faFilter,
  faTimes,
  faFileAlt,
  faFilePdf,
  faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import { produkAPI, staffReportAPI } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../common/ToastContainer';
import CustomSelect from '../../common/CustomSelect';
// Import library untuk export
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
import { Line, Bar } from 'react-chartjs-2';

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

const DashboardStaff = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [reportData, setReportData] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // PERBAIKAN: Inisialisasi state dengan bulan dan tahun saat ini
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [monthlyTrendData, setMonthlyTrendData] = useState(null);
  const [shiftData, setShiftData] = useState(null);

  // Dates for today
  const today = new Date().toISOString().split('T')[0];

  // Load staff report data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update time every minute (hanya untuk update waktu, tidak refresh data)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update setiap menit

    return () => clearInterval(timer);
  }, []);

  // PERBAIKAN: useEffect untuk memuat data bulanan saat modal dibuka atau filter berubah
  useEffect(() => {
    // Hanya jalankan jika modal terbuka
    if (showDetailModal) {
      loadMonthlyReportData();
    }
  }, [showDetailModal, selectedMonth, selectedYear]); // Tambahkan dependensi agar dijalankan saat modal dibuka

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

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load staff report for today
      const report = await staffReportAPI.getReport(user.id, today, today);
      setReportData(report);

      // Load low stock products
      try {
        const allProducts = await produkAPI.getAll();
        const lowStock = allProducts.filter(p => p.stok < 20 && p.stok > 0);
        setLowStockProducts(lowStock.slice(0, 5)); // Only show first 5
      } catch (error) {
        console.error('Error loading products:', error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('error', 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // PERBAIKAN: Fungsi untuk memuat data bulanan yang benar untuk grafik dan tabel
  const loadMonthlyReportData = async () => {
    setLoadingDetail(true);
    try {
      // PERBAIKAN: Fungsi helper untuk format tanggal tanpa masalah timezone
      const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Tentukan tanggal awal dan akhir dengan lebih jelas
      // startDate adalah hari pertama dari bulan yang dipilih (jam 00:00:00)
      const startDate = new Date(selectedYear, selectedMonth, 1);

      // endDate adalah hari terakhir dari bulan yang dipilih (jam 23:59:59)
      // Cara yang paling andal: buat tanggal untuk bulan depan, hari ke-0, lalu set waktunya ke akhir hari
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

      // PERBAIKAN: Gunakan formatDateLocal untuk menghindari masalah timezone
      const startDateStr = formatDateLocal(startDate);
      const endDateStr = formatDateLocal(endDate);

      console.log('[STAFF DASHBOARD] Loading monthly report for staff:', user.id, 'from', startDateStr, 'to', endDateStr);

      // Load monthly data with trend (vs previous month)
      const trendReport = await staffReportAPI.getWithMonthlyTrend(user.id, startDateStr, endDateStr);
      console.log('[STAFF DASHBOARD] Trend report received:', trendReport);
      setMonthlyTrendData(trendReport);

      // Load monthly data for logged-in staff
      const detailReport = await staffReportAPI.getReportDetail(user.id, startDateStr, endDateStr);
      console.log('[STAFF DASHBOARD] Detail report received:', detailReport);

      // Load shift data
      const shiftDataResult = await staffReportAPI.getStaffShiftData(user.id, startDateStr, endDateStr);
      console.log('[STAFF DASHBOARD] Shift data received:', shiftDataResult);
      setShiftData(shiftDataResult);

      // Inisialisasi data harian untuk SEMUA hari dalam bulan
      const dailyMap = {};

      // Dapatkan jumlah hari dalam bulan yang dipilih
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

      // Loop dari hari ke-1 hingga hari terakhir bulan tersebut
      for (let i = 1; i <= daysInMonth; i++) {
        // Buat objek Date untuk setiap hari
        const date = new Date(selectedYear, selectedMonth, i);
        // PERBAIKAN: Gunakan formatDateLocal untuk menghindari masalah timezone
        const dateStr = formatDateLocal(date);

        // Inisialisasi data untuk setiap hari dengan nilai 0
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
          // PERBAIKAN: Gunakan formatDateLocal untuk menghindari masalah timezone
          const dateStr = formatDateLocal(new Date(t.tanggal));
          // Jika tanggal transaksi ada dalam peta harian kita
          if (dailyMap[dateStr]) {
            // Tambahkan total dan jumlah transaksi
            dailyMap[dateStr].totalBelanja += t.total || 0;
            dailyMap[dateStr].totalTransaksi += 1;
          }
        });
      }

      // Populate item counts from itemCountsByDate
      if (detailReport?.itemCountsByDate) {
        Object.entries(detailReport.itemCountsByDate).forEach(([dateStr, itemCount]) => {
          // PERBAIKAN: Normalisasi format tanggal untuk memastikan konsistensi
          // Jika dateStr tidak dalam format YYYY-MM-DD, konversi terlebih dahulu
          let normalizedDateStr = dateStr;
          if (dateStr.includes('T')) {
            normalizedDateStr = dateStr.split('T')[0];
          }

          // Jika tanggal dari itemCount ada dalam peta harian kita
          if (dailyMap[normalizedDateStr]) {
            // Set jumlah produk terjual
            dailyMap[normalizedDateStr].produkTerjual = itemCount;
          }
        });
      }

      // Convert to array and sort by date
      const dailyData = Object.values(dailyMap).sort((a, b) =>
        new Date(a.tanggal) - new Date(b.tanggal)
      );

      setMonthlyReportData(dailyData);
    } catch (error) {
      console.error('Error loading monthly report data:', error);
      showToast('error', 'Gagal memuat data laporan bulanan');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'Rb';
    return num.toString();
  };

  // Calculate average per transaction
  const averagePerTransaction = reportData && reportData.totalTransaksi > 0
    ? reportData.totalPenjualan / reportData.totalTransaksi
    : 0;

  // Calculate monthly totals
  const calculateMonthlyTotals = () => {
    return monthlyReportData.reduce((acc, day) => ({
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

  // Generate tahun options (3 tahun sebelumnya dan 3 tahun ke depan)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear - 3; year <= currentYear + 3; year++) {
    yearOptions.push(year);
  }

  // TAMBAHAN: Fungsi untuk export ke PDF (hanya tabel Laporan Harian) - FIXED VERSION
  const exportToPDF = () => {
    try {
      console.log('[EXPORT PDF] Starting export process...');
      console.log('[EXPORT PDF] Monthly report data:', monthlyReportData);
      console.log('[EXPORT PDF] Monthly totals:', monthlyTotals);

      // Validasi data
      if (!monthlyReportData || monthlyReportData.length === 0) {
        showToast('error', 'Tidak ada data untuk diekspor');
        return;
      }

      // Buat instance jsPDF dengan orientasi landscape
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      console.log('[EXPORT PDF] PDF document created');

      // Tambahkan judul
      doc.setFontSize(20);
      doc.text('Laporan Harian Staff', 14, 15);
      doc.setFontSize(12);
      doc.text(`Bulan: ${monthNames[selectedMonth]} ${selectedYear}`, 14, 25);
      doc.text(`Staff: ${user?.namaLengkap || 'Staff'}`, 14, 35);
      doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 14, 45);

      // Siapkan data untuk tabel
      const tableColumn = ["Tanggal", "Hari", "Total Belanja", "Total Transaksi", "Produk Terjual", "Rata-rata/Transaksi"];
      const tableRows = monthlyReportData.map((day, index) => {
        try {
          const date = new Date(day.tanggal);
          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const dayName = dayNames[date.getDay()];
          const rataRata = day.totalTransaksi > 0 ? day.totalBelanja / day.totalTransaksi : 0;

          return [
            `${date.getDate()} ${monthNames[selectedMonth]} ${selectedYear}`,
            dayName,
            formatRupiah(day.totalBelanja),
            day.totalTransaksi.toString(),
            day.produkTerjual.toString(),
            formatRupiah(rataRata)
          ];
        } catch (error) {
          console.error('[EXPORT PDF] Error processing row:', error, day);
          return ['Error', 'Error', '0', '0', '0', '0'];
        }
      });

      // Tambahkan baris total
      try {
        tableRows.push([
          'TOTAL',
          '-',
          formatRupiah(monthlyTotals.totalBelanja),
          monthlyTotals.totalTransaksi.toString(),
          monthlyTotals.produkTerjual.toString(),
          formatRupiah(monthlyTotals.totalTransaksi > 0 ? monthlyTotals.totalBelanja / monthlyTotals.totalTransaksi : 0)
        ]);
      } catch (error) {
        console.error('[EXPORT PDF] Error adding total row:', error);
      }

      console.log('[EXPORT PDF] Table data prepared:', tableRows);

      // Tambahkan tabel
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 55,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [21, 128, 61],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        // Style untuk baris total
        didParseCell: function (data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = 0;
          }
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Tanggal
          1: { cellWidth: 25 }, // Hari
          2: { cellWidth: 40 }, // Total Belanja
          3: { cellWidth: 25 }, // Total Transaksi
          4: { cellWidth: 25 }, // Produk Terjual
          5: { cellWidth: 40 }  // Rata-rata
        }
      });

      console.log('[EXPORT PDF] Table added to PDF');

      // Generate blob dan download
      try {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        // Buat link untuk download
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `Laporan_Harian_Staff_${monthNames[selectedMonth]}_${selectedYear}.pdf`;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Cleanup
        URL.revokeObjectURL(url);

        console.log('[EXPORT PDF] Download triggered');
        showToast('success', 'PDF berhasil diunduh');
      } catch (error) {
        console.error('[EXPORT PDF] Error during download:', error);

        // Fallback: save langsung
        try {
          doc.save(`Laporan_Harian_Staff_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
          console.log('[EXPORT PDF] Fallback save triggered');
          showToast('success', 'PDF berhasil diunduh (fallback)');
        } catch (fallbackError) {
          console.error('[EXPORT PDF] Fallback also failed:', fallbackError);
          showToast('error', 'Gagal mengekspor PDF. Silakan coba lagi.');
        }
      }
    } catch (error) {
      console.error('[EXPORT PDF] General error:', error);
      showToast('error', 'Terjadi kesalahan saat mengekspor PDF');
    }
  };

  // TAMBAHAN: Fungsi untuk export ke Excel (hanya tabel Laporan Harian) - FIXED VERSION
  const exportToExcel = () => {
    try {
      console.log('[EXPORT EXCEL] Starting export process...');

      // Validasi data
      if (!monthlyReportData || monthlyReportData.length === 0) {
        showToast('error', 'Tidak ada data untuk diekspor');
        return;
      }

      // Buat worksheet untuk laporan harian
      const detailData = [
        ['LAPORAN HARIAN STAFF'],
        ['Staff:', user?.namaLengkap || 'Staff'],
        ['Bulan:', monthNames[selectedMonth]],
        ['Tahun:', selectedYear],
        ['Tanggal Export:', new Date().toLocaleDateString('id-ID')],
        [],
        ['Tanggal', 'Hari', 'Total Belanja', 'Total Transaksi', 'Produk Terjual', 'Rata-rata/Transaksi']
      ];

      monthlyReportData.forEach((day) => {
        try {
          const date = new Date(day.tanggal);
          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const dayName = dayNames[date.getDay()];
          const rataRata = day.totalTransaksi > 0 ? day.totalBelanja / day.totalTransaksi : 0;

          detailData.push([
            `${date.getDate()} ${monthNames[selectedMonth]} ${selectedYear}`,
            dayName,
            day.totalBelanja,
            day.totalTransaksi,
            day.produkTerjual,
            rataRata
          ]);
        } catch (error) {
          console.error('[EXPORT EXCEL] Error processing row:', error, day);
        }
      });

      // Tambahkan baris total
      detailData.push([
        'TOTAL',
        '-',
        monthlyTotals.totalBelanja,
        monthlyTotals.totalTransaksi,
        monthlyTotals.produkTerjual,
        monthlyTotals.totalTransaksi > 0 ? monthlyTotals.totalBelanja / monthlyTotals.totalTransaksi : 0
      ]);

      console.log('[EXPORT EXCEL] Data prepared');

      // Buat worksheet
      const ws = XLSX.utils.aoa_to_sheet(detailData);

      // Style untuk header
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let i = 0; i < 6; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFFFAA00" } }
        };
      }

      // Style untuk baris total
      const totalRow = detailData.length - 1;
      for (let i = 0; i < 6; i++) {
        const cellAddress = XLSX.utils.encode_cell({ r: totalRow, c: i });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFDDDDDD" } }
        };
      }

      // Buat workbook dan simpan
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Harian');

      // Export dengan beberapa metode
      try {
        XLSX.writeFile(wb, `Laporan_Harian_Staff_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
        console.log('[EXPORT EXCEL] Export successful');
        showToast('success', 'Excel berhasil diunduh');
      } catch (error) {
        console.error('[EXPORT EXCEL] Export failed:', error);
        showToast('error', 'Gagal mengekspor Excel');
      }
    } catch (error) {
      console.error('[EXPORT EXCEL] General error:', error);
      showToast('error', 'Terjadi kesalahan saat mengekspor Excel');
    }
  };

  // Komponen Kartu Statistik
  const StatCard = ({ title, value, icon, isCurrency = false, badge, colorClass = "green" }) => (
    <div className="bg-white rounded-xl shadow-md p-6 card-hover border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-12 h-12 bg-${colorClass}-100 rounded-full flex items-center justify-center mr-3 border border-${colorClass}-200`}>
            <FontAwesomeIcon icon={icon} className={`h-6 w-6 text-${colorClass}-700`} />
          </div>
          <div>
            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {isCurrency ? formatRupiah(value) : value}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-300">
          {badge}
        </span>
      </div>
    </div>
  );

  // Komponen Item Stok Menipis
  const LowStockItem = ({ produk }) => {
    const stockColor = produk.stok < 10 ? 'text-red-600' : 'text-orange-600';
    return (
      <div className="flex items-center p-2 border border-gray-200 rounded-lg card-hover hover:shadow-md transition-all duration-200 hover:border-green-300">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 border border-orange-200">
          <FontAwesomeIcon icon={faBoxOpen} className="h-6 w-6 text-orange-600" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-800 text-sm">{produk.nama}</h4>
              <p className="text-xs text-gray-500">{produk.kategori || 'Produk'}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${stockColor}`}>
                Stok: {Number(produk.stok).toFixed(1)} {produk.satuan || 'pcs'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Komponen Modal Detail Laporan Staff - FIXED SCROLL BUG
  const StaffDetailModal = () => {
    if (!showDetailModal) return null;

    // Simpan posisi scroll saat modal dibuka
    useEffect(() => {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }, [showDetailModal]);

    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header yang sticky */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-gray-800">Detail Laporan Saya - {user?.namaLengkap || 'Staff'}</h2>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
            </button>
          </div>

          {/* Content area dengan scroll */}
          <div className="flex-1 overflow-y-auto p-6">
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
                <div className="md:col-span-2">
                  <button
                    onClick={loadMonthlyReportData}
                    disabled={loadingDetail}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <FontAwesomeIcon icon={faSync} className={`mr-2 ${loadingDetail ? 'animate-spin' : ''}`} />
                    Tampilkan Data
                  </button>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-grow">
                      <p className="text-sm text-green-600 font-medium">Total Pendapatan</p>
                      <p className="text-2xl font-bold text-green-800">{formatRupiah(monthlyTotals.totalBelanja)}</p>
                    </div>
                    <FontAwesomeIcon icon={faMoneyBillWave} className="h-8 w-8 text-green-600" />
                  </div>
                  {monthlyTrendData && (
                    <div className="flex items-center text-xs">
                      {monthlyTrendData.trendPenjualan === 'naik' ? (
                        <>
                          <FontAwesomeIcon icon={faArrowUp} className="text-green-600 mr-1" />
                          <span className="text-green-600 font-medium">
                            +{Math.abs(monthlyTrendData.percentChange).toFixed(1)}% vs bulan lalu
                          </span>
                        </>
                      ) : monthlyTrendData.trendPenjualan === 'turun' ? (
                        <>
                          <FontAwesomeIcon icon={faArrowDown} className="text-red-600 mr-1" />
                          <span className="text-red-600 font-medium">
                            -{Math.abs(monthlyTrendData.percentChange).toFixed(1)}% vs bulan lalu
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-600 font-medium">Sama dengan bulan lalu</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-grow">
                      <p className="text-sm text-blue-600 font-medium">Total Transaksi</p>
                      <p className="text-2xl font-bold text-blue-800">{monthlyTotals.totalTransaksi}</p>
                    </div>
                    <FontAwesomeIcon icon={faReceipt} className="h-8 w-8 text-blue-600" />
                  </div>
                  {monthlyTrendData && (
                    <div className="flex items-center text-xs">
                      {monthlyTrendData.trendTransaksi === 'naik' ? (
                        <>
                          <FontAwesomeIcon icon={faArrowUp} className="text-green-600 mr-1" />
                          <span className="text-green-600 font-medium">
                            Naik vs bulan lalu ({monthlyTrendData.previous?.totalTransaksi || 0})
                          </span>
                        </>
                      ) : monthlyTrendData.trendTransaksi === 'turun' ? (
                        <>
                          <FontAwesomeIcon icon={faArrowDown} className="text-red-600 mr-1" />
                          <span className="text-red-600 font-medium">
                            Turun vs bulan lalu ({monthlyTrendData.previous?.totalTransaksi || 0})
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-600 font-medium">Sama dengan bulan lalu</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-grow">
                      <p className="text-sm text-orange-600 font-medium">Produk Terjual</p>
                      <p className="text-2xl font-bold text-orange-800">{monthlyTotals.produkTerjual}</p>
                    </div>
                    <FontAwesomeIcon icon={faShoppingBasket} className="h-8 w-8 text-orange-600" />
                  </div>
                  {monthlyTrendData && monthlyTrendData.previous && (
                    <div className="flex items-center text-xs">
                      {monthlyTotals.produkTerjual > monthlyTrendData.previous.totalItemTerjual ? (
                        <>
                          <FontAwesomeIcon icon={faArrowUp} className="text-green-600 mr-1" />
                          <span className="text-green-600 font-medium">
                            Naik vs bulan lalu ({monthlyTrendData.previous.totalItemTerjual})
                          </span>
                        </>
                      ) : monthlyTotals.produkTerjual < monthlyTrendData.previous.totalItemTerjual ? (
                        <>
                          <FontAwesomeIcon icon={faArrowDown} className="text-red-600 mr-1" />
                          <span className="text-red-600 font-medium">
                            Turun vs bulan lalu ({monthlyTrendData.previous.totalItemTerjual})
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-600 font-medium">Sama dengan bulan lalu</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grafik Performa Bulanan */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 mr-2 text-green-700" />
                Grafik Performa {monthNames[selectedMonth]} {selectedYear}
              </h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="h-64">
                  <Line
                    data={{
                      labels: monthlyReportData.map(day => {
                        const date = new Date(day.tanggal);
                        return `${date.getDate()} ${monthNames[selectedMonth]}`;
                      }),
                      datasets: [
                        {
                          label: 'Pendapatan Harian',
                          data: monthlyReportData.map(day => day.totalBelanja),
                          borderColor: '#15803d',
                          backgroundColor: 'rgba(21, 128, 61, 0.1)',
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 3,
                          pointHoverRadius: 5,
                          pointBackgroundColor: '#15803d',
                          yAxisID: 'y'
                        },
                        {
                          label: 'Jumlah Transaksi',
                          data: monthlyReportData.map(day => day.totalTransaksi),
                          borderColor: '#2563eb',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 3,
                          pointHoverRadius: 5,
                          pointBackgroundColor: '#2563eb',
                          yAxisID: 'y1'
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.parsed.y !== null) {
                                if (context.datasetIndex === 0) {
                                  label += formatRupiah(context.parsed.y);
                                } else {
                                  label += context.parsed.y + ' transaksi';
                                }
                              }
                              return label;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          ticks: {
                            callback: function (value) {
                              if (value >= 1000000) {
                                return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                              }
                              return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                            }
                          }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Grafik Performa Produktivitas per Shift */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FontAwesomeIcon icon={faClock} className="h-5 w-5 mr-2 text-green-700" />
                Performa Produktivitas per Shift - {monthNames[selectedMonth]} {selectedYear}
              </h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="mb-3 text-sm text-gray-600">
                  <p><strong>Shift Pagi:</strong> 06:00 - 14:00</p>
                  <p><strong>Shift Sore:</strong> 14:00 - 22:00</p>
                  <p><strong>Shift Malam:</strong> 22:00 - 06:00</p>
                </div>
                {shiftData ? (
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: ['Pagi (06:00-14:00)', 'Sore (14:00-22:00)', 'Malam (22:00-06:00)'],
                        datasets: [
                          {
                            label: 'Jumlah Transaksi',
                            data: [
                              shiftData.Pagi?.jumlahTransaksi || 0,
                              shiftData.Sore?.jumlahTransaksi || 0,
                              shiftData.Malam?.jumlahTransaksi || 0
                            ],
                            backgroundColor: 'rgba(37, 99, 235, 0.6)',
                            borderColor: '#2563eb',
                            borderWidth: 1,
                            yAxisID: 'y1'
                          },
                          {
                            label: 'Total Penjualan (Rp)',
                            data: [
                              shiftData.Pagi?.totalPenjualan || 0,
                              shiftData.Sore?.totalPenjualan || 0,
                              shiftData.Malam?.totalPenjualan || 0
                            ],
                            backgroundColor: 'rgba(21, 128, 61, 0.6)',
                            borderColor: '#15803d',
                            borderWidth: 1,
                            yAxisID: 'y'
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                  label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                  if (context.datasetIndex === 1) {
                                    label += formatRupiah(context.parsed.y);
                                  } else {
                                    label += context.parsed.y + ' transaksi';
                                  }
                                }
                                return label;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Total Penjualan (Rp)'
                            },
                            ticks: {
                              callback: function (value) {
                                if (value >= 1000000) {
                                  return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                }
                                return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                              }
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Jumlah Transaksi'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                          },
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Data shift belum tersedia</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grafik Transaksi Harian */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FontAwesomeIcon icon={faReceipt} className="h-5 w-5 mr-2 text-green-700" />
                Grafik Transaksi Harian - {monthNames[selectedMonth]} {selectedYear}
              </h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="h-64">
                  <Bar
                    data={{
                      labels: monthlyReportData.map(day => {
                        const date = new Date(day.tanggal);
                        return `${date.getDate()} ${monthNames[selectedMonth]}`;
                      }),
                      datasets: [
                        {
                          label: 'Jumlah Transaksi',
                          data: monthlyReportData.map(day => day.totalTransaksi),
                          backgroundColor: 'rgba(37, 99, 235, 0.6)',
                          borderColor: '#2563eb',
                          borderWidth: 1,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function (context) {
                              return 'Jumlah Transaksi: ' + context.parsed.y;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          },
                          title: {
                            display: true,
                            text: 'Jumlah Transaksi'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Tanggal'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tombol Export */}
            <div className="mb-6 flex justify-end space-x-4">
              {/* <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
                Export PDF
              </button> */}
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                Export Excel
              </button>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Transaksi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Produk Terjual</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Rata-rata/Transaksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {monthlyReportData.map((day, index) => {
                      const date = new Date(day.tanggal);
                      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                      const dayName = dayNames[date.getDay()];
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
                      {formatRupiah(monthlyReportData.length > 0 ? monthlyTotals.totalBelanja / monthlyReportData.length : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaksi/Hari:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {monthlyReportData.length > 0 ? (monthlyTotals.totalTransaksi / monthlyReportData.length).toFixed(1) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Produk/Hari:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {monthlyReportData.length > 0 ? (monthlyTotals.produkTerjual / monthlyReportData.length).toFixed(1) : 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Hari Terbaik</h4>
                {monthlyReportData.length > 0 ? (() => {
                  const bestDay = monthlyReportData.reduce((best, current) =>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-6 md:p-8 overflow-x-hidden">
      <div className="max-w-full mx-auto space-y-8">
        {/* Header Dashboard Staff */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                <FontAwesomeIcon icon={faUsers} className="text-white text-3xl" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {greeting}, {user?.namaLengkap || 'Staff'}!
                </h2>
                <p className="text-gray-600 mt-1">Dashboard Staff - Monitor aktivitas harian Anda</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faSync} className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* MODIFIED: Container untuk Ringkasan Harian dan Link Laporan */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Ringkasan Harian</h3>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setShowDetailModal(true); }}
              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center transition-colors"
            >
              <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
              Lihat Laporan Saya
            </a>
          </div>

          {/* 4 Card Summary Harian - Diubah menjadi 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Transaksi Dilayani"
              value={reportData?.totalTransaksi || 0}
              icon={faReceipt}
              badge="Hari ini"
              colorClass="blue"
            />
            <StatCard
              title="Produk Terjual"
              value={reportData?.totalItemTerjual || 0}
              icon={faShoppingBasket}
              badge="Hari ini"
              colorClass="purple"
            />
            <StatCard
              title="Rata-Rata Transaksi"
              value={averagePerTransaction}
              icon={faMoneyBillWave}
              isCurrency={true}
              badge="Hari ini"
              colorClass="green"
            />
            <StatCard
              title="Total Penjualan"
              value={reportData?.totalPenjualan || 0}
              icon={faMoneyBillWave}
              isCurrency={true}
              badge="Hari ini"
              colorClass="green"
            />
          </div>
        </div>

        {/* Info Card */}
        {reportData && reportData.totalTransaksi > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faChartLine} className="text-green-600 mt-1 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-green-800 mb-1">
                  Performa Hari Ini
                </h3>
                <p className="text-sm text-green-700">
                  Anda telah melayani <strong>{reportData.totalTransaksi}</strong> transaksi
                  dengan total penjualan <strong>{formatRupiah(reportData.totalPenjualan)}</strong>.
                  Rata-rata per transaksi: <strong>{formatRupiah(averagePerTransaction)}</strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faClock} className="text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-blue-800 mb-1">
                  Belum Ada Transaksi
                </h3>
                <p className="text-sm text-blue-700">
                  Anda belum melakukan transaksi hari ini. Data akan ditampilkan setelah Anda melakukan transaksi pertama.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stok Menipis */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 border border-orange-200">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-orange-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Stok Menipis</h3>
              </div>
              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                {lowStockProducts.length} Produk
              </span>
            </div>
            <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '300px' }}>
              <div className="space-y-2">
                {lowStockProducts.map(produk => (
                  <LowStockItem key={produk.id} produk={produk} />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal Detail Laporan Staff */}
      <StaffDetailModal />
    </div>
  );
};

export default DashboardStaff;