// data/laporanPenjualanData.js

export const monthlySalesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    data: [8500000, 9200000, 8800000, 10500000, 11200000, 12500000, 11800000, 13200000, 12800000, 13500000, 14200000, 12500000],
    growth: 12.5
};

export const compositionData = {
    labels: ['Sayuran', 'Buah', 'Bumbu', 'Lainnya'],
    data: [54.8, 26, 12.6, 6.6],
    colors: ['#15803d', '#22c55e', '#86efac', '#dcfce7']
};

export const hourlySalesData = {
    labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
    revenue: [450000, 780000, 1200000, 950000, 1100000, 1450000, 2100000, 1850000, 1650000, 1450000, 1250000, 1550000, 1350000, 980000, 620000, 350000],
    transactions: [5, 8, 12, 10, 11, 15, 22, 18, 16, 14, 12, 16, 13, 10, 6, 4]
};

export const discountTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    withDiscount: [3200000, 3500000, 3300000, 4100000, 4500000, 5200000, 4800000, 5400000, 5100000, 5400000, 5700000, 5000000],
    discountValue: [900000, 980000, 920000, 1150000, 1250000, 1450000, 1350000, 1520000, 1430000, 1510000, 1590000, 1400000],
    roi: 3.5
};

export const lossAnalysisData = {
    labels: ['Barang Kadaluarsa', 'Barang Rusak', 'Kehilangan', 'Lainnya'],
    data: [46, 28.1, 17.3, 8.6],
    total: 1850000,
    colors: ['#ef4444', '#f97316', '#eab308', '#6b7280']
};

export const discountTypeData = [
    { type: 'Diskon Member', amount: 3500000, transactions: 89 },
    { type: 'Diskon Produk', amount: 1850000, transactions: 48 }
];

export const topProducts = [
    { id: 1, name: 'Bayam Hijau Segar', category: 'Sayuran', units: 245, revenue: 12250000, discountTransactions: 45, discountRevenue: 3500000, rank: 1 },
    { id: 2, name: 'Wortel Import', category: 'Sayuran', units: 189, revenue: 9450000, discountTransactions: 38, discountRevenue: 2800000, rank: 2 },
    { id: 3, name: 'Brokoli Fresh', category: 'Sayuran', units: 156, revenue: 7800000, discountTransactions: 32, discountRevenue: 2100000, rank: 3 },
    { id: 4, name: 'Apel Merah', category: 'Buah', units: 142, revenue: 7100000, discountTransactions: 28, discountRevenue: 1800000, rank: 4 },
    { id: 5, name: 'Jeruk Manis', category: 'Buah', units: 128, revenue: 6400000, discountTransactions: 25, discountRevenue: 1500000, rank: 5 }
];

export const detailReportData = [
    { month: 'Jan', products: 245, sales: 8500000, discount: 850000, discountPercent: 10, loss: 120000, lossPercent: 1.4, grossProfit: 2550000, netProfit: 1580000, marginPercent: 18.6 },
    { month: 'Feb', products: 268, sales: 9200000, discount: 920000, discountPercent: 10, loss: 140000, lossPercent: 1.5, grossProfit: 2760000, netProfit: 1700000, marginPercent: 18.5 },
    { month: 'Mar', products: 252, sales: 8800000, discount: 880000, discountPercent: 10, loss: 130000, lossPercent: 1.5, grossProfit: 2640000, netProfit: 1630000, marginPercent: 18.5 },
    { month: 'Apr', products: 298, sales: 10500000, discount: 1050000, discountPercent: 10, loss: 160000, lossPercent: 1.5, grossProfit: 3150000, netProfit: 1940000, marginPercent: 18.5 },
    { month: 'Mei', products: 312, sales: 11200000, discount: 1120000, discountPercent: 10, loss: 170000, lossPercent: 1.5, grossProfit: 3360000, netProfit: 2070000, marginPercent: 18.5 },
    { month: 'Jun', products: 345, sales: 12500000, discount: 1250000, discountPercent: 10, loss: 190000, lossPercent: 1.5, grossProfit: 3750000, netProfit: 2310000, marginPercent: 18.5 },
    { month: 'Jul', products: 328, sales: 11800000, discount: 1180000, discountPercent: 10, loss: 180000, lossPercent: 1.5, grossProfit: 3540000, netProfit: 2180000, marginPercent: 18.5 },
    { month: 'Agu', products: 358, sales: 13200000, discount: 1320000, discountPercent: 10, loss: 200000, lossPercent: 1.5, grossProfit: 3960000, netProfit: 2440000, marginPercent: 18.5 },
    { month: 'Sep', products: 342, sales: 12800000, discount: 1280000, discountPercent: 10, loss: 190000, lossPercent: 1.5, grossProfit: 3840000, netProfit: 2370000, marginPercent: 18.5 },
    { month: 'Okt', products: 362, sales: 13500000, discount: 1350000, discountPercent: 10, loss: 210000, lossPercent: 1.6, grossProfit: 4050000, netProfit: 2490000, marginPercent: 18.4 },
    { month: 'Nov', products: 378, sales: 14200000, discount: 1420000, discountPercent: 10, loss: 220000, lossPercent: 1.5, grossProfit: 4260000, netProfit: 2620000, marginPercent: 18.5 },
    { month: 'Des', products: 345, sales: 12500000, discount: 1250000, discountPercent: 10, loss: 190000, lossPercent: 1.5, grossProfit: 3750000, netProfit: 2310000, marginPercent: 18.5 }
];

export const summaryData = {
    totalOmset: 125000000,
    totalTransactions: 345,
    estimatedProfit: 31250000,
    margin: 25,
    avgTransaction: 362318,
    totalProducts: 2890,
    discountSales: 24500000,
    discountPercent: 19.6,
    lossImpact: 1850000,
    lossPercent: 1.5
};