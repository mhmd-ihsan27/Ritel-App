import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSyncAlt,
    faSave,
    faStore,
    faLeaf,
    faAppleAlt,
    faSeedling,
    faTags,
    faInfoCircle,
    faDollarSign,
    faCalendarAlt,
    faBox,
    faWeightHanging,
    faCalendar,
    faShoppingBasket,
    faBalanceScale,
    faCubes,
    faGripVertical,
    faTrash,
    faEye,
    faCheckCircle,
    faExclamationTriangle,
    faCalendarDay,
    faWeight,
    faLayerGroup,
    faPlus,
    faBarcode,
    faCopy,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { produkAPI, kategoriAPI } from '../../../api';
import { useToast } from '../../common/ToastContainer';
import CustomSelect from '../../common/CustomSelect';

// Dummy data untuk dropdown produk
const dummyProducts = [
    'Apel Malang',
    'Jeruk Sunkist',
    'Pisang Cavendish',
    'Bayam Hijau',
    'Wortel Organik',
    'Tomat Cherry',
    'Kentang Atlantik',
    'Bawang Merah',
    'Bawang Putih',
    'Cabai Merah',
    'Timun Surabaya',
    'Lemon Import',
    'Alpukat Mentega',
    'Mangga Harum Manis',
    'Nanas Madu',
    'Strawberry',
    'Blueberry Import',
    'Kiwi',
    'Melon Madu',
    'Semangka Non-Biji'
];

// Pemetaan produk ke kategori
const productCategoryMap = {
    'Apel Malang': 'Buah-Buahan',
    'Jeruk Sunkist': 'Buah-Buahan',
    'Pisang Cavendish': 'Buah-Buahan',
    'Bayam Hijau': 'Sayuran',
    'Wortel Organik': 'Sayuran',
    'Tomat Cherry': 'Sayuran',
    'Kentang Atlantik': 'Sayuran',
    'Bawang Merah': 'Sayuran',
    'Bawang Putih': 'Sayuran',
    'Cabai Merah': 'Sayuran',
    'Timun Surabaya': 'Sayuran',
    'Lemon Import': 'Buah-Buahan',
    'Alpukat Mentega': 'Buah-Buahan',
    'Mangga Harum Manis': 'Buah-Buahan',
    'Nanas Madu': 'Buah-Buahan',
    'Strawberry': 'Buah-Buahan',
    'Blueberry Import': 'Buah-Buahan',
    'Kiwi': 'Buah-Buahan',
    'Melon Madu': 'Buah-Buahan',
    'Semangka Non-Biji': 'Buah-Buahan'
};

// Dummy data untuk kategori (Ditambahkan)
const dummyCategories = [
    'Sayuran',
    'Buah-Buahan',
    'Herbal & Rempah',
    'Bumbu Dapur',
    'Lainnya'
];

// Komponen untuk tombol mode switcher
const ModeSwitcher = ({ mode, onToggle }) => {
    // return (
    //     <button
    //         onClick={onToggle}
    //         className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2 ${
    //             mode === 'variant'
    //                 ? 'bg-blue-600 hover:bg-blue-700 text-white'
    //                 : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    //         }`}
    //     >
    //         <FontAwesomeIcon icon={mode === 'variant' ? faLayerGroup : faWeight} />
    //         <span>
    //             {mode === 'variant' ? 'Mode Varian Berat' : 'Mode Single Berat'}
    //         </span>
    //     </button>
    // );
};

