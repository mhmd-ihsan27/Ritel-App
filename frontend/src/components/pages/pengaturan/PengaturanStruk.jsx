import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileAlt, faSave, faSync, faStore, faPhone, faMapMarkerAlt,
    faTextHeight, faRulerVertical, faAlignLeft, faCheckCircle,
    faPrint, faCopy, faFont, faArrowsAltV
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../common/ToastContainer';
import { printerAPI } from '../../../api';

const PengaturanStruk = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [settings, setSettings] = useState({
        printerName: '',
        paperSize: '80mm',
        paperWidth: 48,
        fontSize: 'medium',
        lineSpacing: 1,
        leftMargin: 0,
        dashLineChar: '-',
        doubleLineChar: '=',
        headerAlignment: 'center',
        titleAlignment: 'center',
        footerAlignment: 'center',
        headerText: 'TOKO RITEL',
        headerAddress: 'Jl. Contoh No. 123',
        headerPhone: '0812-3456-7890',
        footerText: 'Terima kasih atas kunjungan Anda!\\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan',
        showLogo: false,
        autoPrint: true,
        copiesCount: 1,
    });

    useEffect(() => {
        loadSettings();

        // Perbarui waktu setiap detik agar preview selalu akurat
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Bersihkan interval saat komponen tidak lagi digunakan
        return () => clearInterval(timer);
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await printerAPI.getSettings();
            if (data) {
                setSettings({
                    printerName: data.printerName || '',
                    paperSize: data.paperSize || '80mm',
                    paperWidth: data.paperWidth || 48,
                    fontSize: data.fontSize || 'medium',
                    lineSpacing: data.lineSpacing || 1,
                    leftMargin: data.leftMargin || 0,
                    dashLineChar: data.dashLineChar || '-',
                    doubleLineChar: data.doubleLineChar || '=',
                    headerAlignment: data.headerAlignment || 'center',
                    titleAlignment: data.titleAlignment || 'center',
                    footerAlignment: data.footerAlignment || 'center',
                    headerText: data.headerText || 'TOKO RITEL',
                    headerAddress: data.headerAddress || 'Jl. Contoh No. 123',
                    headerPhone: data.headerPhone || '0812-3456-7890',
                    footerText: data.footerText || 'Terima kasih atas kunjungan Anda!\\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan',
                    showLogo: data.showLogo || false,
                    autoPrint: data.autoPrint !== undefined ? data.autoPrint : true,
                    copiesCount: data.copiesCount || 1,
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            addToast('Gagal memuat pengaturan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await printerAPI.saveSettings(settings);
            addToast('Pengaturan struk berhasil disimpan', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            addToast('Gagal menyimpan pengaturan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTestPrint = async () => {
        if (!settings.printerName) {
            addToast('Pilih printer terlebih dahulu', 'warning');
            return;
        }

        setTesting(true);
        try {
            await printerAPI.testPrinter(settings.printerName);
            addToast('Test print berhasil dikirim ke printer', 'success');
        } catch (error) {
            console.error('Error testing print:', error);
            addToast('Gagal melakukan test print', 'error');
        } finally {
            setTesting(false);
        }
    };

    const handleInputChange = (field, value) => {
        // Validasi untuk paperWidth
        if (field === 'paperWidth') {
            // Pastikan minimal 20 karakter, maksimal 60
            value = Math.max(20, Math.min(60, parseInt(value) || 48));
        }

        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // --- PERUBAHAN DIMULAI DI SINI ---

    // SESUAIKAN OFFSET INI dengan zona waktu server Anda.
    // Contoh: Jika server UTC dan Anda ingin menampilkan WIB (UTC+7), gunakan 7.
    // Jika server sudah WIB, gunakan 0.
    const TIMEZONE_OFFSET = 7; // dalam jam, positif untuk UTC+7 (WIB)

    // Fungsi untuk format tanggal dan waktu dengan penyesuaian zona waktu
    const formatDateTime = (date) => {
        // Buat salinan objek Date untuk dimanipulasi
        const adjustedDate = new Date(date.getTime());

        // Tambahkan offset zona waktu (dalam milidetik)
        adjustedDate.setMinutes(adjustedDate.getMinutes() + adjustedDate.getTimezoneOffset() + (TIMEZONE_OFFSET * 60));

        const day = adjustedDate.getDate().toString().padStart(2, '0');
        const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
        const year = adjustedDate.getFullYear();
        const hours = adjustedDate.getHours().toString().padStart(2, '0');
        const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    // --- PERUBAHAN SELESAI DI SINI ---

    // Fungsi untuk format line seperti di Go (menggunakan monospace font)
    const formatLine = (left, right) => {
        const paperWidth = settings.paperWidth || 48; // Fallback jika undefined
        const leftMargin = settings.leftMargin || 0;
        const effectiveWidth = Math.max(10, paperWidth - leftMargin);
        const space = effectiveWidth - left.length - right.length;
        if (space < 1) {
            return left + ' ' + right;
        }
        return left + ' '.repeat(Math.max(1, space)) + right;
    };

    // Fungsi untuk mendapatkan class font size berdasarkan pengaturan
    const getFontSizeClass = () => {
        switch (settings.fontSize) {
            case 'small': return 'text-xs';
            case 'large': return 'text-base';
            default: return 'text-sm';
        }
    };

    // Fungsi untuk mendapatkan width berdasarkan paper size
    const getPaperWidth = () => {
        return settings.paperSize === '58mm' ? 'max-w-xs' : 'max-w-sm';
    };

    // Fungsi untuk mendapatkan line height berdasarkan line spacing
    const getLineHeightClass = () => {
        switch (settings.lineSpacing) {
            case 0: return 'leading-none';
            case 2: return 'leading-loose';
            default: return 'leading-normal';
        }
    };

    // Fungsi untuk membuat garis putus-putus
    const renderDashedLine = () => {
        const paperWidth = settings.paperWidth || 48;
        const leftMargin = settings.leftMargin || 0;
        const effectiveWidth = Math.max(10, paperWidth - leftMargin);
        const dashChar = settings.dashLineChar || '-';
        const dash = dashChar.repeat(effectiveWidth);
        return <div className="text-gray-600">{dash}</div>;
    };

    // Fungsi untuk membuat garis ganda
    const renderDoubleLine = () => {
        const paperWidth = settings.paperWidth || 48;
        const leftMargin = settings.leftMargin || 0;
        const effectiveWidth = Math.max(10, paperWidth - leftMargin);
        const doubleChar = settings.doubleLineChar || '=';
        const doubleLine = doubleChar.repeat(effectiveWidth);
        return <div className="text-gray-700 font-bold">{doubleLine}</div>;
    };

    // Fungsi untuk mensimulasikan spasi baris seperti di printer thermal
    const renderLineSpacing = () => {
        if (settings.lineSpacing === 0) {
            return null;
        }
        return Array(settings.lineSpacing).fill().map((_, index) => (
            <div key={index} className="h-2"></div>
        ));
    };

    // Fungsi untuk mendapatkan style font berdasarkan ukuran
    const getFontStyle = () => {
        switch (settings.fontSize) {
            case 'small':
                return { fontSize: '10px', lineHeight: '1.2' };
            case 'large':
                return { fontSize: '14px', lineHeight: '1.4' };
            default:
                return { fontSize: '12px', lineHeight: '1.3' };
        }
    };

    return (
        <div className="min-h-screen bg-green-50 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                                <FontAwesomeIcon icon={faFileAlt} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Format Struk</h2>
                                <p className="text-gray-600 mt-1">Atur tampilan dan format struk pembayaran</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={loadSettings}
                                disabled={loading}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faSync} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                                <span>Muat Ulang</span>
                            </button>
                            <button
                                onClick={handleTestPrint}
                                disabled={testing || !settings.printerName}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faPrint} className={`mr-2 ${testing ? 'animate-pulse' : ''}`} />
                                <span>{testing ? 'Mencetak...' : 'Test Print'}</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <FontAwesomeIcon icon={faSave} />
                                <span className="ml-2">{saving ? 'Menyimpan...' : 'Simpan'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Memuat pengaturan...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Printer Selection */}
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 border border-blue-200">
                                    <FontAwesomeIcon icon={faPrint} className="h-5 w-5 text-blue-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Printer Settings</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Printer
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.printerName}
                                        onChange={(e) => handleInputChange('printerName', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Contoh: POS58, Thermal Printer"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Nama printer thermal yang terdaftar di sistem
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Jumlah Salinan
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={settings.copiesCount}
                                            onChange={(e) => handleInputChange('copiesCount', parseInt(e.target.value))}
                                            className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <span className="text-sm text-gray-600">salinan</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Jumlah struk yang akan dicetak per transaksi
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Header Toko */}
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 border border-green-200">
                                    <FontAwesomeIcon icon={faStore} className="h-5 w-5 text-green-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Header Toko</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Toko *
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.headerText}
                                        onChange={(e) => handleInputChange('headerText', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Nama Toko"
                                        maxLength={30}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {settings.headerText.length}/30 karakter - Akan ditampilkan dengan ukuran besar
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-500" />
                                        Alamat Toko
                                    </label>
                                    <textarea
                                        value={settings.headerAddress}
                                        onChange={(e) => handleInputChange('headerAddress', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                        rows="2"
                                        placeholder="Alamat lengkap toko"
                                        maxLength={50}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {settings.headerAddress.length}/50 karakter
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-500" />
                                        Nomor Telepon
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.headerPhone}
                                        onChange={(e) => handleInputChange('headerPhone', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="0812-3456-7890"
                                        maxLength={20}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {settings.headerPhone.length}/20 karakter
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Format Struk */}
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 border border-purple-200">
                                    <FontAwesomeIcon icon={faTextHeight} className="h-5 w-5 text-purple-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Format Pencetakan</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FontAwesomeIcon icon={faCopy} className="mr-2 text-gray-500" />
                                        Ukuran Kertas
                                    </label>
                                    <select
                                        value={settings.paperSize}
                                        onChange={(e) => handleInputChange('paperSize', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="58mm">58mm (Thermal Small)</option>
                                        <option value="80mm">80mm (Thermal Standard)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Sesuaikan dengan ukuran kertas thermal printer
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FontAwesomeIcon icon={faFont} className="mr-2 text-gray-500" />
                                        Ukuran Font
                                    </label>
                                    <select
                                        value={settings.fontSize}
                                        onChange={(e) => handleInputChange('fontSize', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="small">Kecil</option>
                                        <option value="medium">Sedang</option>
                                        <option value="large">Besar</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ukuran font untuk teks struk
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FontAwesomeIcon icon={faArrowsAltV} className="mr-2 text-gray-500" />
                                        Spasi Antar Baris
                                    </label>
                                    <select
                                        value={settings.lineSpacing}
                                        onChange={(e) => handleInputChange('lineSpacing', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value={0}>Rapat</option>
                                        <option value={1}>Normal</option>
                                        <option value={2}>Lebar</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Jarak spasi antar baris item produk
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FontAwesomeIcon icon={faAlignLeft} className="mr-2 text-gray-500" />
                                        Margin Kiri
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            value={settings.leftMargin}
                                            onChange={(e) => handleInputChange('leftMargin', parseInt(e.target.value))}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-sm font-semibold text-gray-700 w-12 text-center bg-gray-100 px-2 py-1 rounded">
                                            {settings.leftMargin}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {settings.leftMargin === 0 ? 'Tanpa margin' : `${settings.leftMargin} spasi dari kiri`}
                                    </p>
                                </div>
                            </div>

                            {/* Advanced Format Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FontAwesomeIcon icon={faRulerVertical} className="mr-2 text-gray-500" />
                                        Lebar Kertas (Karakter)
                                    </label>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="number"
                                            min="20"
                                            max="60"
                                            value={settings.paperWidth}
                                            onChange={(e) => handleInputChange('paperWidth', parseInt(e.target.value))}
                                            className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <span className="text-sm text-gray-600">karakter</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Lebar efektif kertas (20-60 karakter, default: 40 untuk 58mm, 48 untuk 80mm)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Karakter Garis Tunggal
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="1"
                                        value={settings.dashLineChar}
                                        onChange={(e) => handleInputChange('dashLineChar', e.target.value || '-')}
                                        className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                                        placeholder="-"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Karakter untuk garis pemisah (default: -)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Karakter Garis Ganda
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="1"
                                        value={settings.doubleLineChar}
                                        onChange={(e) => handleInputChange('doubleLineChar', e.target.value || '=')}
                                        className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center"
                                        placeholder="="
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Karakter untuk garis tebal (default: =)
                                    </p>
                                </div>
                            </div>

                            {/* Alignment Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alignment Header
                                    </label>
                                    <select
                                        value={settings.headerAlignment}
                                        onChange={(e) => handleInputChange('headerAlignment', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="left">Kiri</option>
                                        <option value="center">Tengah</option>
                                        <option value="right">Kanan</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Rata teks untuk nama toko, alamat, telepon
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alignment Judul
                                    </label>
                                    <select
                                        value={settings.titleAlignment}
                                        onChange={(e) => handleInputChange('titleAlignment', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="left">Kiri</option>
                                        <option value="center">Tengah</option>
                                        <option value="right">Kanan</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Rata teks untuk "DAFTAR PRODUK", "METODE PEMBAYARAN"
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alignment Footer
                                    </label>
                                    <select
                                        value={settings.footerAlignment}
                                        onChange={(e) => handleInputChange('footerAlignment', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="left">Kiri</option>
                                        <option value="center">Tengah</option>
                                        <option value="right">Kanan</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Rata teks untuk ucapan terima kasih di bawah
                                    </p>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoPrint}
                                        onChange={(e) => handleInputChange('autoPrint', e.target.checked)}
                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Cetak otomatis setelah transaksi
                                    </span>
                                </label>

                                <label className="flex items-center space-x-3 cursor-pointer opacity-50">
                                    <input
                                        type="checkbox"
                                        checked={settings.showLogo}
                                        onChange={(e) => handleInputChange('showLogo', e.target.checked)}
                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        disabled
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Tampilkan logo toko (Coming soon)
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Footer Struk */}
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 border border-orange-200">
                                    <FontAwesomeIcon icon={faAlignLeft} className="h-5 w-5 text-orange-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Footer Struk</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teks Penutup / Ucapan Terima Kasih
                                </label>
                                <textarea
                                    value={settings.footerText}
                                    onChange={(e) => handleInputChange('footerText', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                    rows="4"
                                    placeholder="Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan"
                                />
                                <div className="text-xs text-gray-500 mt-2 space-y-1">
                                    <p>• Gunakan <code className="bg-gray-100 px-1 rounded">\n</code> untuk membuat baris baru</p>
                                    <p>• Contoh: <code className="bg-gray-100 px-1 rounded">Baris pertama\nBaris kedua</code></p>
                                    <p>• Teks akan ditampilkan rata tengah di bagian bawah struk</p>
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                            <div className="flex items-center mb-4">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 border border-indigo-200">
                                    <FontAwesomeIcon icon={faFileAlt} className="h-5 w-5 text-indigo-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Preview Struk</h3>
                            </div>
                            <div className="p-4 bg-gray-50">
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500" />
                                        <span className="text-sm text-blue-700 font-medium">
                                            Preview struk {settings.paperSize} - {settings.copiesCount} salinan
                                        </span>
                                    </div>
                                </div>

                                <div className={`bg-white mx-auto shadow-lg rounded-lg overflow-hidden border-2 border-gray-300 ${getPaperWidth()}`}>
                                    {/* Header Section - Alignment based on setting (NO MARGIN) */}
                                    <div className={`p-4 font-mono whitespace-pre ${getLineHeightClass()}`} style={getFontStyle()}>
                                        <div className={`mb-3 ${settings.headerAlignment === 'left' ? 'text-left' : settings.headerAlignment === 'right' ? 'text-right' : 'text-center'}`}>
                                            <div className="font-bold uppercase tracking-tight mb-1" style={{ fontSize: settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '16px' : '14px' }}>
                                                {settings.headerText || 'TOKO RITEL'}
                                            </div>
                                            <div className="text-xs" style={{ fontSize: settings.fontSize === 'small' ? '8px' : settings.fontSize === 'large' ? '12px' : '10px' }}>
                                                {settings.headerAddress || 'Jl. Contoh No. 123'}
                                            </div>
                                            <div className="text-xs" style={{ fontSize: settings.fontSize === 'small' ? '8px' : settings.fontSize === 'large' ? '12px' : '10px' }}>
                                                {settings.headerPhone || '0812-3456-7890'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body Section - Left Aligned (WITH MARGIN) */}
                                    <div
                                        className={`px-4 font-mono whitespace-pre ${getLineHeightClass()}`}
                                        style={{
                                            ...getFontStyle(),
                                            paddingLeft: `${settings.leftMargin * 8 + 16}px`, // 8px per space + original padding
                                            textAlign: 'left'
                                        }}
                                    >

                                        {renderDashedLine()}

                                        {/* Info Transaksi - Full justify */}
                                        <div className="mb-2">
                                            <div>{formatLine('No:', 'TRX20250114001')}</div>
                                            <div>{formatLine('Tgl:', formatDateTime(currentTime))}</div>
                                            <div>{formatLine('Kasir:', 'Admin')}</div>
                                            <div>{formatLine('Cust:', 'Pelanggan')}</div>
                                        </div>

                                        {renderDashedLine()}

                                        {/* Items Header */}
                                        <div className="mb-2">
                                            <div className={`font-semibold ${settings.titleAlignment === 'left' ? 'text-left' : settings.titleAlignment === 'right' ? 'text-right' : 'text-center'}`}>DAFTAR PRODUK</div>
                                            {renderDashedLine()}
                                        </div>

                                        {/* Items - Full justify */}
                                        <div className="mb-3">
                                            <div>1. Produk Sample 1</div>
                                            <div>{formatLine('  2 x Rp 15.000', 'Rp 30.000')}</div>
                                            {renderLineSpacing()}

                                            <div>2. Produk Sample Panjang</div>
                                            <div>{formatLine('  1 x Rp 25.000', 'Rp 25.000')}</div>
                                            {renderLineSpacing()}

                                            <div>3. Produk 3</div>
                                            <div>{formatLine('  3 x Rp 5.000', 'Rp 15.000')}</div>
                                            {renderLineSpacing()}
                                        </div>

                                        {renderDashedLine()}

                                        {/* Totals - Full justify */}
                                        <div className="mb-3">
                                            <div>{formatLine('Subtotal:', 'Rp 70.000')}</div>
                                            <div>{formatLine('Diskon:', 'Rp 2.000')}</div>
                                            {renderDoubleLine()}
                                            <div className="font-bold">{formatLine('TOTAL:', 'Rp 68.000')}</div>
                                            <div>{formatLine('Bayar:', 'Rp 100.000')}</div>
                                            <div>{formatLine('Kembalian:', 'Rp 32.000')}</div>
                                        </div>

                                        {renderDashedLine()}

                                        {/* Payment Method */}
                                        <div className="mb-2">
                                            <div className={`font-semibold mb-1 ${settings.titleAlignment === 'left' ? 'text-left' : settings.titleAlignment === 'right' ? 'text-right' : 'text-center'}`}>METODE PEMBAYARAN</div>
                                            <div>{formatLine('Tunai:', 'Rp 100.000')}</div>
                                        </div>

                                        {renderDashedLine()}

                                    </div>

                                    {/* Footer Section - Alignment based on setting (NO MARGIN) */}
                                    <div className={`p-4 font-mono whitespace-pre ${settings.footerAlignment === 'left' ? 'text-left' : settings.footerAlignment === 'right' ? 'text-right' : 'text-center'} ${getLineHeightClass()}`} style={getFontStyle()}>
                                        <div className="mt-3" style={{ fontSize: settings.fontSize === 'small' ? '8px' : settings.fontSize === 'large' ? '12px' : '10px' }}>
                                            {settings.footerText.split('\\n').map((line, index) => (
                                                <div key={index} className={index > 0 ? 'mt-1' : ''}>{line}</div>
                                            ))}
                                        </div>

                                        {/* Cut Paper Indicator */}
                                        <div className="text-center mt-4">
                                            <div className="text-xs text-gray-500">--- potong di sini ---</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="text-green-700 font-semibold">Ukuran Kertas</div>
                                        <div className="text-green-600">{settings.paperSize}</div>
                                    </div>
                                    <div className="bg-indigo-50 p-3 rounded-lg">
                                        <div className="text-indigo-700 font-semibold">Lebar Kertas</div>
                                        <div className="text-indigo-600">{settings.paperWidth} char</div>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="text-blue-700 font-semibold">Ukuran Font</div>
                                        <div className="text-blue-600">
                                            {settings.fontSize === 'small' ? 'Kecil' :
                                                settings.fontSize === 'medium' ? 'Sedang' : 'Besar'}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-lg">
                                        <div className="text-purple-700 font-semibold">Spasi Baris</div>
                                        <div className="text-purple-600">
                                            {settings.lineSpacing === 0 ? 'Rapat' :
                                                settings.lineSpacing === 1 ? 'Normal' : 'Lebar'}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg">
                                        <div className="text-orange-700 font-semibold">Margin Kiri</div>
                                        <div className="text-orange-600">{settings.leftMargin} spasi</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PengaturanStruk;