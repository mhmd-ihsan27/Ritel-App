/**
 * Script untuk otomatis update component dari Wails imports ke API modules
 * Run: node update-components.js
 */

const fs = require('fs');
const path = require('path');

// Mapping dari Wails functions ke API methods
const replacements = [
  // Pelanggan
  { from: /GetAllPelanggan\(/g, to: 'pelangganAPI.getAll(' },
  { from: /GetPelangganByID\(/g, to: 'pelangganAPI.getByID(' },
  { from: /GetPelangganByTelepon\(/g, to: 'pelangganAPI.searchByPhone(' },
  { from: /SearchPelangganByPhone\(/g, to: 'pelangganAPI.searchByPhone(' },
  { from: /CreatePelanggan\(/g, to: 'pelangganAPI.create(' },
  { from: /UpdatePelanggan\(/g, to: 'pelangganAPI.update(' },
  { from: /DeletePelanggan\(/g, to: 'pelangganAPI.delete(' },

  // Kategori
  { from: /GetAllKategori\(/g, to: 'kategoriAPI.getAll(' },
  { from: /GetKategoriByID\(/g, to: 'kategoriAPI.getByID(' },
  { from: /CreateKategori\(/g, to: 'kategoriAPI.create(' },
  { from: /UpdateKategori\(/g, to: 'kategoriAPI.update(' },
  { from: /DeleteKategori\(/g, to: 'kategoriAPI.delete(' },

  // Produk
  { from: /GetAllProduk\(/g, to: 'produkAPI.getAll(' },
  { from: /GetProdukByID\(/g, to: 'produkAPI.getByID(' },
  { from: /CreateProduk\(/g, to: 'produkAPI.create(' },
  { from: /UpdateProduk\(/g, to: 'produkAPI.update(' },
  { from: /DeleteProduk\(/g, to: 'produkAPI.delete(' },
  { from: /ScanBarcode\(/g, to: 'produkAPI.scanBarcode(' },
  { from: /UpdateStok\(/g, to: 'produkAPI.updateStok(' },
  { from: /UpdateStokIncrement\(/g, to: 'produkAPI.updateStokIncrement(' },

  // Transaksi
  { from: /GetAllTransaksi\(/g, to: 'transaksiAPI.getAll(' },
  { from: /GetTransaksiByID\(/g, to: 'transaksiAPI.getByID(' },
  { from: /GetTransaksiByNoTransaksi\(/g, to: 'transaksiAPI.getByNoTransaksi(' },
  { from: /GetTransaksiByDateRange\(/g, to: 'transaksiAPI.getByDateRange(' },
  { from: /GetTodayStats\(/g, to: 'transaksiAPI.getTodayStats(' },
  { from: /GetTransaksiByPelanggan\(/g, to: 'transaksiAPI.getByPelanggan(' },
  { from: /CreateTransaksi\(/g, to: 'transaksiAPI.create(' },

  // Promo
  { from: /GetAllPromo\(/g, to: 'promoAPI.getAll(' },
  { from: /GetActivePromos\(/g, to: 'promoAPI.getActive(' },
  { from: /GetPromoByID\(/g, to: 'promoAPI.getByID(' },
  { from: /GetPromoByKode\(/g, to: 'promoAPI.getByKode(' },
  { from: /CreatePromo\(/g, to: 'promoAPI.create(' },
  { from: /UpdatePromo\(/g, to: 'promoAPI.update(' },
  { from: /DeletePromo\(/g, to: 'promoAPI.delete(' },
  { from: /ApplyPromo\(/g, to: 'promoAPI.apply(' },
  { from: /GetPromoForProduct\(/g, to: 'promoAPI.getForProduct(' },
  { from: /GetPromoProducts\(/g, to: 'promoAPI.getProducts(' },

  // Return
  { from: /CreateReturn\(/g, to: 'returnAPI.create(' },
  { from: /GetAllReturns\(/g, to: 'returnAPI.getAll(' },
  { from: /GetReturnByID\(/g, to: 'returnAPI.getByID(' },
  { from: /GetReturnsByTransaksi\(/g, to: 'returnAPI.getByTransaksi(' },
  { from: /GetReturnStats\(/g, to: 'returnAPI.getStats(' },

  // User
  { from: /GetAllUsers\(/g, to: 'userAPI.getAll(' },
  { from: /GetUserByID\(/g, to: 'userAPI.getByID(' },
  { from: /CreateUser\(/g, to: 'userAPI.create(' },
  { from: /UpdateUser\(/g, to: 'userAPI.update(' },
  { from: /DeleteUser\(/g, to: 'userAPI.delete(' },

  // Analytics
  { from: /GetSalesAnalytics\(/g, to: 'analyticsAPI.getSalesAnalytics(' },
  { from: /GetProductPerformance\(/g, to: 'analyticsAPI.getProductPerformance(' },
  { from: /GetCategoryPerformance\(/g, to: 'analyticsAPI.getCategoryPerformance(' },
  { from: /GetHourlySalesPattern\(/g, to: 'analyticsAPI.getHourlySales(' },
  { from: /GetCustomerAnalytics\(/g, to: 'analyticsAPI.getCustomerAnalytics(' },

  // Staff Report
  { from: /GetStaffReport\(/g, to: 'staffReportAPI.getReport(' },
  { from: /GetStaffReportDetail\(/g, to: 'staffReportAPI.getReportDetail(' },
  { from: /GetAllStaffReports\(/g, to: 'staffReportAPI.getAllReports(' },
  { from: /GetAllStaffReportsWithTrend\(/g, to: 'staffReportAPI.getAllWithTrend(' },
  { from: /GetStaffReportWithTrend\(/g, to: 'staffReportAPI.getWithTrend(' },
  { from: /GetStaffHistoricalData\(/g, to: 'staffReportAPI.getHistoricalData(' },
  { from: /GetComprehensiveStaffReport\(/g, to: 'staffReportAPI.getComprehensive(' },
  { from: /GetShiftProductivity\(/g, to: 'staffReportAPI.getShiftProductivity(' },
  { from: /GetStaffShiftData\(/g, to: 'staffReportAPI.getStaffShiftData(' },
  { from: /GetMonthlyComparisonTrend\(/g, to: 'staffReportAPI.getMonthlyTrend(' },

  // Sales Report
  { from: /GetComprehensiveSalesReport\(/g, to: 'salesReportAPI.getComprehensive(' },

  // Printer
  { from: /PrintReceipt\(/g, to: 'printerAPI.printReceipt(' },
  { from: /GetAvailablePrinters\(/g, to: 'printerAPI.getAvailablePrinters(' },
  { from: /TestPrinter\(/g, to: 'printerAPI.testPrinter(' },

  // Hardware
  { from: /DetectHardware\(/g, to: 'hardwareAPI.detectHardware(' },
  { from: /GetBarcodeScannerStatus\(/g, to: 'hardwareAPI.getScannerStatus(' },

  // Settings
  { from: /GetPoinSettings\(/g, to: 'settingsAPI.getPoinSettings(' },
  { from: /UpdatePoinSettings\(/g, to: 'settingsAPI.updatePoinSettings(' },

  // Dashboard (already done, but include for completeness)
  { from: /GetDashboardData\(/g, to: 'dashboardAPI.getData(' },
  { from: /GetDashboardSalesChart\(/g, to: 'dashboardAPI.getSalesChart(' },
  { from: /GetDashboardCompositionChart\(/g, to: 'dashboardAPI.getCompositionChart(' },
  { from: /GetDashboardCategoryChart\(/g, to: 'dashboardAPI.getCategoryChart(' },
];

// Import replacements - remove Wails imports and add API imports
const importReplacements = [
  // Remove wailsjs imports
  {
    from: /import\s*{[^}]+}\s*from\s*['"]\.\.\/\.\.\/\.\.\/\.\.\/wailsjs\/go\/main\/App['"];?\s*/g,
    to: ''
  },
  {
    from: /import\s*{\s*models\s*}\s*from\s*['"]\.\.\/\.\.\/\.\.\/\.\.\/wailsjs\/go\/models['"];?\s*/g,
    to: ''
  },
];

// Files to update (relative to frontend/src)
const files = [
  'components/pages/pelanggan/DaftarPelanggan.jsx',
  'components/pages/transaksi/HistoryTransaksi.jsx',
  'components/pages/transaksi/ReturnBarang.jsx',
  'components/pages/produk/InputBarang.jsx',
  'components/pages/produk/UpdateStok.jsx',
  'components/pages/produk/KategoriProduk.jsx',
  'components/pages/produk/PromoDiskon.jsx',
  'components/pages/produk/BarcodeScanner.jsx',
  'components/pages/dashboard/StaffDashboard.jsx',
  'components/pages/laporan/LaporanPenjualan.jsx',
  'components/pages/laporan/LaporanStaff.jsx',
  'components/pages/pengaturan/ManajemenStaff.jsx',
  'components/pages/pengaturan/PengaturanStruk.jsx',
  'components/pages/pengaturan/PengaturanDevices.jsx',
  'components/pages/settings/HardwareSettings.jsx',
];

// Function to determine which API modules are needed
function determineAPIModules(content) {
  const modules = new Set();

  if (content.includes('pelangganAPI.')) modules.add('pelangganAPI');
  if (content.includes('produkAPI.')) modules.add('produkAPI');
  if (content.includes('transaksiAPI.')) modules.add('transaksiAPI');
  if (content.includes('kategoriAPI.')) modules.add('kategoriAPI');
  if (content.includes('promoAPI.')) modules.add('promoAPI');
  if (content.includes('userAPI.')) modules.add('userAPI');
  if (content.includes('returnAPI.')) modules.add('returnAPI');
  if (content.includes('analyticsAPI.')) modules.add('analyticsAPI');
  if (content.includes('dashboardAPI.')) modules.add('dashboardAPI');
  if (content.includes('staffReportAPI.')) modules.add('staffReportAPI');
  if (content.includes('salesReportAPI.')) modules.add('salesReportAPI');
  if (content.includes('printerAPI.')) modules.add('printerAPI');
  if (content.includes('hardwareAPI.')) modules.add('hardwareAPI');
  if (content.includes('settingsAPI.')) modules.add('settingsAPI');

  return Array.from(modules);
}

// Process file
function processFile(filePath) {
  const fullPath = path.join(__dirname, 'src', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  console.log(`\n📝 Processing: ${filePath}`);

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Remove Wails imports
  importReplacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  // Replace function calls
  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      console.log(`   ✓ Replacing ${matches.length} occurrence(s) of ${from.source}`);
      content = content.replace(from, to);
    }
  });

  // Determine which API modules to import
  const neededModules = determineAPIModules(content);

  if (neededModules.length > 0) {
    // Add import at the top (after React imports)
    const importStatement = `import { ${neededModules.join(', ')} } from '../../../api';\n`;

    // Find position after first import block
    const lines = content.split('\n');
    let insertIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      } else if (insertIndex > 0 && !lines[i].startsWith('import ')) {
        break;
      }
    }

    lines.splice(insertIndex, 0, importStatement);
    content = lines.join('\n');

    console.log(`   ✓ Added import: ${neededModules.join(', ')}`);
  }

  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✅ Updated successfully!`);
  } else {
    console.log(`   ℹ️  No changes needed`);
  }
}

// Main
console.log('🚀 Starting component migration...\n');
console.log('=' .repeat(50));

files.forEach(processFile);

console.log('\n' + '='.repeat(50));
console.log('\n✨ Migration complete!');
console.log('\n📋 Next steps:');
console.log('   1. Review changes: git diff');
console.log('   2. Test in browser: npm run dev');
console.log('   3. Check console for errors');
