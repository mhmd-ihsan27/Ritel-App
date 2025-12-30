// src/data/laporanStaffData.js

export const data = {
    ringkasanHarian: {
        totalPendapatan: 12450000,
        totalTransaksi: 234,
        totalProdukTerjual: 1256,
        totalRefund: 580000,
        rataRataTransaksi: 53205
    },
    staffList: [
        {
            id: 1,
            nama: 'Ahmad Sutrisno',
            shift: 'Pagi (08:00-16:00)',
            totalPendapatan: 3250000,
            totalTransaksi: 62,
            produkTerjual: 324,
            akurasiInput: 98.5,
            waktuLogin: '08:00',
            waktuLogout: '16:02',
            status: 'aktif',
            jamKerja: '8 jam 2 menit',
            rataRataTransaksiPerJam: 7.6,
            aktivitas: [
                { id: 1, waktu: '08:00', aktivitas: 'Login', detail: 'Sistem kasir' },
                { id: 2, waktu: '10:30', aktivitas: 'Restock', detail: 'Sayuran segar' },
                { id: 3, waktu: '12:15', aktivitas: 'Istirahat', detail: 'Makan siang' },
                { id: 4, waktu: '16:02', aktivitas: 'Logout', detail: 'Selesai shift' }
            ],
            transaksi: [
                { id: 'TRX001', waktu: '08:45', pelanggan: 'Budi Santoso', total: 125000, metode: 'Tunai' },
                { id: 'TRX002', waktu: '09:15', pelanggan: 'Siti Nurhaliza', total: 87500, metode: 'E-Wallet' },
                { id: 'TRX003', waktu: '10:30', pelanggan: 'Joko Widodo', total: 215000, metode: 'Debit' },
                { id: 'TRX004', waktu: '11:45', pelanggan: 'Rina Amelia', total: 67000, metode: 'Kredit' },
                { id: 'TRX005', waktu: '13:20', pelanggan: 'Fajar Nugroho', total: 98000, metode: 'Tunai' }
            ]
        },
        {
            id: 2,
            nama: 'Dewi Lestari',
            shift: 'Siang (16:00-00:00)',
            totalPendapatan: 4150000,
            totalTransaksi: 78,
            produkTerjual: 412,
            akurasiInput: 99.2,
            waktuLogin: '15:58',
            waktuLogout: '00:05',
            status: 'aktif',
            jamKerja: '8 jam 7 menit',
            rataRataTransaksiPerJam: 9.6,
            aktivitas: [
                { id: 1, waktu: '15:58', aktivitas: 'Login', detail: 'Sistem kasir' },
                { id: 2, waktu: '18:30', aktivitas: 'Restock', detail: 'Buah-buahan' },
                { id: 3, waktu: '20:15', aktivitas: 'Istirahat', detail: 'Makan malam' },
                { id: 4, waktu: '00:05', aktivitas: 'Logout', detail: 'Selesai shift' }
            ],
            transaksi: [
                { id: 'TRX006', waktu: '16:15', pelanggan: 'Andi Pratama', total: 145000, metode: 'Tunai' },
                { id: 'TRX007', waktu: '17:30', pelanggan: 'Maya Sari', total: 98000, metode: 'E-Wallet' },
                { id: 'TRX008', waktu: '18:45', pelanggan: 'Rudi Hermawan', total: 187000, metode: 'Debit' },
                { id: 'TRX009', waktu: '20:30', pelanggan: 'Lisa Permata', total: 76000, metode: 'Kredit' },
                { id: 'TRX010', waktu: '22:15', pelanggan: 'Doni Kusuma', total: 112000, metode: 'Tunai' }
            ]
        },
        {
            id: 3,
            nama: 'Budi Santoso',
            shift: 'Malam (00:00-08:00)',
            totalPendapatan: 2850000,
            totalTransaksi: 54,
            produkTerjual: 289,
            akurasiInput: 97.8,
            waktuLogin: '00:02',
            waktuLogout: '08:05',
            status: 'aktif',
            jamKerja: '8 jam 3 menit',
            rataRataTransaksiPerJam: 6.7,
            aktivitas: [
                { id: 1, waktu: '00:02', aktivitas: 'Login', detail: 'Sistem kasir' },
                { id: 2, waktu: '02:30', aktivitas: 'Restock', detail: 'Minuman' },
                { id: 3, waktu: '04:15', aktivitas: 'Istirahat', detail: 'Makan tengah malam' },
                { id: 4, waktu: '08:05', aktivitas: 'Logout', detail: 'Selesai shift' }
            ],
            transaksi: [
                { id: 'TRX011', waktu: '00:45', pelanggan: 'Hendra Wijaya', total: 98000, metode: 'Tunai' },
                { id: 'TRX012', waktu: '02:15', pelanggan: 'Sarah Putri', total: 67000, metode: 'E-Wallet' },
                { id: 'TRX013', waktu: '03:30', pelanggan: 'Toni Rahman', total: 156000, metode: 'Debit' },
                { id: 'TRX014', waktu: '05:45', pelanggan: 'Nina Kartika', total: 89000, metode: 'Kredit' },
                { id: 'TRX015', waktu: '07:20', pelanggan: 'Eko Prasetyo', total: 134000, metode: 'Tunai' }
            ]
        },
        {
            id: 4,
            nama: 'Siti Nurhaliza',
            shift: 'Pagi (08:00-16:00)',
            totalPendapatan: 2200000,
            totalTransaksi: 40,
            produkTerjual: 231,
            akurasiInput: 98.9,
            waktuLogin: '07:55',
            waktuLogout: '16:10',
            status: 'tidak aktif',
            jamKerja: '8 jam 15 menit',
            rataRataTransaksiPerJam: 4.9,
            aktivitas: [
                { id: 1, waktu: '07:55', aktivitas: 'Login', detail: 'Sistem kasir' },
                { id: 2, waktu: '10:00', aktivitas: 'Restock', detail: 'Daging' },
                { id: 3, waktu: '12:30', aktivitas: 'Istirahat', detail: 'Makan siang' },
                { id: 4, waktu: '16:10', aktivitas: 'Logout', detail: 'Selesai shift' }
            ],
            transaksi: [
                { id: 'TRX016', waktu: '08:30', pelanggan: 'Rizki Ahmad', total: 115000, metode: 'Tunai' },
                { id: 'TRX017', waktu: '09:45', pelanggan: 'Diana Permata', total: 78000, metode: 'E-Wallet' },
                { id: 'TRX018', waktu: '11:15', pelanggan: 'Bambang Sutrisno', total: 195000, metode: 'Debit' },
                { id: 'TRX019', waktu: '13:30', pelanggan: 'Yuni Kartika', total: 87000, metode: 'Kredit' },
                { id: 'TRX020', waktu: '15:45', pelanggan: 'Fadli Zon', total: 123000, metode: 'Tunai' }
            ]
        }
    ],
    grafikPendapatan: {
        hari: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            data: [10500000, 11200000, 9800000, 12450000, 11800000, 13500000, 14200000]
        },
        minggu: {
            labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
            data: [45000000, 52000000, 48000000, 58000000]
        },
        bulan: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
            data: [125000000, 135000000, 142000000, 158000000, 165000000, 172000000]
        }
    },
    grafikTransaksi: {
        hari: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            data: [198, 212, 185, 234, 225, 256, 268]
        },
        minggu: {
            labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
            data: [850, 920, 875, 980]
        },
        bulan: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
            data: [3200, 3450, 3620, 3850, 4020, 4150]
        }
    },
    grafikProduktivitasShift: {
        labels: ['Pagi (08:00-16:00)', 'Siang (16:00-00:00)', 'Malam (00:00-08:00)'],
        data: [5450000, 4150000, 2850000]
    },
    grafikPerbandinganStaff: {
        labels: ['Ahmad Sutrisno', 'Dewi Lestari', 'Budi Santoso', 'Siti Nurhaliza'],
        data: [3250000, 4150000, 2850000, 2200000]
    },
    laporanBulanan: {
        totalPendapatan: 897000000,
        totalTransaksi: 18290,
        produkTerlaris: 'Buah-buahan',
        tren: 'naik',
        staffPalingProduktif: 'Dewi Lestari',
        staffPalingSedikitKontribusi: 'Siti Nurhaliza'
    }
};