// Komponen untuk banner info mode varian
const VariantModeBanner = () => {
    return (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faCopy} className="text-blue-600 text-lg mt-1" />
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-800 mb-1">Mode Duplikasi Berdasarkan Berat Aktif</h4>
                    <p className="text-blue-700 text-sm mb-2">
                        Anda dapat membuat beberapa varian produk dengan berat berbeda. Setiap varian akan dibuat sebagai produk terpisah.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-2 rounded-lg border border-blue-100">
                            <span className="font-medium text-blue-700">Contoh:</span>
                            <p className="text-gray-600 mt-1">• Bayam (0.5 kg) - SKU: FV123456-01</p>
                            <p className="text-gray-600">• Bayam (1 kg) - SKU: FV123456-02</p>
                            <p className="text-gray-600">• Bayam (2 kg) - SKU: FV123456-03</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-green-100">
                            <span className="font-medium text-green-700">Fitur:</span>
                            <p className="text-gray-600 mt-1">• Setiap varian punya barcode berbeda</p>
                            <p className="text-gray-600">• Harga jual berbeda per varian</p>
                            <p className="text-gray-600">• Stok terpisah per varian</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Komponen untuk varian berat
const WeightVariant = ({ 
    variant, 
    index, 
    satuan, 
    onChange, 
    onRemove, 
    onGenerateBarcode, 
    canRemove 
}) => {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                    </div>
                    <span className="font-medium text-gray-700">Varian {index + 1}</span>
                    {variant.berat && (
                        <span className="text-sm text-gray-500">
                            ({variant.berat} {satuan})
                        </span>
                    )}
                </div>
                {canRemove && (
                    <button
                        onClick={() => onRemove(index)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Hapus varian"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Berat */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Berat <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <FontAwesomeIcon
                            icon={faWeightHanging}
                            className="absolute left-3 top-3 text-gray-400"
                        />
                        <input
                            type="number"
                            value={variant.berat}
                            onChange={(e) => onChange(index, 'berat', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Dalam {satuan}</p>
                </div>

                {/* Harga Jual */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga per 1000 gram <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        Harga untuk 1 kg atau 1000 gram produk
                    </p>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500 font-medium">Rp</span>
                        <input
                            type="text"
                            value={variant.hargaJual}
                            onChange={(e) => onChange(index, 'hargaJual', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {variant.hargaJual && `Rp ${formatRupiah(variant.hargaJual)}`}
                    </p>
                </div>

                {/* Barcode */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kode Barcode
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={variant.barcode}
                            onChange={(e) => onChange(index, 'barcode', e.target.value)}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Auto-generate"
                        />
                        <button
                            onClick={() => onGenerateBarcode(index)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center"
                            title="Generate barcode"
                        >
                            <FontAwesomeIcon icon={faBarcode} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {variant.barcode ? variant.barcode : 'Akan di-generate otomatis'}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Helper functions
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatRupiah = (value) => {
    if (!value && value !== 0) return '';
    const numberString = value.toString().replace(/\D/g, '');
    if (!numberString) return '';
    const formatted = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formatted;
};

const parseRupiah = (rupiahString) => {
    if (!rupiahString) return 0;
    const numericString = rupiahString.replace(/\./g, '').replace(/\D/g, '');
    return parseInt(numericString) || 0;
};

const InputBarang = ({ onSaveProduk }) => {
    const toast = useToast();
    
    // State management
    const [mode, setMode] = useState('single'); // 'single' atau 'variant'
    const [kategoris, setKategoris] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingKategori, setLoadingKategori] = useState(false);
    
    // Form state untuk mode single
    const [formProduk, setFormProduk] = useState({
        sku: '',
        barcode: '',
        nama: '',
        kategori: '',
        berat: '',
        hargaBeli: '',
        hargaJual: '',
        stok: '',
        satuan: 'kg',
        jenisProduk: 'curah', // 'curah' atau 'satuan'
        masaSimpanHari: '7',
        tanggalMasuk: getTodayDate(),
        deskripsi: '',
        hariPemberitahuanKadaluarsa: '30'
    });
    
    // State untuk mode varian
    const [duplicateWeights, setDuplicateWeights] = useState([{ berat: '', hargaJual: '', barcode: '' }]);

    // Load kategori from database on mount
    useEffect(() => {
        loadKategoris();
    }, []);

    // Load kategori dari database
    const loadKategoris = async () => {
        setLoadingKategori(true);
        try {
            const data = await kategoriAPI.getAll();
            setKategoris(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.showError('Gagal memuat data kategori');
        } finally {
            setLoadingKategori(false);
        }
    };

    // Toggle mode
    const handleToggleMode = () => {
        const newMode = mode === 'single' ? 'variant' : 'single';
        setMode(newMode);
        
        // Reset form saat mode berubah
        if (newMode === 'variant') {
            setDuplicateWeights([{ berat: '', hargaJual: '', barcode: '' }]);
            setFormProduk({
                ...formProduk,
                sku: '',
                barcode: '',
                nama: '',
                kategori: '',
                hargaBeli: '',
                stok: '',
                satuan: 'kg',
                jenisProduk: 'curah'
            });
            toast.showInfo('Mode duplikasi berdasarkan berat diaktifkan. Anda dapat menambahkan beberapa varian berat.');
        } else {
            setDuplicateWeights([{ berat: '', hargaJual: '', barcode: '' }]);
            setFormProduk({
                ...formProduk,
                sku: '',
                barcode: '',
                nama: '',
                kategori: '',
                berat: '',
                hargaBeli: '',
                hargaJual: '',
                stok: '',
                satuan: 'kg',
                jenisProduk: 'curah'
            });
            toast.showInfo('Mode duplikasi berdasarkan berat dinonaktifkan.');
        }
    };

    // Generate SKU
    const generateSKU = () => {
        const sku = 'FV' + Date.now().toString().slice(-6);
        setFormProduk({ ...formProduk, sku });
    };

    // Handle input change untuk mode single dan varian
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newState = { ...formProduk, [name]: value };

        // Logika auto-fill kategori hanya di mode varian saat nama berubah
        if (mode === 'variant' && name === 'nama') {
            const autoCategory = productCategoryMap[value] || '';
            newState.kategori = autoCategory;
        }

        // Special handling for price fields
        if (name === 'hargaBeli' || name === 'hargaJual') {
            const formatted = formatRupiah(value);
            newState[name] = formatted;
        }
        // Special handling for barcode field - only allow numbers
        else if (name === 'barcode') {
            const numericValue = value.replace(/\D/g, '');
            newState[name] = numericValue;
        }

        setFormProduk(newState);
    };

    // Handle duplicate weight input change
    const handleDuplicateWeightChange = (index, field, value) => {
        const newWeights = [...duplicateWeights];

        if (field === 'hargaJual') {
            const formatted = formatRupiah(value);
            newWeights[index][field] = formatted;
        } else if (field === 'barcode') {
            const numericValue = value.replace(/\D/g, '');
            newWeights[index][field] = numericValue;
        } else {
            newWeights[index][field] = value;
        }

        setDuplicateWeights(newWeights);
    };

    // Add new duplicate weight row
    const handleAddDuplicateWeight = () => {
        if (duplicateWeights.length >= 10) {
            toast.showWarning('Maksimal 10 varian berat yang dapat ditambahkan');
            return;
        }
        setDuplicateWeights([...duplicateWeights, { berat: '', hargaJual: '', barcode: '' }]);
    };

    // Remove duplicate weight row
    const handleRemoveDuplicateWeight = (index) => {
        if (duplicateWeights.length <= 1) {
            toast.showWarning('Minimal harus ada 1 varian berat');
            return;
        }
        const newWeights = duplicateWeights.filter((_, i) => i !== index);
        setDuplicateWeights(newWeights);
    };

    // Generate barcode for specific duplicate weight
    const handleGenerateBarcodeForWeight = (index) => {
        const newWeights = [...duplicateWeights];
        const baseBarcode = Date.now().toString().slice(-10);
        newWeights[index].barcode = baseBarcode + String(index + 1).padStart(2, '0');
        setDuplicateWeights(newWeights);
        toast.showSuccess(`Barcode untuk varian ${index + 1} berhasil digenerate`);
    };

    // Validate duplicate weights data
    const validateDuplicateWeights = () => {
        for (let i = 0; i < duplicateWeights.length; i++) {
            const weight = duplicateWeights[i];

            if (!weight.berat || parseFloat(weight.berat) <= 0) {
                toast.showWarning(`Varian ${i + 1}: Berat harus diisi dan lebih dari 0`);
                return false;
            }

            if (!weight.hargaJual) {
                toast.showWarning(`Varian ${i + 1}: Harga jual harus diisi`);
                return false;
            }

            if (!weight.barcode) {
                const baseBarcode = Date.now().toString().slice(-10);
                weight.barcode = baseBarcode + String(i + 1).padStart(2, '0');
            }
        }
        return true;
    };

    // Handle save untuk mode varian
    const simpanProdukVariantMode = async () => {
        if (!formProduk.sku || !formProduk.nama || !formProduk.kategori) {
            toast.showWarning('Harap isi SKU, Nama Produk, dan Kategori');
            return;
        }

        if (!validateDuplicateWeights()) {
            return;
        }

        const masaSimpan = parseInt(formProduk.masaSimpanHari) || 7;
        if (masaSimpan <= 0) {
            toast.showWarning('Masa simpan harus lebih dari 0 hari');
            return;
        }

        const pemberitahuan = parseInt(formProduk.hariPemberitahuanKadaluarsa) || 30;
        if (pemberitahuan > masaSimpan) {
            toast.showWarning(`Pemberitahuan kadaluarsa (${pemberitahuan} hari) tidak boleh melebihi masa simpan (${masaSimpan} hari)`);
            return;
        }

        // Validasi kategori dengan dummy data
        if (formProduk.kategori && formProduk.kategori.trim() !== '') {
            const kategoriExists = dummyCategories.some(
                kat => kat.toLowerCase() === formProduk.kategori.toLowerCase()
            );

            if (!kategoriExists) {
                toast.showError(`Kategori "${formProduk.kategori}" tidak tersedia. Silakan pilih kategori yang sudah ada atau pastikan nama produk benar.`);
                return;
            }
        }

        setLoading(true);

        try {
            const savedProducts = [];

            for (let i = 0; i < duplicateWeights.length; i++) {
                const weight = duplicateWeights[i];

                const produkData = {
                    sku: `${formProduk.sku}-${String(i + 1).padStart(2, '0')}`,
                    barcode: weight.barcode,
                    nama: `${formProduk.nama} (${weight.berat} ${formProduk.satuan})`,
                    kategori: formProduk.kategori,
                    berat: parseFloat(weight.berat) || 0,
                    hargaBeli: parseRupiah(formProduk.hargaBeli),
                    hargaJual: parseRupiah(weight.hargaJual),
                    stok: parseInt(formProduk.stok) || 0,
                    satuan: formProduk.satuan,
                    jenisProduk: formProduk.jenisProduk, // NEW: jenis produk (satuan/curah)
                    masaSimpanHari: masaSimpan,
                    tanggalMasuk: formProduk.tanggalMasuk,
                    deskripsi: formProduk.deskripsi,
                    hariPemberitahuanKadaluarsa: pemberitahuan
                };

                await produkAPI.create(produkData);
                savedProducts.push(produkData);
            }

            if (onSaveProduk) {
                savedProducts.forEach(product => onSaveProduk(product));
            }

            // Reset form
            setFormProduk({
                sku: '',
                barcode: '',
                nama: '',
                kategori: '',
                berat: '',
                hargaBeli: '',
                hargaJual: '',
                stok: '',
                satuan: 'kg',
                jenisProduk: 'curah',
                masaSimpanHari: '7',
                tanggalMasuk: getTodayDate(),
                deskripsi: '',
                hariPemberitahuanKadaluarsa: '30'
            });

            setDuplicateWeights([{ berat: '', hargaJual: '', barcode: '' }]);

            toast.showSuccess(`${savedProducts.length} varian produk berhasil disimpan!`);
        } catch (error) {
            console.error('Error saving products:', error);
            toast.showError('Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Handle save untuk mode single
    const simpanProdukSingleMode = async () => {
        if (!formProduk.sku || !formProduk.nama || !formProduk.hargaJual) {
            toast.showWarning('Harap isi semua field yang wajib diisi (SKU, Nama Produk, Harga Jual)');
            return;
        }

        const masaSimpan = parseInt(formProduk.masaSimpanHari) || 7;
        if (masaSimpan <= 0) {
            toast.showWarning('Masa simpan harus lebih dari 0 hari');
            return;
        }

        const pemberitahuan = parseInt(formProduk.hariPemberitahuanKadaluarsa) || 30;
        if (pemberitahuan > masaSimpan) {
            toast.showWarning(`Pemberitahuan kadaluarsa (${pemberitahuan} hari) tidak boleh melebihi masa simpan (${masaSimpan} hari)`);
            return;
        }

        if (formProduk.kategori && formProduk.kategori.trim() !== '') {
            const kategoriExists = kategoris.some(
                kat => kat.nama.toLowerCase() === formProduk.kategori.toLowerCase()
            );

            if (!kategoriExists) {
                toast.showError(`Kategori "${formProduk.kategori}" tidak tersedia. Silakan pilih kategori yang sudah ada.`);
                return;
            }
        }

        setLoading(true);

        try {
            const produkData = {
                sku: formProduk.sku,
                barcode: formProduk.barcode || Date.now().toString().slice(-12),
                nama: formProduk.nama,
                kategori: formProduk.kategori,
                berat: parseFloat(formProduk.berat) || 0,
                hargaBeli: parseRupiah(formProduk.hargaBeli),
                hargaJual: parseRupiah(formProduk.hargaJual),
                stok: parseInt(formProduk.stok) || 0,
                satuan: formProduk.satuan,
                jenisProduk: formProduk.jenisProduk, // NEW: jenis produk (satuan/curah)
                masaSimpanHari: masaSimpan,
                tanggalMasuk: formProduk.tanggalMasuk,
                deskripsi: formProduk.deskripsi,
                hariPemberitahuanKadaluarsa: pemberitahuan
            };

            await produkAPI.create(produkData);

            if (onSaveProduk) {
                onSaveProduk(produkData);
            }

            // Reset form
            setFormProduk({
                sku: '',
                barcode: '',
                nama: '',
                kategori: '',
                berat: '',
                hargaBeli: '',
                hargaJual: '',
                stok: '',
                satuan: 'kg',
                jenisProduk: 'curah',
                masaSimpanHari: '7',
                tanggalMasuk: getTodayDate(),
                deskripsi: '',
                hariPemberitahuanKadaluarsa: '30'
            });

            toast.showSuccess('Produk berhasil disimpan!');
        } catch (error) {
            console.error('Error saving product:', error);
            toast.showError('Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Main save function
    const simpanProduk = async () => {
        if (mode === 'variant') {
            await simpanProdukVariantMode();
        } else {
            await simpanProdukSingleMode();
        }
    };

    // Reset form
    const handleResetForm = () => {
        setFormProduk({
            sku: '',
            barcode: '',
            nama: '',
            kategori: '',
            berat: '',
            hargaBeli: '',
            hargaJual: '',
            stok: '',
            satuan: 'kg',
            masaSimpanHari: '7',
            tanggalMasuk: getTodayDate(),
            deskripsi: '',
            hariPemberitahuanKadaluarsa: '30'
        });

        if (mode === 'variant') {
            setDuplicateWeights([{ berat: '', hargaJual: '', barcode: '' }]);
        }

        toast.showInfo('Form berhasil direset');
    };

    return (
        <div className="page overflow-x-hidden min-h-screen bg-gray-50 p-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                        <div className="bg-green-700 p-4 rounded-2xl shadow-lg">
                            <FontAwesomeIcon icon={faShoppingBasket} className="text-white text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Input Barang Baru</h2>
                            <p className="text-gray-600 mt-1">Tambahkan produk sayuran dan buah segar ke dalam sistem</p>
                        </div>
                    </div>
                    <ModeSwitcher mode={mode} onToggle={handleToggleMode} />
                </div>

                {/* Mode Info Banner */}
                {mode === 'variant' && <VariantModeBanner />}
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden mb-8">
                {/* Form Header */}
                <div className="bg-green-700 border-b border-green-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faSeedling} className="text-white text-xl" />
                            <h3 className="text-xl font-semibold text-white">Form Input Produk</h3>
                            {mode === 'variant' && (
                                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                    <FontAwesomeIcon icon={faLayerGroup} />
                                    <span>Multi Varian ({duplicateWeights.length})</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                mode === 'variant' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                            }`}>
                                {mode === 'variant' ? 'Mode: Varian Berat' : 'Mode: Single Berat'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Loading State untuk Kategori */}
                    {loadingKategori && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-blue-700 text-sm">Memuat data kategori...</span>
                            </div>
                        </div>
                    )}

                    {/* Form untuk mode single */}
                    {mode === 'single' && (
                        <div className="space-y-6">
                            {/* Section 0: Jenis Produk */}
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-5 border border-blue-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faLayerGroup} className="text-blue-600 mr-2" />
                                    Jenis Produk <span className="text-red-500">*</span>
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Radio: Curah (Ditimbang) */}
                                    <label className={`relative flex items-start p-4 cursor-pointer rounded-xl border-2 transition-all ${
                                        formProduk.jenisProduk === 'curah'
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-300 bg-white hover:border-green-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="jenisProduk"
                                            value="curah"
                                            checked={formProduk.jenisProduk === 'curah'}
                                            onChange={handleInputChange}
                                            className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
                                        />
                                        <div className="ml-3">
                                            <div className="flex items-center space-x-2">
                                                <FontAwesomeIcon icon={faWeight} className="text-green-600" />
                                                <span className="font-semibold text-gray-900">Curah (Ditimbang)</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">• Harga per kg/liter</p>
                                            <p className="text-sm text-gray-600">• PLU timbangan</p>
                                            <p className="text-sm text-gray-600">• Stok dihitung per berat</p>
                                        </div>
                                    </label>

                                    {/* Radio: Satuan Tetap */}
                                    <label className={`relative flex items-start p-4 cursor-pointer rounded-xl border-2 transition-all ${
                                        formProduk.jenisProduk === 'satuan'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 bg-white hover:border-blue-300'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="jenisProduk"
                                            value="satuan"
                                            checked={formProduk.jenisProduk === 'satuan'}
                                            onChange={handleInputChange}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-3">
                                            <div className="flex items-center space-x-2">
                                                <FontAwesomeIcon icon={faBox} className="text-blue-600" />
                                                <span className="font-semibold text-gray-900">Satuan Tetap</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">• Harga per pcs/unit</p>
                                            <p className="text-sm text-gray-600">• Barcode/SKU tetap</p>
                                            <p className="text-sm text-gray-600">• Stok dihitung per pcs</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Section 1: Kode Identifikasi */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faTags} className="text-green-600 mr-2" />
                                    Kode Identifikasi Produk
                                </h4>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {formProduk.jenisProduk === 'satuan' ? 'Kode SKU' : 'Kode PLU Timbangan'} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex space-x-3">
                                            <input
                                                type="text"
                                                name="sku"
                                                value={formProduk.sku}
                                                onChange={handleInputChange}
                                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                placeholder="FV123456"
                                            />
                                            <button
                                                onClick={generateSKU}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-colors flex items-center space-x-2 font-medium"
                                            >
                                                <FontAwesomeIcon icon={faSyncAlt} />
                                                <span>Generate</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">SKU dapat diisi manual atau generate otomatis</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kode Barcode
                                        </label>
                                        <input
                                            type="text"
                                            name="barcode"
                                            value={formProduk.barcode}
                                            onChange={handleInputChange}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                            placeholder="1234567890123"
                                            title="Hanya boleh diisi dengan angka"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Hanya angka • Opsional</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Informasi Produk */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 mr-2" />
                                    Informasi Produk
                                </h4>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nama Produk <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nama"
                                            value={formProduk.nama}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                            placeholder="Contoh: Bayam Hijau Segar"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div>
                                            <CustomSelect
                                                name="kategori"
                                                value={formProduk.kategori}
                                                onChange={handleInputChange}
                                                options={kategoris.map(kat => ({
                                                    value: kat.nama,
                                                    label: kat.nama,
                                                    description: kat.deskripsi
                                                }))}
                                                placeholder="Pilih Kategori"
                                                label="Kategori"
                                                searchable={true}
                                                icon={faTags}
                                                emptyMessage="Belum ada kategori. Buat kategori terlebih dahulu di menu Kategori Produk."
                                            />
                                        </div>

                                        <div>
                                            <CustomSelect
                                                name="satuan"
                                                value={formProduk.satuan}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: 'kg', label: 'Kg', icon: faBalanceScale, description: 'kg' },
                                                    { value: 'gram', label: 'Gram', icon: faBalanceScale, description: 'g' },
                                                    { value: 'pcs', label: 'Pieces', icon: faCubes, description: 'pcs' },
                                                    { value: 'ikat', label: 'Ikat', icon: faGripVertical, description: 'ikat' },
                                                    { value: 'buah', label: 'Buah', icon: faAppleAlt, description: 'buah' },
                                                    { value: 'pack', label: 'Pack', icon: faBox, description: 'pack' },
                                                    { value: 'bungkus', label: 'Bungkus', icon: faBox, description: 'bungkus' }
                                                ]}
                                                placeholder="Pilih Satuan"
                                                label="Satuan"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Berat per Unit
                                        </label>
                                        <div className="relative">
                                            <FontAwesomeIcon
                                                icon={faWeightHanging}
                                                className="absolute left-4 top-3.5 text-gray-400"
                                            />
                                            <input
                                                type="number"
                                                name="berat"
                                                value={formProduk.berat}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Contoh: 0.5 untuk 500 gram</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Harga, Stok & Tanggal */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faDollarSign} className="text-green-600 mr-2" />
                                        Informasi Harga
                                    </h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Harga Beli
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="text"
                                                    name="hargaBeli"
                                                    value={formProduk.hargaBeli}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Harga beli dari supplier</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {formProduk.jenisProduk === 'satuan' ? 'Harga per pcs' : 'Harga per 1000 gram'} <span className="text-red-500">*</span>
                                            </label>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {formProduk.jenisProduk === 'satuan'
                                                    ? 'Harga untuk 1 pcs/unit produk'
                                                    : 'Harga untuk 1 kg atau 1000 gram produk'}
                                            </p>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="text"
                                                    name="hargaJual"
                                                    value={formProduk.hargaJual}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Harga jual ke customer</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faBox} className="text-blue-600 mr-2" />
                                        Stok & Tanggal
                                    </h4>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Stok Awal
                                                </label>
                                                <input
                                                    type="number"
                                                    name="stok"
                                                    value={formProduk.stok}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                    placeholder="0"
                                                    min="0"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">Jumlah stok awal produk</p>
                                            </div>

                                            <div>
                                                <label className="block text-[12px] font-medium text-gray-700 mb-2">
                                                    Pemberitahuan Kadaluarsa (hari)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        name="hariPemberitahuanKadaluarsa"
                                                        value={formProduk.hariPemberitahuanKadaluarsa}
                                                        onChange={handleInputChange}
                                                        min="1"
                                                        max="365"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                        placeholder="30"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Hari sebelum expired untuk notifikasi</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tanggal Masuk
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        name="tanggalMasuk"
                                                        value={formProduk.tanggalMasuk}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">✓ Otomatis terisi hari ini</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Masa Simpan (Hari)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        name="masaSimpanHari"
                                                        value={formProduk.masaSimpanHari}
                                                        onChange={handleInputChange}
                                                        min="1"
                                                        max="365"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                        placeholder="7"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Berapa hari produk ini dapat disimpan (default: 7 hari)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Deskripsi Produk */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-green-600 mr-2" />
                                    Deskripsi Produk
                                </h4>
                                <textarea
                                    name="deskripsi"
                                    value={formProduk.deskripsi}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white resize-none transition-colors"
                                    rows="4"
                                    placeholder="Tambahkan deskripsi produk (kualitas, asal, tips penyimpanan, dll.)"
                                ></textarea>
                                <p className="text-xs text-gray-500 mt-2">Deskripsi tambahan untuk produk (opsional)</p>
                            </div>
                        </div>
                    )}

                    {/* Form untuk mode varian */}
                    {mode === 'variant' && (
                        <div className="space-y-6">
                            {/* Section 1: Kode Identifikasi */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faTags} className="text-green-600 mr-2" />
                                    Kode Identifikasi Produk
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kode SKU <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex space-x-3">
                                            <input
                                                type="text"
                                                name="sku"
                                                value={formProduk.sku}
                                                onChange={handleInputChange}
                                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                placeholder="FV123456 (akan ada suffix)"
                                            />
                                            <button
                                                onClick={generateSKU}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-colors flex items-center space-x-2 font-medium"
                                            >
                                                <FontAwesomeIcon icon={faSyncAlt} />
                                                <span>Generate</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            SKU akan menjadi: {formProduk.sku || '[SKU]'}-01, {formProduk.sku || '[SKU]'}-02, dst.
                                        </p>
                                    </div>
                                    <div>
                                        {/* CustomSelect untuk Nama Produk (Sudah benar) */}
                                        <CustomSelect
                                            name="nama"
                                            value={formProduk.nama}
                                            onChange={handleInputChange}
                                            options={dummyProducts.map(nama => ({
                                                value: nama,
                                                label: nama,
                                                description: `Pilih ${nama} atau ketik nama baru`
                                            }))}
                                            placeholder="Pilih atau Ketik Nama Produk"
                                            label="Nama Produk"
                                            searchable={true}
                                            icon={faAppleAlt}
                                            emptyMessage="Tidak ada produk dalam daftar. Anda bisa mengetik nama produk baru."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Kategori dan Satuan */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 mr-2" />
                                    Informasi Produk Dasar
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        {/* CustomSelect untuk Kategori (Menggunakan dummy data) */}
                                        <CustomSelect
                                            name="kategori"
                                            value={formProduk.kategori}
                                            onChange={handleInputChange}
                                            options={dummyCategories.map(kat => ({ // PERUBAHAN: menggunakan dummyCategories
                                                value: kat,
                                                label: kat,
                                                description: `Kategori ${kat}`
                                            }))}
                                            placeholder="Kategori Otomatis"
                                            label="Kategori"
                                            searchable={true}
                                            icon={faTags}
                                            disabled={true} // Tetap dinonaktifkan
                                            emptyMessage="Kategori akan diisi otomatis."
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Kategori diisi otomatis berdasarkan nama produk.</p>
                                    </div>
                                    <div>
                                        <CustomSelect
                                            name="satuan"
                                            value={formProduk.satuan}
                                            onChange={handleInputChange}
                                            options={[
                                                { value: 'kg', label: 'Kg', icon: faBalanceScale, description: 'kg' },
                                                { value: 'gram', label: 'Gram', icon: faBalanceScale, description: 'g' },
                                                { value: 'pcs', label: 'Pieces', icon: faCubes, description: 'pcs' },
                                                { value: 'ikat', label: 'Ikat', icon: faGripVertical, description: 'ikat' },
                                                { value: 'buah', label: 'Buah', icon: faAppleAlt, description: 'buah' },
                                                { value: 'pack', label: 'Pack', icon: faBox, description: 'pack' },
                                                { value: 'bungkus', label: 'Bungkus', icon: faBox, description: 'bungkus' }
                                            ]}
                                            placeholder="Pilih Satuan"
                                            label="Satuan"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Daftar Varian Berat */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center">
                                        <FontAwesomeIcon icon={faWeight} className="text-green-600 mr-2" />
                                        Daftar Varian Berat ({duplicateWeights.length} varian)
                                    </h4>
                                    <button
                                        onClick={handleAddDuplicateWeight}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-colors flex items-center space-x-2 text-sm"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        <span>Tambah Varian</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {duplicateWeights.map((weight, index) => (
                                        <WeightVariant
                                            key={index}
                                            variant={weight}
                                            index={index}
                                            satuan={formProduk.satuan}
                                            onChange={handleDuplicateWeightChange}
                                            onRemove={handleRemoveDuplicateWeight}
                                            onGenerateBarcode={handleGenerateBarcodeForWeight}
                                            canRemove={duplicateWeights.length > 1}
                                        />
                                    ))}
                                </div>

                                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-700">
                                        <strong>Info:</strong>
                                        {formProduk.nama && formProduk.sku ?
                                            ` Setiap varian akan dibuat sebagai: "${formProduk.nama} (0.5 ${formProduk.satuan})" dengan SKU: ${formProduk.sku}-01, dst.` :
                                            ' Isi Nama Produk dan SKU terlebih dahulu untuk melihat contoh.'}
                                    </p>
                                </div>
                            </div>

                            {/* Section 4: Harga Beli, Stok, dan Tanggal */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faDollarSign} className="text-green-600 mr-2" />
                                        Informasi Harga Beli & Stok
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Harga Beli <span className="text-blue-600">(untuk semua varian)</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                                                <input
                                                    type="text"
                                                    name="hargaBeli"
                                                    value={formProduk.hargaBeli}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Harga beli dari supplier untuk semua varian</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Stok Awal <span className="text-blue-600">(per varian)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="stok"
                                                value={formProduk.stok}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                placeholder="0"
                                                min="0"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Jumlah stok untuk setiap varian</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <FontAwesomeIcon icon={faBox} className="text-blue-600 mr-2" />
                                        Informasi Penyimpanan
                                    </h4>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tanggal Masuk
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        name="tanggalMasuk"
                                                        value={formProduk.tanggalMasuk}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">✓ Otomatis terisi hari ini</p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Masa Simpan (Hari)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        name="masaSimpanHari"
                                                        value={formProduk.masaSimpanHari}
                                                        onChange={handleInputChange}
                                                        min="1"
                                                        max="365"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                        placeholder="7"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">Masa simpan untuk semua varian</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[12px] font-medium text-gray-700 mb-2">
                                                Pemberitahuan Kadaluarsa (hari)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="hariPemberitahuanKadaluarsa"
                                                    value={formProduk.hariPemberitahuanKadaluarsa}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    max="365"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                                                    placeholder="30"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Hari sebelum expired untuk notifikasi sistem
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Deskripsi Produk */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faInfoCircle} className="text-green-600 mr-2" />
                                    Deskripsi Produk <span className="text-blue-600 text-xs">(untuk semua varian)</span>
                                </h4>
                                <textarea
                                    name="deskripsi"
                                    value={formProduk.deskripsi}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white resize-none transition-colors"
                                    rows="4"
                                    placeholder="Tambahkan deskripsi produk (kualitas, asal, tips penyimpanan, dll.)"
                                ></textarea>
                                <p className="text-xs text-gray-500 mt-2">Deskripsi akan diterapkan untuk semua varian produk (opsional)</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button
                            onClick={handleResetForm}
                            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                            <span>Reset Form</span>
                        </button>
                        <button
                            onClick={simpanProduk}
                            disabled={loading}
                            className={`px-8 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                mode === 'variant' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            <FontAwesomeIcon icon={faSave} />
                            <span>
                                {loading
                                    ? 'Menyimpan...'
                                    : mode === 'variant'
                                        ? `Simpan ${duplicateWeights.length} Varian`
                                        : 'Simpan Produk'
                                }
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputBarang;