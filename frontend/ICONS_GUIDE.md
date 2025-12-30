# Font Awesome Icons - Panduan Penggunaan

## 📦 Package yang Digunakan

Package: **react-icons**
- Sudah terinstall dengan `npm install react-icons`
- Menyediakan berbagai icon libraries termasuk Font Awesome

## 🎨 Font Awesome Icons yang Digunakan

### Header & Navigation
```jsx
import {
  FaLeaf,           // Logo brand (daun untuk toko sayur)
  FaBell,           // Notifikasi
  FaSignOutAlt      // Logout
} from 'react-icons/fa';
```

### Sidebar - Menu Utama
```jsx
import {
  FaChartLine,      // Dashboard
  FaShoppingCart,   // Transaksi & Penjualan
  FaBox,            // Manajemen Produk
  FaUsers,          // Manajemen Pelanggan
  FaChartBar,       // Laporan & Analisis
  FaCog,            // Pengaturan
  FaUserShield,     // Manajemen User (Super Admin)
  FaChevronDown     // Dropdown arrow
} from 'react-icons/fa';
```

### Dashboard Stats
```jsx
import {
  FaMoneyBillWave,      // Penjualan
  FaReceipt,            // Transaksi
  FaBoxOpen,            // Produk Terjual
  FaExclamationTriangle // Warning/Stok Menipis
} from 'react-icons/fa';
```

### Quick Actions
```jsx
import {
  FaShoppingCart,   // Transaksi Baru
  FaBox,            // Input Produk
  FaUserPlus,       // Tambah Pelanggan
  FaChartLine       // Lihat Laporan
} from 'react-icons/fa';
```

### Notifications
```jsx
import {
  FaExclamationTriangle, // Warning
  FaTimesCircle,         // Danger/Error
  FaInfoCircle           // Info
} from 'react-icons/fa';
```

---

## 💡 Cara Menggunakan

### 1. Import Icon
```jsx
import { FaIconName } from 'react-icons/fa';
```

### 2. Gunakan sebagai Component
```jsx
<FaIconName className="w-5 h-5 text-green-600" />
```

### 3. Ukuran Icon (Tailwind)
```jsx
// Extra Small
<FaIcon className="w-3 h-3" />

// Small
<FaIcon className="w-4 h-4" />

// Medium (Default)
<FaIcon className="w-5 h-5" />

// Large
<FaIcon className="w-6 h-6" />

// Extra Large
<FaIcon className="w-8 h-8" />
```

### 4. Warna Icon
```jsx
// Primary Green
<FaIcon className="text-green-600" />

// Secondary Gray
<FaIcon className="text-gray-600" />

// White (untuk background gelap)
<FaIcon className="text-white" />

// Status Colors
<FaIcon className="text-red-600" />    // Danger
<FaIcon className="text-yellow-600" /> // Warning
<FaIcon className="text-blue-600" />   // Info
```

---

## 🎯 Best Practices

### 1. Konsistensi Ukuran
```jsx
// Menu Icons - w-5 h-5
<FaChartLine className="w-5 h-5" />

// Action Buttons - w-5 h-5
<FaShoppingCart className="w-5 h-5" />

// Stats Icons - text-2xl (atau w-8 h-8)
<FaMoneyBillWave className="text-2xl" />
```

### 2. Icon dengan Text
```jsx
<div className="flex items-center space-x-2">
  <FaIcon className="w-4 h-4" />
  <span>Label Text</span>
</div>
```

### 3. Icon di Button
```jsx
<button className="flex items-center space-x-2">
  <FaIcon className="w-4 h-4" />
  <span>Button Text</span>
</button>
```

### 4. Animasi Hover
```jsx
<button className="group">
  <FaIcon className="group-hover:scale-110 transition-transform" />
</button>
```

---

## 🔍 Mencari Icon Font Awesome Lainnya

Kunjungi dokumentasi react-icons:
- https://react-icons.github.io/react-icons/

Filter: **Font Awesome** (fa)

Contoh icon populer:
- `FaEdit` - Edit
- `FaTrash` - Delete
- `FaSave` - Save
- `FaPlus` - Add/Create
- `FaMinus` - Remove
- `FaSearch` - Search
- `FaFilter` - Filter
- `FaPrint` - Print
- `FaDownload` - Download
- `FaUpload` - Upload
- `FaEye` - View
- `FaEyeSlash` - Hide
- `FaCheck` - Confirm
- `FaTimes` - Close/Cancel
- `FaStar` - Favorite/Rating
- `FaHeart` - Like
- `FaClock` - Time
- `FaCalendar` - Date
- `FaEnvelope` - Email
- `FaPhone` - Phone

---

## 📋 Icon Mapping untuk Project

| Fitur | Icon | Import |
|-------|------|--------|
| Dashboard | `FaChartLine` | `react-icons/fa` |
| Transaksi | `FaShoppingCart` | `react-icons/fa` |
| Produk | `FaBox` | `react-icons/fa` |
| Pelanggan | `FaUsers` | `react-icons/fa` |
| Laporan | `FaChartBar` | `react-icons/fa` |
| Pengaturan | `FaCog` | `react-icons/fa` |
| Notifikasi | `FaBell` | `react-icons/fa` |
| Logout | `FaSignOutAlt` | `react-icons/fa` |
| Warning | `FaExclamationTriangle` | `react-icons/fa` |
| Error | `FaTimesCircle` | `react-icons/fa` |
| Info | `FaInfoCircle` | `react-icons/fa` |
| Success | `FaCheckCircle` | `react-icons/fa` |

---

## 🎨 Perbaikan yang Dilakukan

### Sidebar
✅ **Spacing yang lebih baik:**
- `mb-1` antar menu items
- `py-3.5` untuk padding vertical menu
- `px-5` untuk padding horizontal
- `space-x-3.5` antar icon dan label
- `my-6` untuk separator Super Admin

✅ **Font Awesome Icons:**
- Semua emoji diganti dengan Font Awesome
- Ukuran konsisten: `w-5 h-5`
- Warna putih/hijau muda untuk kontras

✅ **Better Visual:**
- `flex-shrink-0` pada icon agar tidak mengecil
- `font-medium` untuk label
- `transition-transform duration-200` untuk smooth animation
- Chevron icon untuk dropdown yang lebih professional

### Header
✅ **Logo dengan Font Awesome:**
- `FaLeaf` untuk brand identity toko sayur
- Shadow pada logo box untuk depth

✅ **Better Icon Spacing:**
- `p-2.5` untuk padding button
- Badge notification dengan `min-w-[1.25rem]`

### Dashboard
✅ **Professional Icons:**
- Stats cards dengan Font Awesome icons
- Quick actions dengan hover scale effect
- Konsisten sizing dan colors

---

**Dibuat dengan ❤️ untuk TokoSayur App**