// Data dummy untuk laporan bulanan staff
export const monthlyReportData = {
    1: [ // Ahmad Sutrisno - Januari 2024
        { tanggal: '2024-01-01', totalBelanja: 3250000, totalTransaksi: 62, produkTerjual: 324 },
        { tanggal: '2024-01-02', totalBelanja: 3100000, totalTransaksi: 58, produkTerjual: 298 },
        { tanggal: '2024-01-03', totalBelanja: 3400000, totalTransaksi: 65, produkTerjual: 345 },
        { tanggal: '2024-01-04', totalBelanja: 3280000, totalTransaksi: 61, produkTerjual: 312 },
        { tanggal: '2024-01-05', totalBelanja: 3350000, totalTransaksi: 63, produkTerjual: 328 },
        { tanggal: '2024-01-06', totalBelanja: 3800000, totalTransaksi: 72, produkTerjual: 398 },
        { tanggal: '2024-01-07', totalBelanja: 3950000, totalTransaksi: 75, produkTerjual: 412 },
        { tanggal: '2024-01-08', totalBelanja: 3200000, totalTransaksi: 60, produkTerjual: 305 },
        { tanggal: '2024-01-09', totalBelanja: 3150000, totalTransaksi: 59, produkTerjual: 295 },
        { tanggal: '2024-01-10', totalBelanja: 3450000, totalTransaksi: 66, produkTerjual: 355 },
        { tanggal: '2024-01-11', totalBelanja: 3300000, totalTransaksi: 62, produkTerjual: 320 },
        { tanggal: '2024-01-12', totalBelanja: 3420000, totalTransaksi: 64, produkTerjual: 335 },
        { tanggal: '2024-01-13', totalBelanja: 3750000, totalTransaksi: 70, produkTerjual: 385 },
        { tanggal: '2024-01-14', totalBelanja: 3900000, totalTransaksi: 74, produkTerjual: 405 },
        { tanggal: '2024-01-15', totalBelanja: 3180000, totalTransaksi: 60, produkTerjual: 302 },
        { tanggal: '2024-01-16', totalBelanja: 3120000, totalTransaksi: 58, produkTerjual: 290 },
        { tanggal: '2024-01-17', totalBelanja: 3480000, totalTransaksi: 67, produkTerjual: 362 },
        { tanggal: '2024-01-18', totalBelanja: 3320000, totalTransaksi: 63, produkTerjual: 325 },
        { tanggal: '2024-01-19', totalBelanja: 3380000, totalTransaksi: 64, produkTerjual: 332 },
        { tanggal: '2024-01-20', totalBelanja: 3850000, totalTransaksi: 73, produkTerjual: 395 },
        { tanggal: '2024-01-21', totalBelanja: 4000000, totalTransaksi: 76, produkTerjual: 418 },
        { tanggal: '2024-01-22', totalBelanja: 3220000, totalTransaksi: 61, produkTerjual: 308 },
        { tanggal: '2024-01-23', totalBelanja: 3170000, totalTransaksi: 59, produkTerjual: 292 },
        { tanggal: '2024-01-24', totalBelanja: 3500000, totalTransaksi: 68, produkTerjual: 368 },
        { tanggal: '2024-01-25', totalBelanja: 3340000, totalTransaksi: 63, produkTerjual: 322 },
        { tanggal: '2024-01-26', totalBelanja: 3360000, totalTransaksi: 64, produkTerjual: 330 },
        { tanggal: '2024-01-27', totalBelanja: 3780000, totalTransaksi: 71, produkTerjual: 388 },
        { tanggal: '2024-01-28', totalBelanja: 3920000, totalTransaksi: 74, produkTerjual: 408 },
        { tanggal: '2024-01-29', totalBelanja: 3250000, totalTransaksi: 62, produkTerjual: 315 },
        { tanggal: '2024-01-30', totalBelanja: 3280000, totalTransaksi: 62, produkTerjual: 318 },
        { tanggal: '2024-01-31', totalBelanja: 3600000, totalTransaksi: 68, produkTerjual: 372 }
    ],
    2: [ // Dewi Lestari - Januari 2024
        { tanggal: '2024-01-01', totalBelanja: 4150000, totalTransaksi: 78, produkTerjual: 412 },
        { tanggal: '2024-01-02', totalBelanja: 3980000, totalTransaksi: 75, produkTerjual: 395 },
        { tanggal: '2024-01-03', totalBelanja: 4280000, totalTransaksi: 82, produkTerjual: 445 },
        { tanggal: '2024-01-04', totalBelanja: 4120000, totalTransaksi: 78, produkTerjual: 405 },
        { tanggal: '2024-01-05', totalBelanja: 4200000, totalTransaksi: 80, produkTerjual: 418 },
        { tanggal: '2024-01-06', totalBelanja: 4850000, totalTransaksi: 92, produkTerjual: 498 },
        { tanggal: '2024-01-07', totalBelanja: 4950000, totalTransaksi: 95, produkTerjual: 512 },
        { tanggal: '2024-01-08', totalBelanja: 4050000, totalTransaksi: 77, produkTerjual: 395 },
        { tanggal: '2024-01-09', totalBelanja: 3950000, totalTransaksi: 75, produkTerjual: 385 },
        { tanggal: '2024-01-10', totalBelanja: 4350000, totalTransaksi: 83, produkTerjual: 455 },
        { tanggal: '2024-01-11', totalBelanja: 4180000, totalTransaksi: 79, produkTerjual: 410 },
        { tanggal: '2024-01-12', totalBelanja: 4250000, totalTransaksi: 81, produkTerjual: 425 },
        { tanggal: '2024-01-13', totalBelanja: 4780000, totalTransaksi: 90, produkTerjual: 485 },
        { tanggal: '2024-01-14', totalBelanja: 4900000, totalTransaksi: 94, produkTerjual: 505 },
        { tanggal: '2024-01-15', totalBelanja: 4080000, totalTransaksi: 77, produkTerjual: 392 },
        { tanggal: '2024-01-16', totalBelanja: 4020000, totalTransaksi: 76, produkTerjual: 390 },
        { tanggal: '2024-01-17', totalBelanja: 4420000, totalTransaksi: 84, produkTerjual: 462 },
        { tanggal: '2024-01-18', totalBelanja: 4220000, totalTransaksi: 80, produkTerjual: 415 },
        { tanggal: '2024-01-19', totalBelanja: 4280000, totalTransaksi: 81, produkTerjual: 422 },
        { tanggal: '2024-01-20', totalBelanja: 4850000, totalTransaksi: 93, produkTerjual: 495 },
        { tanggal: '2024-01-21', totalBelanja: 5000000, totalTransaksi: 96, produkTerjual: 518 },
        { tanggal: '2024-01-22', totalBelanja: 4120000, totalTransaksi: 78, produkTerjual: 398 },
        { tanggal: '2024-01-23', totalBelanja: 4070000, totalTransaksi: 77, produkTerjual: 392 },
        { tanggal: '2024-01-24', totalBelanja: 4500000, totalTransaksi: 86, produkTerjual: 468 },
        { tanggal: '2024-01-25', totalBelanja: 4240000, totalTransaksi: 80, produkTerjual: 412 },
        { tanggal: '2024-01-26', totalBelanja: 4260000, totalTransaksi: 81, produkTerjual: 420 },
        { tanggal: '2024-01-27', totalBelanja: 4780000, totalTransaksi: 91, produkTerjual: 488 },
        { tanggal: '2024-01-28', totalBelanja: 4920000, totalTransaksi: 94, produkTerjual: 508 },
        { tanggal: '2024-01-29', totalBelanja: 4150000, totalTransaksi: 78, produkTerjual: 405 },
        { tanggal: '2024-01-30', totalBelanja: 4180000, totalTransaksi: 79, produkTerjual: 408 },
        { tanggal: '2024-01-31', totalBelanja: 4600000, totalTransaksi: 88, produkTerjual: 472 }
    ],
    3: [ // Budi Santoso - Januari 2024
        { tanggal: '2024-01-01', totalBelanja: 2850000, totalTransaksi: 54, produkTerjual: 289 },
        { tanggal: '2024-01-02', totalBelanja: 2700000, totalTransaksi: 51, produkTerjual: 268 },
        { tanggal: '2024-01-03', totalBelanja: 3000000, totalTransaksi: 58, produkTerjual: 315 },
        { tanggal: '2024-01-04', totalBelanja: 2880000, totalTransaksi: 55, produkTerjual: 282 },
        { tanggal: '2024-01-05', totalBelanja: 2950000, totalTransaksi: 56, produkTerjual: 298 },
        { tanggal: '2024-01-06', totalBelanja: 3300000, totalTransaksi: 65, produkTerjual: 368 },
        { tanggal: '2024-01-07', totalBelanja: 3450000, totalTransaksi: 68, produkTerjual: 382 },
        { tanggal: '2024-01-08', totalBelanja: 2800000, totalTransaksi: 53, produkTerjual: 275 },
        { tanggal: '2024-01-09', totalBelanja: 2750000, totalTransaksi: 52, produkTerjual: 265 },
        { tanggal: '2024-01-10', totalBelanja: 3050000, totalTransaksi: 59, produkTerjual: 325 },
        { tanggal: '2024-01-11', totalBelanja: 2900000, totalTransaksi: 55, produkTerjual: 280 },
        { tanggal: '2024-01-12', totalBelanja: 2920000, totalTransaksi: 56, produkTerjual: 285 },
        { tanggal: '2024-01-13', totalBelanja: 3250000, totalTransaksi: 63, produkTerjual: 355 },
        { tanggal: '2024-01-14', totalBelanja: 3400000, totalTransaksi: 67, produkTerjual: 375 },
        { tanggal: '2024-01-15', totalBelanja: 2780000, totalTransaksi: 53, produkTerjual: 272 },
        { tanggal: '2024-01-16', totalBelanja: 2720000, totalTransaksi: 51, produkTerjual: 260 },
        { tanggal: '2024-01-17', totalBelanja: 3080000, totalTransaksi: 60, produkTerjual: 332 },
        { tanggal: '2024-01-18', totalBelanja: 2920000, totalTransaksi: 56, produkTerjual: 285 },
        { tanggal: '2024-01-19', totalBelanja: 2980000, totalTransaksi: 57, produkTerjual: 292 },
        { tanggal: '2024-01-20', totalBelanja: 3350000, totalTransaksi: 66, produkTerjual: 365 },
        { tanggal: '2024-01-21', totalBelanja: 3500000, totalTransaksi: 69, produkTerjual: 388 },
        { tanggal: '2024-01-22', totalBelanja: 2820000, totalTransaksi: 54, produkTerjual: 278 },
        { tanggal: '2024-01-23', totalBelanja: 2770000, totalTransaksi: 52, produkTerjual: 262 },
        { tanggal: '2024-01-24', totalBelanja: 3100000, totalTransaksi: 61, produkTerjual: 338 },
        { tanggal: '2024-01-25', totalBelanja: 2940000, totalTransaksi: 56, produkTerjual: 282 },
        { tanggal: '2024-01-26', totalBelanja: 2960000, totalTransaksi: 57, produkTerjual: 290 },
        { tanggal: '2024-01-27', totalBelanja: 3280000, totalTransaksi: 64, produkTerjual: 358 },
        { tanggal: '2024-01-28', totalBelanja: 3420000, totalTransaksi: 67, produkTerjual: 378 },
        { tanggal: '2024-01-29', totalBelanja: 2850000, totalTransaksi: 54, produkTerjual: 285 },
        { tanggal: '2024-01-30', totalBelanja: 2880000, totalTransaksi: 55, produkTerjual: 288 },
        { tanggal: '2024-01-31', totalBelanja: 3200000, totalTransaksi: 62, produkTerjual: 342 }
    ],
    4: [ // Siti Nurhaliza - Januari 2024
        { tanggal: '2024-01-01', totalBelanja: 2200000, totalTransaksi: 40, produkTerjual: 231 },
        { tanggal: '2024-01-02', totalBelanja: 2100000, totalTransaksi: 38, produkTerjual: 218 },
        { tanggal: '2024-01-03', totalBelanja: 2400000, totalTransaksi: 45, produkTerjual: 265 },
        { tanggal: '2024-01-04', totalBelanja: 2280000, totalTransaksi: 42, produkTerjual: 242 },
        { tanggal: '2024-01-05', totalBelanja: 2350000, totalTransaksi: 43, produkTerjual: 248 },
        { tanggal: '2024-01-06', totalBelanja: 2700000, totalTransaksi: 52, produkTerjual: 298 },
        { tanggal: '2024-01-07', totalBelanja: 2850000, totalTransaksi: 55, produkTerjual: 312 },
        { tanggal: '2024-01-08', totalBelanja: 2150000, totalTransaksi: 39, produkTerjual: 225 },
        { tanggal: '2024-01-09', totalBelanja: 2050000, totalTransaksi: 37, produkTerjual: 215 },
        { tanggal: '2024-01-10', totalBelanja: 2450000, totalTransaksi: 46, produkTerjual: 275 },
        { tanggal: '2024-01-11', totalBelanja: 2300000, totalTransaksi: 42, produkTerjual: 240 },
        { tanggal: '2024-01-12', totalBelanja: 2320000, totalTransaksi: 43, produkTerjual: 245 },
        { tanggal: '2024-01-13', totalBelanja: 2650000, totalTransaksi: 50, produkTerjual: 295 },
        { tanggal: '2024-01-14', totalBelanja: 2800000, totalTransaksi: 54, produkTerjual: 315 },
        { tanggal: '2024-01-15', totalBelanja: 2180000, totalTransaksi: 40, produkTerjual: 222 },
        { tanggal: '2024-01-16', totalBelanja: 2120000, totalTransaksi: 38, produkTerjual: 210 },
        { tanggal: '2024-01-17', totalBelanja: 2480000, totalTransaksi: 47, produkTerjual: 272 },
        { tanggal: '2024-01-18', totalBelanja: 2320000, totalTransaksi: 43, produkTerjual: 235 },
        { tanggal: '2024-01-19', totalBelanja: 2380000, totalTransaksi: 44, produkTerjual: 242 },
        { tanggal: '2024-01-20', totalBelanja: 2750000, totalTransaksi: 53, produkTerjual: 305 },
        { tanggal: '2024-01-21', totalBelanja: 2900000, totalTransaksi: 56, produkTerjual: 328 },
        { tanggal: '2024-01-22', totalBelanja: 2220000, totalTransaksi: 41, produkTerjual: 228 },
        { tanggal: '2024-01-23', totalBelanja: 2170000, totalTransaksi: 39, produkTerjual: 212 },
        { tanggal: '2024-01-24', totalBelanja: 2500000, totalTransaksi: 48, produkTerjual: 278 },
        { tanggal: '2024-01-25', totalBelanja: 2340000, totalTransaksi: 43, produkTerjual: 232 },
        { tanggal: '2024-01-26', totalBelanja: 2360000, totalTransaksi: 44, produkTerjual: 240 },
        { tanggal: '2024-01-27', totalBelanja: 2680000, totalTransaksi: 51, produkTerjual: 298 },
        { tanggal: '2024-01-28', totalBelanja: 2820000, totalTransaksi: 54, produkTerjual: 318 },
        { tanggal: '2024-01-29', totalBelanja: 2250000, totalTransaksi: 41, produkTerjual: 235 },
        { tanggal: '2024-01-30', totalBelanja: 2280000, totalTransaksi: 42, produkTerjual: 238 },
        { tanggal: '2024-01-31', totalBelanja: 2600000, totalTransaksi: 49, produkTerjual: 282 }
    ]
};