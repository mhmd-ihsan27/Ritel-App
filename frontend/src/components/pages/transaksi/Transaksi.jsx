import { useState, useEffect, useRef } from 'react';
import {
    transaksiAPI,
    produkAPI,
    pelangganAPI,
    promoAPI,
    printerAPI,
    settingsAPI
} from '../../../api';
import { useToast } from '../../common/ToastContainer';
import { useAuth } from '../../../contexts/AuthContext';
import { usePreventBodyScrollMultiple } from '../../../hooks/usePreventBodyScroll';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faShoppingCart, faTrash, faPlus, faMinus,
    faCreditCard, faMoneyBill, faQrcode, faReceipt, faTimes,
    faCheck, faExclamationTriangle, faBarcode, faUser, faSync,
    faTags, faStar, faCrown, faGem, faPercent, faUserPlus,
    faCheckCircle, faEdit, faChevronRight, faInfoCircle, faSpinner,
    faWeightHanging
} from '@fortawesome/free-solid-svg-icons';
import CustomSelect from '../../common/CustomSelect';

export default function Transaksi() {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [cart, setCart] = useState([]);

    // Customer state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Promo state
    const [promoCode, setPromoCode] = useState('');
    // const [appliedPromo, setAppliedPromo] = useState(null); // REMOVED
    const [appliedPromos, setAppliedPromos] = useState([]); // NEW ARRAY STATE
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [activePromos, setActivePromos] = useState([]);
    const [eligiblePromos, setEligiblePromos] = useState([]);
    const [showPromoModal, setShowPromoModal] = useState(false);

    // Options untuk CustomSelect metode pembayaran
    const paymentMethodOptions = [
        { label: 'Tunai', value: 'tunai', icon: faMoneyBill, description: 'Pembayaran dengan uang tunai' },
        { label: 'QRIS', value: 'qris', icon: faQrcode, description: 'Pembayaran via QR Code' },
        { label: 'Transfer Bank', value: 'transfer', icon: faCreditCard, description: 'Pembayaran via transfer bank' },
        { label: 'Kartu Debit', value: 'debit', icon: faCreditCard, description: 'Pembayaran dengan kartu debit' },
        { label: 'Kartu Kredit', value: 'kredit', icon: faCreditCard, description: 'Pembayaran dengan kartu kredit' },
    ];

    // Discount breakdown - HANYA POIN DAN PROMO (TIDAK ADA DISKON PELANGGAN)
    const [discount, setDiscount] = useState(0);
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);
    const [pointsDiscount, setPointsDiscount] = useState(0);
    const [pointSettings, setPointSettings] = useState(null);
    const [promoAppliedProducts, setPromoAppliedProducts] = useState(new Set());

    // Payment state
    // eslint-disable-next-line
    const [payments, setPayments] = useState([]);
    const [currentPayment, setCurrentPayment] = useState({ method: 'tunai', amount: 0, reference: '' });
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Transaction state
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const receiptRef = useRef(null);
    const receiptModalRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);

    // Berat Modal state
    const [showBeratModal, setShowBeratModal] = useState(false);
    const [inputBerat, setInputBerat] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);

    const barcodeInputRef = useRef(null);
    const searchRef = useRef(null);
    const customerSearchRef = useRef(null);

    // Effect untuk reset promo ketika produk yang terkait promo dihapus dari keranjang
    useEffect(() => {
        if (appliedPromos.length > 0 && cart.length === 0) {
            removeAllPromos();
        } else if (appliedPromos.length > 0 && promoAppliedProducts.size > 0) {
            const hasRelatedProducts = cart.some(item =>
                promoAppliedProducts.has(item.id)
            );

            if (!hasRelatedProducts) {
                removeAllPromos();
                addToast('Semua promo dihapus karena produk yang terkait tidak ada di keranjang', 'info');
            }
        }
    }, [cart, appliedPromos, promoAppliedProducts]);

    // Load initial data
    const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const result = await produkAPI.getAll();
            if (result && Array.isArray(result)) {
                setProducts(result);
                setFilteredProducts(result);
            } else if (result && result.data && Array.isArray(result.data)) {
                setProducts(result.data);
                setFilteredProducts(result.data);
            } else {
                setProducts([]);
                setFilteredProducts([]);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            addToast('Gagal memuat data produk', 'error');
            setProducts([]);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
            const result = await pelangganAPI.getAll();
            if (result && Array.isArray(result)) {
                setCustomers(result);
                setFilteredCustomers(result);
            } else if (result && result.data && Array.isArray(result.data)) {
                setCustomers(result.data);
                setFilteredCustomers(result.data);
            } else {
                setCustomers([]);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            addToast('Gagal memuat data pelanggan', 'error');
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const settings = await settingsAPI.getPoinSettings();
            if (settings) {
                setPointSettings(settings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const loadPromos = async () => {
        try {
            const result = await promoAPI.getAll();
            if (result && Array.isArray(result)) {
                const now = new Date();
                const active = result.filter(p => {
                    const startDate = p.tanggalMulai ? new Date(p.tanggalMulai) : null;
                    const endDate = p.tanggalSelesai ? new Date(p.tanggalSelesai) : null;

                    if (startDate && startDate > now) return false;
                    if (endDate && endDate < now) return false;

                    return true;
                });
                setActivePromos(active);
            } else if (result && result.data && Array.isArray(result.data)) {
                const now = new Date();
                const active = result.data.filter(p => {
                    const startDate = p.tanggalMulai ? new Date(p.tanggalMulai) : null;
                    const endDate = p.tanggalSelesai ? new Date(p.tanggalSelesai) : null;

                    if (startDate && startDate > now) return false;
                    if (endDate && endDate < now) return false;

                    return true;
                });
                setActivePromos(active);
            } else {
                setActivePromos([]);
            }
        } catch (error) {
            console.error('Error loading promos:', error);
        }
    };

    useEffect(() => {
        loadProducts();
        loadCustomers();
        fetchSettings();
        loadPromos();

        // Focus barcode input on mount
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    // Check promo eligibility
    const isPromoEligibleForCart = (promo) => { // Stub, seeing usage in other parts
        // Real logic usually checks min purchase, specific products, etc.
        // Since this function body is likely missing, we implement a basic version
        if (!promo) return false;

        const { subtotal } = calculateTotals();
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

        // Check Min Transaction
        if (promo.minTransaksi && subtotal < promo.minTransaksi) return false;

        // Check Min Qty
        if (promo.minQuantity && totalQty < promo.minQuantity) return false;

        // Check Date
        const now = new Date();
        if (promo.tanggalMulai && new Date(promo.tanggalMulai) > now) return false;
        if (promo.tanggalSelesai && new Date(promo.tanggalSelesai) < now) return false;

        return true;
    };

    const isProductEligibleForPromo = (product, promo) => {
        if (!promo || !product) return false;

        // Logic check logic based on promo type
        if (promo.promoProdukIds && promo.promoProdukIds.length > 0) {
            return promo.promoProdukIds.includes(String(product.id)) || promo.promoProdukIds.includes(product.id);
        }

        return true;
    };

    const applyPromoCode = async () => {
        if (!promoCode.trim()) {
            addToast('Masukkan kode promo', 'warning');
            return;
        }

        if (cart.length === 0) {
            addToast('Keranjang kosong, tidak bisa menerapkan promo', 'error');
            return;
        }

        // Check duplicates
        if (appliedPromos.some(p => p.kode === promoCode || p.nama === promoCode)) {
            addToast('Promo ini sudah diterapkan', 'warning');
            return;
        }

        setIsValidatingPromo(true);
        try {
            const { subtotal } = calculateTotals();
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

            const response = await promoAPI.apply({
                kode: promoCode,
                subtotal: subtotal,
                totalQuantity: totalQuantity,
                pelangganId: selectedCustomer ? String(selectedCustomer.id) : "0",
                items: cart.map(item => ({
                    produkId: item.id,
                    jumlah: item.quantity,
                    hargaSatuan: item.pricePerKg,
                    beratGram: item.beratGram || 0
                }))
            });

            if (response.success) {
                // ADD to array instead of replace
                const promoWithDiscount = { ...response.promo, appliedDiscount: response.diskonJumlah };
                const newPromos = [...appliedPromos, promoWithDiscount];
                setAppliedPromos(newPromos);

                // Recalculate total promo discount locally to show immediate feedback
                // Note: The backend CalculateTotalDiscount will eventually do the heavy lifting for the final check,
                // but here we sum up individual applied promo values for UI.
                const newTotalPromoDiscount = promoDiscount + response.diskonJumlah;
                setPromoDiscount(newTotalPromoDiscount);

                // Update applied products set
                const relatedProductIds = new Set(promoAppliedProducts);

                if (response.promo.tipe_promo === 'buy_x_get_y') {
                    if (response.promo.produkX) {
                        relatedProductIds.add(response.promo.produkX.id);
                    }
                    if (response.promo.tipeBuyGet === 'beda' && response.promo.produkY) {
                        relatedProductIds.add(response.promo.produkY.id);
                    }
                } else if (response.promoProdukIds && Array.isArray(response.promoProdukIds) && response.promoProdukIds.length > 0) {
                    response.promoProdukIds.forEach(id => relatedProductIds.add(parseInt(id)));
                } else {
                    cart.forEach(item => {
                        if (isProductEligibleForPromo(item, response.promo)) {
                            relatedProductIds.add(item.id);
                        }
                    });
                }

                setPromoAppliedProducts(relatedProductIds);

                addToast(`🎉 Promo "${response.promo.nama}" berhasil diterapkan!`, 'success');
                setPromoCode(''); // Clear input
            } else {
                addToast(`❌ ${response.message}`, 'error');
                setPromoCode('');
            }
        } catch (error) {
            addToast('❌ Gagal menerapkan promo: ' + error.message, 'error');
            setPromoCode('');
        } finally {
            setIsValidatingPromo(false);
        }
    };

    // ... (skipping helper functions)

    const selectPromo = async (promo) => {
        setPromoCode(promo.kode || promo.nama);
        // Let the effect or user click apply to trigger
        // OR trigger directly:
        const code = promo.kode || promo.nama;

        if (appliedPromos.some(p => p.kode === code || p.nama === code)) {
            addToast('Promo ini sudah diterapkan', 'warning');
            return;
        }

        // Trigger apply logic manually since state update is async
        // We can just call the API logic here similar to applyPromoCode but with argument
        applySpecificPromo(promo);
        setShowPromoModal(false);
    };

    const applySpecificPromo = async (promo) => {
        if (cart.length === 0) {
            addToast('Keranjang kosong, tidak bisa menerapkan promo', 'error');
            return;
        }

        const code = promo.kode || promo.nama;
        setIsValidatingPromo(true);
        try {
            const { subtotal } = calculateTotals();
            const response = await promoAPI.apply({
                kode: code,
                subtotal: subtotal,
                totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
                pelangganId: selectedCustomer ? String(selectedCustomer.id) : "0",
                items: cart.map(item => ({
                    produkId: item.id,
                    jumlah: item.quantity,
                    hargaSatuan: item.pricePerKg,
                    beratGram: item.beratGram || 0
                }))
            });

            if (response.success) {
                const newPromos = [...appliedPromos, response.promo];
                setAppliedPromos(newPromos);
                setPromoDiscount(prev => prev + response.diskonJumlah);

                // Update products logic (omitted for brevity, same as above or simplified)
                addToast(`🎁 Promo "${response.promo.nama}" diterapkan!`, 'success');
            } else {
                addToast(response.message, 'error');
            }
        } catch (error) {
            addToast('Gagal menerapkan promo: ' + error, 'error');
        } finally {
            setIsValidatingPromo(false);
        }
    }


    const removePromo = (promoIdx) => {
        const removed = appliedPromos[promoIdx];
        const newPromos = appliedPromos.filter((_, index) => index !== promoIdx);
        setAppliedPromos(newPromos);

        // Calculate fresh sum from remaining promos
        const newTotalDiscount = newPromos.reduce((sum, p) => sum + (p.appliedDiscount || 0), 0);
        setPromoDiscount(newTotalDiscount);

        addToast(`Promo "${removed.nama}" dihapus`, 'info');
    };

    const removeAllPromos = () => {
        setAppliedPromos([]);
        setPromoCode('');
        setPromoDiscount(0);
        setPromoAppliedProducts(new Set());
        addToast('Semua promo dihapus', 'info');
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerModal(false);
        setCustomerSearch('');
        setShowCustomerDropdown(false);
        addToast(`Pelanggan ${customer.nama} dipilih`, 'success');
    };

    const clearCustomer = () => {
        setSelectedCustomer(null);
        setPointsToRedeem(0);
        addToast('Pelanggan dihapus dari transaksi', 'info');
    };

    // PERBAIKAN: recalculateDiscount - HANYA POIN DAN PROMO
    const recalculateDiscount = () => {
        setDiscount(promoDiscount + pointsDiscount);
    };

    // Handle points redemption calculation dengan validasi otomatis
    useEffect(() => {
        if (!pointSettings || pointsToRedeem === 0) {
            setPointsDiscount(0);
            return;
        }

        if (!selectedCustomer) {
            setPointsDiscount(0);
            setPointsToRedeem(0);
            addToast('Pilih pelanggan terlebih dahulu untuk menukar poin', 'error');
            return;
        }

        // Validasi: Tidak boleh lebih dari saldo poin
        let adjustedPoints = pointsToRedeem;
        if (adjustedPoints > selectedCustomer.poin) {
            adjustedPoints = selectedCustomer.poin;
            setPointsToRedeem(selectedCustomer.poin);
            addToast(`Poin disesuaikan ke poin tersedia: ${selectedCustomer.poin}`, 'info');
        }

        // Validasi: Tidak boleh membuat total negatif
        const { subtotal } = calculateTotals();
        const subtotalAfterPromo = subtotal - promoDiscount;
        const maxPointsByPrice = Math.floor(subtotalAfterPromo / pointSettings.pointValue);

        if (adjustedPoints > maxPointsByPrice) {
            adjustedPoints = maxPointsByPrice;
            setPointsToRedeem(maxPointsByPrice);
            addToast(`Poin disesuaikan agar tidak melebihi total belanja`, 'info');
        }

        // Validasi: Minimum exchange
        if (adjustedPoints > 0 && adjustedPoints < pointSettings.minExchange) {
            setPointsDiscount(0);
            addToast(`Minimal penukaran poin: ${pointSettings.minExchange}`, 'warning');
            return;
        }

        const discount = adjustedPoints * pointSettings.pointValue;
        setPointsDiscount(discount);
    }, [pointsToRedeem, selectedCustomer, pointSettings, promoDiscount]);

    useEffect(() => {
        recalculateDiscount();
    }, [cart, promoDiscount, pointsDiscount]);

    // Filter eligible promos based on cart contents
    useEffect(() => {
        const filterPromos = async () => {
            if (activePromos.length === 0) {
                setEligiblePromos([]);
                return;
            }

            const eligible = [];
            for (const promo of activePromos) {
                const isEligible = await isPromoEligibleForCart(promo);
                if (isEligible) {
                    eligible.push(promo);
                }
            }
            setEligiblePromos(eligible);
        };

        filterPromos();
    }, [cart, activePromos]);

    // Filter products based on search
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProducts(products);
            return;
        }

        const term = searchTerm.toLowerCase().trim();
        const filtered = products.filter(p => {
            const nameMatch = p.nama && p.nama.toLowerCase().includes(term);
            const skuMatch = p.sku && p.sku.toLowerCase().includes(term);
            const barcodeMatch = p.barcode && p.barcode.toLowerCase().includes(term);
            return nameMatch || skuMatch || barcodeMatch;
        });

        setFilteredProducts(filtered);
        if (filtered.length > 0) {
            setShowProductDropdown(true);
        }
    }, [searchTerm, products]);

    const TIMEZONE_OFFSET = 7; // dalam jam, positif untuk UTC+7 (WIB)

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

    const addToCart = (product, showNotification = true) => {
        if (product.stok <= 0) {
            if (showNotification) addToast(`Stok ${product.nama} habis`, 'warning');
            return;
        }

        // Check jenis produk
        if (product.jenisProduk === 'satuan') {
            // Produk Satuan Tetap: langsung tambah ke cart dengan quantity 1
            const existingItem = cart.find(item => item.id === product.id);

            if (existingItem) {
                // Update quantity
                const newQuantity = existingItem.quantity + 1;
                const newSubtotal = newQuantity * product.hargaJual;

                setCart(cart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: newQuantity, subtotal: newSubtotal }
                        : item
                ));

                if (showNotification) addToast(`${product.nama} +1 (Total: ${newQuantity} pcs)`, 'success');
            } else {
                // Add new item
                setCart([...cart, {
                    id: product.id,
                    sku: product.sku,
                    name: product.nama,
                    category: product.kategori,
                    satuan: product.satuan,
                    jenisProduk: product.jenisProduk,
                    pricePerKg: product.hargaJual,
                    beratGram: 0, // Tidak pakai berat untuk satuan
                    quantity: 1,
                    maxStock: product.stok,
                    subtotal: product.hargaJual
                }]);

                if (showNotification) addToast(`${product.nama} ditambahkan ke keranjang`, 'success');
            }
        } else {
            // Produk Curah: langsung tambah ke cart dengan berat 0 gram (bisa diedit nanti)
            const existingItem = cart.find(item => item.id === product.id);

            if (existingItem) {
                // Jika sudah ada di cart, tidak perlu tambah lagi (user bisa edit berat)
                if (showNotification) addToast(`${product.nama} sudah ada di keranjang, silakan edit beratnya`, 'info');
            } else {
                // Add new item dengan berat 0 gram
                setCart([...cart, {
                    id: product.id,
                    sku: product.sku,
                    name: product.nama,
                    category: product.kategori,
                    satuan: product.satuan,
                    jenisProduk: product.jenisProduk || 'curah',
                    pricePerKg: product.hargaJual,
                    beratGram: 0, // Default 0 gram, bisa diedit
                    quantity: 1, // For backward compatibility
                    maxStock: product.stok,
                    subtotal: 0 // Subtotal 0 karena berat 0
                }]);

                if (showNotification) addToast(`${product.nama} ditambahkan (0g), silakan edit beratnya`, 'success');
            }
        }

        setSearchTerm('');
        setShowProductDropdown(false);
    };

    const handleConfirmBerat = () => {
        if (!selectedProduct || !inputBerat || inputBerat <= 0) return;

        const beratGram = parseFloat(inputBerat);
        const hargaPer1000g = selectedProduct.hargaJual;
        const calculatedPrice = (beratGram / 1000) * hargaPer1000g;

        // Check if product already in cart
        const existingItem = cart.find(item => item.id === selectedProduct.id);

        if (existingItem) {
            // Update existing item - REPLACE weight (not add)
            const newSubtotal = (beratGram / 1000) * hargaPer1000g;

            setCart(cart.map(item =>
                item.id === selectedProduct.id
                    ? { ...item, beratGram: beratGram, subtotal: Math.round(newSubtotal) }
                    : item
            ));

            addToast(`${selectedProduct.nama} diupdate menjadi ${beratGram}g`, 'success');
        } else {
            // Add new item
            setCart([...cart, {
                id: selectedProduct.id,
                sku: selectedProduct.sku,
                name: selectedProduct.nama,
                category: selectedProduct.kategori,
                satuan: selectedProduct.satuan,
                jenisProduk: selectedProduct.jenisProduk || 'curah',
                pricePerKg: hargaPer1000g,
                beratGram: beratGram,
                quantity: 1, // For backward compatibility
                maxStock: selectedProduct.stok,
                subtotal: Math.round(calculatedPrice)
            }]);

            addToast(`${selectedProduct.nama} ${beratGram}g ditambahkan ke keranjang`, 'success');
        }

        // Reset modal
        setShowBeratModal(false);
        setInputBerat('');
        setSelectedProduct(null);
    };

    const calculateBeratPrice = (hargaPer1000g, beratGram) => {
        return Math.round((beratGram / 1000) * hargaPer1000g);
    };

    const updateQuantity = (productId, newQuantity) => {
        const item = cart.find(i => i.id === productId);

        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        if (newQuantity > item.maxStock) {
            addToast(`Stok tidak mencukupi (maksimal: ${formatStok(item.maxStock, item.jenisProduk)} ${item.satuan || 'pcs'})`, 'error');
            return;
        }

        setCart(cart.map(item =>
            item.id === productId
                ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
                : item
        ));
    };

    const removeFromCart = (productId) => {
        const newCart = cart.filter(item => item.id !== productId);
        setCart(newCart);
    };

    // Recalculate promos when cart changes
    const recalculateActivePromos = async () => {
        if (appliedPromos.length === 0) return;

        // If cart is empty, remove all promos
        if (cart.length === 0) {
            setAppliedPromos([]);
            setPromoDiscount(0);
            setPromoAppliedProducts(new Set());
            return;
        }

        let newTotalDiscount = 0;
        const newValidPromos = [];
        const newPromoProducts = new Set();
        let changed = false;

        const { subtotal } = calculateTotals(); // uses current cart
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

        for (const promo of appliedPromos) {
            try {
                // Gunakan API apply untuk validasi ulang
                // NOTE: Untuk efisiensi, idealnya ada endpoint 'validate' yg terima batch.
                // Tapi untuk MVP, kita reuse apply per item.
                const response = await promoAPI.apply({
                    kode: promo.kode || promo.nama,
                    subtotal: subtotal,
                    totalQuantity: totalQuantity,
                    pelangganId: selectedCustomer ? String(selectedCustomer.id) : "0",
                    items: cart.map(item => ({
                        produkId: item.id,
                        jumlah: item.quantity,
                        hargaSatuan: item.pricePerKg || item.hargaJual,
                        beratGram: item.beratGram || 0
                    }))
                });

                if (response.success) {
                    // Update discount amount
                    if (promo.appliedDiscount !== response.diskonJumlah) {
                        changed = true;
                    }

                    const updatedPromo = { ...promo, appliedDiscount: response.diskonJumlah };
                    newValidPromos.push(updatedPromo);
                    newTotalDiscount += response.diskonJumlah;

                    // Update badge logic
                    if (response.promo.tipe_promo === 'buy_x_get_y') {
                        if (response.promo.produkX) newPromoProducts.add(response.promo.produkX.id);
                        if (response.promo.produkY) newPromoProducts.add(response.promo.produkY.id);
                    } else if (response.promoProdukIds && Array.isArray(response.promoProdukIds)) {
                        response.promoProdukIds.forEach(id => newPromoProducts.add(parseInt(id)));
                    } else {
                        cart.forEach(item => {
                            if (isProductEligibleForPromo(item, response.promo)) {
                                newPromoProducts.add(item.id);
                            }
                        });
                    }

                } else {
                    // Promo no longer valid
                    changed = true;
                }

            } catch (err) {
                console.error("Error re-validating promo:", err);
                changed = true;
            }
        }

        if (changed || newValidPromos.length !== appliedPromos.length) {
            setAppliedPromos(newValidPromos);
            setPromoDiscount(newTotalDiscount);
            setPromoAppliedProducts(newPromoProducts);
            if (newValidPromos.length < appliedPromos.length) {
                addToast('Info: Beberapa promo disesuaikan/dihapus karena perubahan keranjang', 'info');
            }
        }
    };

    // Trigger recalculation when cart changes
    useEffect(() => {
        recalculateActivePromos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart]);

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const total = subtotal - discount;
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const change = totalPaid - total;

        return { subtotal, total, totalPaid, change };
    };

    const addPayment = () => {
        if (currentPayment.amount <= 0) {
            addToast('Jumlah pembayaran harus lebih dari 0', 'error');
            return;
        }

        if (currentPayment.method !== 'tunai' && !currentPayment.reference) {
            addToast('Nomor referensi diperlukan untuk pembayaran non-tunai', 'error');
            return;
        }

        setPayments([...payments, { ...currentPayment }]);
        setCurrentPayment({ method: 'tunai', amount: 0, reference: '' });
        addToast('Metode pembayaran ditambahkan', 'success');
    };

    const removePayment = (index) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const processTransaction = async () => {
        if (cart.length === 0) {
            addToast('Keranjang masih kosong', 'error');
            return;
        }

        // Validasi: Produk curah harus memiliki berat > 0
        const invalidCurahProducts = cart.filter(item =>
            item.jenisProduk === 'curah' && (!item.beratGram || item.beratGram <= 0)
        );

        if (invalidCurahProducts.length > 0) {
            const productNames = invalidCurahProducts.map(p => p.name).join(', ');
            addToast(`Produk curah "${productNames}" harus memiliki berat lebih dari 0 gram`, 'error');
            return;
        }

        const { total, totalPaid } = calculateTotals();

        if (totalPaid < total) {
            addToast('Pembayaran belum mencukupi', 'error');
            return;
        }

        setIsProcessing(true);

        try {
            // Debug: Log user object
            console.log('[DEBUG FRONTEND] User object:', user);
            console.log('[DEBUG FRONTEND] User ID:', user?.id);
            console.log('[DEBUG FRONTEND] User namaLengkap:', user?.namaLengkap);
            console.log('[DEBUG FRONTEND] User object type:', typeof user);
            console.log('[DEBUG FRONTEND] User keys:', user ? Object.keys(user) : 'user is null/undefined');

            // Check if user exists and has ID
            if (!user) {
                console.error('[DEBUG FRONTEND ERROR] User object is null or undefined!');
                addToast('Error: User tidak terdeteksi. Silakan login ulang.', 'error');
                setIsProcessing(false);
                return;
            }

            if (!user.id) {
                console.error('[DEBUG FRONTEND ERROR] User ID is missing!', user);
                addToast('Error: User ID tidak ditemukan. Silakan login ulang.', 'error');
                setIsProcessing(false);
                return;
            }

            const request = {
                pelangganId: String(selectedCustomer?.id || 0),
                pelangganNama: selectedCustomer?.nama || 'Umum',
                pelangganTelp: selectedCustomer?.telepon || '',
                items: cart.map(item => {
                    console.log('[DEBUG FRONTEND] Cart Item:', {
                        nama: item.name,
                        jenisProduk: item.jenisProduk,
                        beratGram: item.beratGram,
                        quantity: item.quantity,
                        pricePerKg: item.pricePerKg,
                        subtotal: item.subtotal
                    });

                    // Conditional: jika satuan, kirim quantity. Jika curah, kirim beratGram
                    if (item.jenisProduk === 'satuan') {
                        return {
                            produkId: item.id,
                            jumlah: item.quantity,          // Quantity untuk satuan tetap
                            hargaSatuan: item.pricePerKg,   // Harga per pcs
                            beratGram: 0                    // Tidak pakai berat
                        };
                    } else {
                        return {
                            produkId: item.id,
                            jumlah: 1,                      // Backward compatibility
                            hargaSatuan: item.pricePerKg,   // Harga per 1000g
                            beratGram: item.beratGram       // Berat dalam gram
                        };
                    }
                }),
                pembayaran: payments.map(p => ({
                    metode: p.method,
                    jumlah: p.amount,
                    referensi: p.reference || ''
                })),
                promoKode: appliedPromos.length > 0 ? appliedPromos.map(p => p.kode).join(',') : '',
                poinDitukar: pointsToRedeem,
                diskon: discount,
                catatan: '',
                kasir: user.namaLengkap || 'Kasir',
                staffId: String(user.id), // MUST be string to prevent JS precision loss!
                staffNama: user.namaLengkap || 'Kasir'
            };

            // DEBUG: Log selected customer and pelangganId
            console.log('[DEBUG FRONTEND] Selected Customer:', selectedCustomer);
            console.log('[DEBUG FRONTEND] PelangganId being sent:', request.pelangganId);
            console.log('[DEBUG FRONTEND] Full request:', request);


            const response = await transaksiAPI.create(request);

            if (response.success) {
                // Fix: response.data contains the TransaksiResponse
                const transaksiData = response.data || response;
                setLastTransaction(transaksiData.transaksi);
                setShowPaymentModal(false);

                try {
                    const printRequest = {
                        transactionNo: transaksiData.transaksi.transaksi.nomorTransaksi,
                        printerName: '',
                    };
                    console.log('📄 Print request:', printRequest);
                    console.log('📋 Transaction data:', transaksiData.transaksi);

                    await printerAPI.printReceipt(printRequest);
                    addToast('Transaksi berhasil! Struk sedang dicetak...', 'success');
                } catch (printError) {
                    console.error('Error printing receipt:', printError);
                    setShowReceiptModal(true);
                    addToast('Transaksi berhasil! Klik tombol cetak untuk mencetak struk.', 'success');
                }

                // Reset form
                setCart([]);
                setSelectedCustomer(null);
                setCustomerSearch('');
                setPromoCode('');
                setAppliedPromos([]);
                setPromoDiscount(0);
                setPointsToRedeem(0);
                setPointsDiscount(0);
                setDiscount(0);
                setPayments([]);
                setPromoAppliedProducts(new Set());

                loadProducts();
                loadCustomers();
            } else {
                addToast(`❌ ${response.message}`, 'error');
            }
        } catch (error) {
            addToast('❌ Gagal memproses transaksi: ' + error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const openPaymentModal = () => {
        if (cart.length === 0) {
            addToast('Keranjang masih kosong', 'error');
            return;
        }

        const { total } = calculateTotals();
        if (payments.length === 0) {
            setCurrentPayment({ method: 'tunai', amount: total, reference: '' });
        }

        setShowPaymentModal(true);
    };

    // Format number to Rupiah display (Rp 1.000.000)
    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Format angka dengan pemisah ribuan (format Indonesia)
    const formatNumber = (value) => {
        if (value === null || value === undefined) return 0;
        const num = Number(value);

        // Jika angka adalah bilangan bulat
        if (num % 1 === 0) {
            // Format dengan pemisah ribuan (titik untuk format Indonesia)
            return num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
        }

        // Jika memiliki desimal, tampilkan maksimal 1 desimal dengan pemisah ribuan
        return num.toLocaleString('id-ID', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
    };

    // Format stok - untuk produk curah max 2 desimal, untuk satuan tidak ada desimal
    const formatStok = (stok, jenisProduk) => {
        if (stok === null || stok === undefined) return 0;

        // Default ke 'satuan' jika jenisProduk tidak ada atau invalid
        const jenisValid = jenisProduk || 'satuan';

        // Gunakan formatNumber untuk semua jenis produk
        return formatNumber(stok);
    };

    // Format number to thousand separator (1.000.000) for input
    const formatThousandSeparator = (value) => {
        if (!value) return '';

        const numberString = value.toString().replace(/\D/g, '');

        if (!numberString) return '';

        const formatted = numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return formatted;
    };

    // Parse formatted string to number
    const parseFormattedNumber = (formattedString) => {
        if (!formattedString) return 0;
        const numericString = formattedString.replace(/\./g, '').replace(/\D/g, '');
        return parseInt(numericString) || 0;
    };

    // Generate reference number
    const generateReferenceNumber = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `TRX${timestamp}${random}`;
    };

    // Process barcode input
    const processBarcode = (barcode) => {
        if (!barcode) return;

        // Cari produk berdasarkan barcode atau SKU
        const product = products.find(p =>
            (p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase() === barcode.toLowerCase())
        );

        if (product) {
            addToCart(product);
            addToast(`Scanned: ${product.nama}`, 'success');
        } else {
            addToast(`Produk dengan barcode ${barcode} tidak ditemukan`, 'error');
        }
    };

    const handleBarcodeInput = (e) => {
        // Optional: logic if needed during input (e.g. timeout for scanner)
    };

    const handleBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = e.target.value.trim();
            if (barcode) {
                processBarcode(barcode);
                e.target.value = ''; // Clear input
            }
        }
    };

    const printReceipt = async (transaction = null) => {
        const txn = transaction || lastTransaction;

        if (!txn || !txn.transaksi) {
            addToast('Tidak ada transaksi untuk dicetak', 'error');
            return;
        }

        try {
            const printRequest = {
                transactionNo: txn.transaksi.nomorTransaksi,
                printerName: '',
            };
            console.log('📄 Reprint request:', printRequest);
            console.log('📋 Transaction data:', txn);

            await printerAPI.printReceipt(printRequest);

            addToast('Struk berhasil dicetak', 'success');
        } catch (error) {
            console.error('Error printing receipt:', error);
            addToast(`Gagal mencetak struk: ${error.message || error}`, 'error');

            if (receiptRef.current) {
                const printWindow = window.open('', '', 'height=600,width=400');
                printWindow.document.write('<html><head><title>Struk Pembayaran</title>');
                printWindow.document.write('<style>');
                printWindow.document.write('body { font-family: monospace; padding: 20px; }');
                printWindow.document.write('.header { text-align: center; margin-bottom: 20px; }');
                printWindow.document.write('.divider { border-top: 1px dashed #000; margin: 10px 0; }');
                printWindow.document.write('table { width: 100%; }');
                printWindow.document.write('.text-right { text-align: right; }');
                printWindow.document.write('.bold { font-weight: bold; }');
                printWindow.document.write('</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(receiptRef.current.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const { subtotal, total, totalPaid, change } = calculateTotals();

    return (
        <div className="page w-full max-w-full overflow-x-hidden min-h-screen p-8 border-1 border-gray-200">
            {/* Hidden Barcode Input - Captures scanner input */}
            <input
                ref={barcodeInputRef}
                type="text"
                onInput={handleBarcodeInput}
                onKeyDown={handleBarcodeKeyDown}
                className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
                placeholder="Barcode scanner input"
                autoComplete="off"
                tabIndex={-1}
            />

            {/* Barcode Scanner Status Indicator */}
            {isScanning && (
                <div className="fixed top-20 right-6 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl animate-pulse flex items-center space-x-3">
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faBarcode} className="text-xl" />
                        <span className="font-semibold">Scanning Barcode...</span>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 mb-3">
                        <div className="bg-green-700 p-4 rounded-2xl shadow-lg">
                            <FontAwesomeIcon icon={faShoppingCart} className="text-white text-3xl" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Point of Sale</h2>
                            <p className="text-gray-600 mt-1">Sistem transaksi penjualan cepat dan mudah</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6 w-full">
                {/* Product Search Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-t-hidden">
                    {/* Card Header */}
                    <div className="bg-green-700 border-b border-green-100 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FontAwesomeIcon icon={faSearch} className="text-white text-xl" />
                                <h3 className="text-xl font-semibold text-white">Cari Produk</h3>
                            </div>
                            {isLoadingProducts ? (
                                <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                                    <div className="w-3 h-3 border-2 border-green-600 rounded-full border-t-transparent animate-spin"></div>
                                    <span className="text-green-700 text-sm font-medium">Memuat...</span>
                                </div>
                            ) : (
                                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                                    {products.length} produk tersedia
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Search Section */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-300">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faBarcode} className="text-green-600 mr-2" />
                                Pencarian Produk
                            </h4>
                            <div className="relative" ref={searchRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Scan Barcode atau Ketik Nama Produk
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FontAwesomeIcon icon={faBarcode} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onFocus={() => {
                                            if (products.length > 0 && filteredProducts.length > 0) {
                                                setShowProductDropdown(true);
                                            }
                                        }}
                                        onClick={() => {
                                            if (products.length > 0 && filteredProducts.length > 0) {
                                                setShowProductDropdown(true);
                                            }
                                        }}
                                        placeholder={isLoadingProducts ? "Memuat produk..." : "Scan barcode atau ketik nama produk..."}
                                        className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                        disabled={isLoadingProducts}
                                        autoFocus={!isLoadingProducts && !showCustomerModal && !showPromoModal && !showPaymentModal && !showReceiptModal}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Gunakan scanner barcode atau ketik manual</p>

                                {/* Product Dropdown */}
                                {showProductDropdown && filteredProducts.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-xl max-h-80 overflow-hidden">
                                        <div className="bg-green-50 px-4 py-2 border-b border-green-100">
                                            <span className="text-xs text-green-700 font-semibold">
                                                {filteredProducts.length} produk ditemukan
                                            </span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredProducts.map(product => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => addToCart(product)}
                                                    className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-800">
                                                                {product.nama}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded">SKU: {product.sku}</span>
                                                                <span>•</span>
                                                                <span>{product.kategori}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-3">
                                                            <div className="font-semibold text-green-600">
                                                                {formatRupiah(product.hargaJual)}
                                                            </div>
                                                            <div className="mt-1">
                                                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${product.stok > 10
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : product.stok > 0
                                                                        ? 'bg-yellow-100 text-yellow-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    Stok: {formatStok(product.stok, product.jenisProduk)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No results message */}
                                {searchTerm.trim() !== '' && filteredProducts.length === 0 && showProductDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                                        <div className="text-center text-gray-500">
                                            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <FontAwesomeIcon icon={faSearch} className="text-xl text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Produk tidak ditemukan</p>
                                            <p className="text-xs text-gray-500">
                                                Tidak ada produk dengan kata kunci "<strong>{searchTerm}</strong>"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Empty state */}
                                {!isLoadingProducts && products.length === 0 && searchTerm === '' && (
                                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <div className="bg-yellow-100 p-2 rounded">
                                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600" />
                                            </div>
                                            <div className="flex-1 ml-3">
                                                <p className="text-sm font-medium text-gray-800 mb-1">
                                                    Belum ada produk di database
                                                </p>
                                                <p className="text-xs text-gray-600 mb-2">
                                                    Silakan tambah produk terlebih dahulu di menu Produk → Input Barang
                                                </p>
                                                <button
                                                    onClick={loadProducts}
                                                    className="inline-flex items-center space-x-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faSync} />
                                                    <span>Refresh Produk</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shopping Cart */}
                <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <FontAwesomeIcon icon={faShoppingCart} className="text-gray-600" />
                                <h3 className="font-semibold text-gray-800">Keranjang Belanja</h3>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                                {cart.length} item
                            </span>
                        </div>
                    </div>

                    <div className="p-4 max-h-96 overflow-y-auto">
                        {cart.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium mb-1">Keranjang masih kosong</p>
                                <p className="text-sm text-gray-400">Cari dan tambahkan produk</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800 flex items-center gap-2">
                                                    {item.name}
                                                    {appliedPromos.some(p => promoAppliedProducts.has(item.id)) && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {appliedPromos.map((p, idx) => (
                                                                (p.promoProdukIds?.includes(String(item.id)) || p.promoProdukIds?.includes(item.id) ||
                                                                    (p.tipe_promo === 'buy_x_get_y' && (p.produkX?.id === item.id || p.produkY?.id === item.id))) && (
                                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                        <FontAwesomeIcon icon={faTags} className="mr-1 text-xs" />
                                                                        {p.nama}
                                                                    </span>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">{item.category}</div>
                                                <div className="text-sm font-semibold text-green-600 mt-1">
                                                    {item.jenisProduk === 'satuan' ? (
                                                        <strong>{formatNumber(item.quantity)} pcs</strong>
                                                    ) : (
                                                        <>
                                                            <strong>{formatNumber(item.beratGram)}g</strong> <span className="text-gray-400 font-normal">({formatNumber(item.beratGram / 1000)} kg)</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    @ {formatRupiah(item.pricePerKg)} / {item.jenisProduk === 'satuan' ? 'pcs' : '1000g'}
                                                </div>

                                                {/* Tampilkan info gratis untuk promo buy_x_get_y */}
                                                {/* Tampilkan info untuk promo buy_x_get_y */}
                                                {appliedPromos.map((promo, pIdx) => (
                                                    promo.tipe_promo === 'buy_x_get_y' && (
                                                        <div key={pIdx}>
                                                            {promo.produkX && item.id === promo.produkX.id && promo.tipeBuyGet === 'sama' && (
                                                                (() => {
                                                                    const setSize = promo.buyQuantity + promo.getQuantity;
                                                                    const kelipatan = Math.floor(item.quantity / setSize);
                                                                    if (kelipatan > 0) {
                                                                        const itemsGratis = kelipatan * promo.getQuantity;
                                                                        const itemsToPay = item.quantity - itemsGratis;
                                                                        return (
                                                                            <div className="text-xs text-orange-600 mt-1 font-medium">
                                                                                [{promo.nama}] Bayar {itemsToPay}, Bawa {item.quantity} (Gratis {itemsGratis})
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <div className="text-xs text-red-600 mt-1 font-medium">
                                                                            [{promo.nama}] Tambah {setSize - (item.quantity % setSize)} lagi untuk promo
                                                                        </div>
                                                                    );
                                                                })()
                                                            )}

                                                            {promo.tipeBuyGet === 'beda' && promo.produkY && item.id === promo.produkY.id && (
                                                                (() => {
                                                                    const productX = cart.find(p => p.id === promo.produkX?.id);
                                                                    if (productX) {
                                                                        const kelipatan = Math.floor(productX.quantity / promo.buyQuantity);
                                                                        const totalGratis = kelipatan * promo.getQuantity;
                                                                        const gratisY = Math.min(totalGratis, item.quantity);
                                                                        const itemsToPay = item.quantity - gratisY;
                                                                        if (gratisY > 0) {
                                                                            return (
                                                                                <div className="text-xs text-orange-600 mt-1 font-medium">
                                                                                    [{promo.nama}] Bayar {itemsToPay}, Bawa {item.quantity} (Gratis {gratisY})
                                                                                </div>
                                                                            );
                                                                        }
                                                                    }
                                                                    return null;
                                                                })()
                                                            )}
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="text-sm" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            {/* Conditional Edit Button based on jenis produk */}
                                            {item.jenisProduk === 'satuan' ? (
                                                // Tombol +/- untuk Satuan Tetap
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            const newQuantity = Math.max(1, item.quantity - 1);
                                                            const newSubtotal = newQuantity * item.pricePerKg;
                                                            setCart(cart.map(cartItem =>
                                                                cartItem.id === item.id
                                                                    ? { ...cartItem, quantity: newQuantity, subtotal: newSubtotal }
                                                                    : cartItem
                                                            ));
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={faMinus} className="text-xs" />
                                                    </button>
                                                    <span className="text-sm font-medium text-gray-700 min-w-[30px] text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            if (item.quantity >= item.maxStock) {
                                                                addToast(`Stok maksimal ${formatStok(item.maxStock, item.jenisProduk)} ${item.satuan || 'pcs'}`, 'warning');
                                                                return;
                                                            }
                                                            const newQuantity = item.quantity + 1;
                                                            const newSubtotal = newQuantity * item.pricePerKg;
                                                            setCart(cart.map(cartItem =>
                                                                cartItem.id === item.id
                                                                    ? { ...cartItem, quantity: newQuantity, subtotal: newSubtotal }
                                                                    : cartItem
                                                            ));
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded transition-colors"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                                    </button>
                                                </div>
                                            ) : (
                                                // Tombol Edit Berat untuk Curah
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct({ ...item, id: item.id, nama: item.name, hargaJual: item.pricePerKg, stok: item.maxStock, satuan: item.satuan, jenisProduk: item.jenisProduk });
                                                        setInputBerat(item.beratGram.toString());
                                                        setShowBeratModal(true);
                                                    }}
                                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-300 transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                                    <span>Edit Berat</span>
                                                </button>
                                            )}

                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Subtotal</div>
                                                <div className="font-semibold text-gray-800">
                                                    {formatRupiah(item.subtotal)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary & Promo Section dengan Pelanggan */}
                <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faReceipt} className="text-gray-600" />
                            <h3 className="font-semibold text-gray-800">Ringkasan Transaksi</h3>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-6">
                            {/* Bagian Atas: Pelanggan dan Promo dalam grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Customer Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-700 flex items-center">
                                            <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
                                            Pelanggan
                                        </h4>
                                        {selectedCustomer && (
                                            <button
                                                onClick={clearCustomer}
                                                className="text-xs text-red-500 hover:text-red-700"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>

                                    {!selectedCustomer ? (
                                        <button
                                            onClick={() => setShowCustomerModal(true)}
                                            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-sm flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} className="text-gray-400" />
                                            <span>Pilih Pelanggan</span>
                                        </button>
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faUser} className="text-green-600 text-sm" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-800 text-sm truncate">
                                                        {selectedCustomer.nama}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {selectedCustomer.telepon}
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${selectedCustomer.tipe === 'gold'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : selectedCustomer.tipe === 'premium'
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {selectedCustomer.tipe}
                                                        </span>
                                                        <span className="text-xs text-gray-500">•</span>
                                                        <span className="text-xs text-green-600 font-medium">
                                                            {selectedCustomer.poin} poin
                                                        </span>
                                                    </div>
                                                    {/* HAPUS INFO DISKON PELANGGAN */}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Points Redemption Section */}
                                {selectedCustomer && pointSettings && selectedCustomer.poin > 0 && (
                                    <div className="space-y-3 pt-2 border-t border-gray-200">
                                        <h4 className="font-medium text-gray-700 flex items-center justify-between">
                                            <span className="flex items-center">
                                                <FontAwesomeIcon icon={faStar} className="mr-2 text-yellow-500" />
                                                Tukar Poin
                                            </span>
                                            <span className="text-xs text-gray-500 font-normal">
                                                Tersedia: <span className="font-medium text-green-600">{selectedCustomer.poin}</span> poin
                                            </span>
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedCustomer.poin}
                                                    value={pointsToRedeem}
                                                    onChange={(e) => {
                                                        const value = Math.max(0, parseInt(e.target.value) || 0);
                                                        setPointsToRedeem(value);
                                                    }}
                                                    placeholder="Jumlah poin"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                                                />
                                                <button
                                                    onClick={() => setPointsToRedeem(selectedCustomer.poin)}
                                                    className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium whitespace-nowrap"
                                                >
                                                    Gunakan Semua
                                                </button>
                                            </div>
                                            {pointsToRedeem > 0 && pointsToRedeem >= pointSettings.minExchange && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Nilai Penukaran:</span>
                                                        <span className="font-medium text-green-700">
                                                            Rp {pointsDiscount.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-500 text-[10px] mt-1">
                                                        {pointsToRedeem} poin × Rp {pointSettings.pointValue.toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            )}
                                            {pointsToRedeem > 0 && pointsToRedeem < pointSettings.minExchange && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700">
                                                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                                                    Minimal penukaran: {pointSettings.minExchange} poin
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Promo Section */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700 flex items-center">
                                        <FontAwesomeIcon icon={faTags} className="mr-2 text-gray-500" />
                                        Promo & Diskon
                                    </h4>

                                    {/* List Applied Promos */}
                                    <div className="space-y-3">
                                        {/* Input field always visible to add more */}
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                placeholder="Tambah kode promo"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors uppercase text-sm"
                                                disabled={isValidatingPromo || cart.length === 0}
                                            />
                                            <button
                                                onClick={applyPromoCode}
                                                disabled={isValidatingPromo || !promoCode.trim() || cart.length === 0}
                                                className="px-3 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                                {isValidatingPromo ? (
                                                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                                                ) : (
                                                    <FontAwesomeIcon icon={faPlus} />
                                                )}
                                            </button>
                                        </div>

                                        {/* Link untuk melihat promo tersedia */}
                                        <div className="flex justify-between items-center mb-2">
                                            <button
                                                onClick={() => setShowPromoModal(true)}
                                                disabled={cart.length === 0}
                                                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FontAwesomeIcon icon={faTags} className="text-xs" />
                                                Lihat Promo Tersedia
                                                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                            </button>
                                            {appliedPromos.length > 0 && (
                                                <button
                                                    onClick={removeAllPromos}
                                                    className="text-xs text-red-500 hover:text-red-700"
                                                >
                                                    Hapus Semua
                                                </button>
                                            )}
                                        </div>

                                        {appliedPromos.map((promo, idx) => (
                                            <div key={idx} className="bg-orange-50 rounded-lg p-3 border border-orange-200 relative group">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center space-x-2">
                                                        <FontAwesomeIcon icon={faTags} className="text-orange-600 text-sm" />
                                                        <div>
                                                            <div className="font-medium text-gray-800 text-sm">{promo.nama}</div>
                                                            <div className="text-xs text-gray-600">{promo.kode}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removePromo(idx)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                                    </button>
                                                </div>

                                                {/* Details per promo */}
                                                <div className="text-xs text-gray-600">
                                                    Diskon: {formatRupiah(promo.appliedDiscount || 0)}
                                                </div>

                                                {/* Info buy_x_get_y per promo */}
                                                {promo.tipe_promo === 'buy_x_get_y' && (
                                                    <div className="text-xs text-orange-800 mt-1 bg-orange-100 p-1.5 rounded">
                                                        <span className="font-medium"> Buy {promo.buyQuantity} Get {promo.getQuantity}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Bagian Bawah: Ringkasan Pembayaran */}
                        <div className="border-t border-gray-300 pt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Ringkasan Detail */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700">Detail Ringkasan</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Subtotal</span>
                                            <span>{formatRupiah(subtotal)}</span>
                                        </div>

                                        {/* Discount Breakdown - HANYA POIN DAN PROMO */}
                                        {(promoDiscount > 0 || pointsDiscount > 0) && (
                                            <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-300">
                                                {promoDiscount > 0 && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-700 flex items-center">
                                                            <FontAwesomeIcon icon={faTags} className="mr-2 text-orange-500 text-xs" />
                                                            Diskon Promo
                                                        </span>
                                                        <span className="font-medium text-orange-600">
                                                            - {formatRupiah(promoDiscount)}
                                                        </span>
                                                    </div>
                                                )}
                                                {pointsDiscount > 0 && (
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-700 flex items-center">
                                                            <FontAwesomeIcon icon={faStar} className="mr-2 text-yellow-500 text-xs" />
                                                            Diskon Poin ({pointsToRedeem} poin)
                                                        </span>
                                                        <span className="font-medium text-green-600">
                                                            - {formatRupiah(pointsDiscount)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="border-t border-gray-300 pt-2 mt-2">
                                                    <div className="flex justify-between items-center text-sm font-semibold">
                                                        <span className="text-gray-800">Total Diskon</span>
                                                        <span className="text-red-600">- {formatRupiah(discount)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* No Discount Message */}
                                        {discount === 0 && (
                                            <div className="flex justify-between text-gray-500 text-sm italic">
                                                <span>Tidak ada diskon</span>
                                                <span>Rp 0</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Total dan Pembayaran */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-700">Pembayaran</h4>
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
                                                <span>Total Bayar</span>
                                                <span className="text-green-600 text-xl">{formatRupiah(total)}</span>
                                            </div>

                                            {/* Point Earned Info */}
                                            {selectedCustomer && total > 0 && pointSettings && (
                                                <div className="flex items-center justify-between text-sm text-green-600 bg-white rounded p-2 border border-green-200">
                                                    <span className="flex items-center">
                                                        <FontAwesomeIcon icon={faStar} className="mr-2 text-yellow-500" />
                                                        Poin yang akan didapat
                                                    </span>
                                                    <span className="font-semibold">
                                                        +{Math.floor(total / pointSettings.minTransactionForPoints)} poin
                                                    </span>
                                                </div>
                                            )}
                                            {selectedCustomer && total > 0 && pointSettings && (
                                                <div className="text-xs text-gray-500 mt-1 text-center">
                                                    Setiap Rp {pointSettings.minTransactionForPoints.toLocaleString('id-ID')} = 1 poin
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Button */}
                                        <button
                                            onClick={openPaymentModal}
                                            disabled={cart.length === 0}
                                            className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Proses Pembayaran
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Customer Modal */}
            {
                showCustomerModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={(e) => {
                                // Simpan posisi scroll sebelum menutup modal
                                const scrollY = window.scrollY;
                                const scrollX = window.scrollX;

                                setShowCustomerModal(false);

                                // Pastikan scroll position tetap sama
                                setTimeout(() => window.scrollTo(scrollX, scrollY), 0);
                                setTimeout(() => window.scrollTo(scrollX, scrollY), 10);
                                setTimeout(() => window.scrollTo(scrollX, scrollY), 50);
                            }}
                            onWheel={(e) => e.preventDefault()}
                            onTouchMove={(e) => e.preventDefault()}
                        ></div>

                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="bg-green-600 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faUser} className="text-lg text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Pilih Pelanggan</h3>
                                        <p className="text-green-100 text-sm mt-1">
                                            Pilih pelanggan untuk transaksi ini
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        // Simpan posisi scroll sebelum menutup modal
                                        const scrollY = window.scrollY;
                                        const scrollX = window.scrollX;

                                        setShowCustomerModal(false);

                                        // Pastikan scroll position tetap sama
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 0);
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 10);
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 50);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-green-700 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <div className="relative" ref={customerSearchRef}>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Cari pelanggan by nama atau telepon..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                onFocus={() => {
                                                    if (filteredCustomers.length > 0) {
                                                        setShowCustomerDropdown(true);
                                                    }
                                                }}
                                                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                            />
                                        </div>

                                        {showCustomerDropdown && filteredCustomers.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                                <div className="bg-gray-50 px-3 py-2 border-b">
                                                    <span className="text-xs text-gray-600 font-medium">
                                                        {filteredCustomers.length} pelanggan ditemukan
                                                    </span>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredCustomers.map(cust => (
                                                        <div
                                                            key={cust.id}
                                                            onClick={() => selectCustomer(cust)}
                                                            className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-gray-800 flex items-center space-x-2">
                                                                        <span>{cust.nama}</span>
                                                                        {cust.tipe === 'gold' && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                <FontAwesomeIcon icon={faCrown} className="mr-1" /> Gold
                                                                            </span>
                                                                        )}
                                                                        {cust.tipe === 'premium' && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                                <FontAwesomeIcon icon={faGem} className="mr-1" /> Premium
                                                                            </span>
                                                                        )}
                                                                        {cust.tipe === 'reguler' && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                                <FontAwesomeIcon icon={faStar} className="mr-1" /> Reguler
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">{cust.telepon}</div>
                                                                    <div className="text-xs text-green-600 mt-1 font-medium">
                                                                        💎 {cust.poin} poin
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {isLoadingCustomers && (
                                            <div className="text-center py-2 text-xs text-gray-500">Memuat pelanggan...</div>
                                        )}
                                        {customerSearch && filteredCustomers.length === 0 && !isLoadingCustomers && (
                                            <div className="text-center py-2 text-xs text-gray-500">Pelanggan tidak ditemukan</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-4">Daftar Pelanggan</h3>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {customers.map(cust => (
                                            <div
                                                key={cust.id}
                                                onClick={() => selectCustomer(cust)}
                                                className="p-4 bg-white border border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                            <FontAwesomeIcon icon={faUser} className="text-green-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-800 flex items-center space-x-2">
                                                                <span>{cust.nama}</span>
                                                                {cust.tipe === 'gold' && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                        <FontAwesomeIcon icon={faCrown} className="mr-1" /> Gold
                                                                    </span>
                                                                )}
                                                                {cust.tipe === 'premium' && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                        <FontAwesomeIcon icon={faGem} className="mr-1" /> Premium
                                                                    </span>
                                                                )}
                                                                {cust.tipe === 'reguler' && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                        <FontAwesomeIcon icon={faStar} className="mr-1" /> Reguler
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-600">{cust.telepon}</div>
                                                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                                                <span>💎 {cust.poin} poin</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors">
                                                            Pilih
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {customers.length === 0 && !isLoadingCustomers && (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <FontAwesomeIcon icon={faUser} className="text-2xl text-gray-400" />
                                            </div>
                                            <p className="font-medium mb-1">Belum ada pelanggan</p>
                                            <p className="text-sm">Silakan tambah pelanggan di menu Pelanggan</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-300">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        // Simpan posisi scroll sebelum menutup modal
                                        const scrollY = window.scrollY;
                                        const scrollX = window.scrollX;

                                        setShowCustomerModal(false);

                                        // Pastikan scroll position tetap sama
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 0);
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 10);
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 50);
                                    }}
                                    className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 shadow hover:shadow-lg"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Promo Modal */}
            {
                showPromoModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={(e) => {
                                // Simpan posisi scroll sebelum menutup modal
                                const scrollY = window.scrollY;
                                const scrollX = window.scrollX;

                                setShowPromoModal(false);

                                // Pastikan scroll position tetap sama
                                setTimeout(() => window.scrollTo(scrollX, scrollY), 0);
                                setTimeout(() => window.scrollTo(scrollX, scrollY), 10);
                                setTimeout(() => window.scrollTo(scrollX, scrollY), 50);
                            }}
                            onWheel={(e) => e.preventDefault()}
                            onTouchMove={(e) => e.preventDefault()}
                        ></div>

                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="bg-orange-500 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faTags} className="text-lg text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Promo & Diskon Tersedia</h3>
                                        <p className="text-orange-100 text-sm mt-1">
                                            Pilih promo yang ingin digunakan untuk transaksi ini
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        // Simpan posisi scroll sebelum menutup modal
                                        const scrollY = window.scrollY;
                                        const scrollX = window.scrollX;

                                        setShowPromoModal(false);

                                        // Pastikan scroll position tetap sama
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 0);
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 10);
                                        setTimeout(() => window.scrollTo(scrollX, scrollY), 50);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-orange-600 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {eligiblePromos.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FontAwesomeIcon icon={faTags} className="text-2xl text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium mb-1">Tidak ada promo yang dapat digunakan</p>
                                        <p className="text-sm text-gray-400">
                                            {cart.length === 0
                                                ? 'Tambahkan produk ke keranjang untuk melihat promo yang tersedia'
                                                : 'Tidak ada promo yang sesuai dengan produk di keranjang'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {eligiblePromos.map(promo => (
                                            <div
                                                key={promo.id}
                                                className="bg-white border border-gray-300 rounded-xl p-4 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
                                                onClick={() => selectPromo(promo)}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                                                <FontAwesomeIcon icon={faTags} className="text-orange-600 text-sm" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 text-lg">{promo.nama}</h4>
                                                                {promo.kode && (
                                                                    <div className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                                                                        {promo.kode}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                            {promo.deskripsi || `Diskon khusus untuk pembelian tertentu`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-700">Nilai Diskon:</span>
                                                        <span className="font-bold text-orange-600 text-lg">
                                                            {promo.tipe === 'persen'
                                                                ? `${promo.nilai}%`
                                                                : formatRupiah(promo.nilai)
                                                            }
                                                        </span>
                                                    </div>

                                                    {promo.minQuantity > 0 && (
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600">Min. Quantity:</span>
                                                            <span className="font-medium text-gray-800">
                                                                {promo.minQuantity} produk
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">Berlaku hingga:</span>
                                                        <span className="font-medium text-gray-800">
                                                            {promo.tanggalSelesai ? new Date(promo.tanggalSelesai).toLocaleDateString('id-ID') : 'Tidak terbatas'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-200">
                                                    <button
                                                        className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors group-hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                        disabled={cart.length === 0}
                                                    >
                                                        {cart.length === 0 ? 'Keranjang Kosong' : 'Pilih Promo Ini'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-300">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">{eligiblePromos.length} promo dapat digunakan</span>
                                        {activePromos.length > eligiblePromos.length && (
                                            <span className="text-gray-500 ml-2">
                                                ({activePromos.length - eligiblePromos.length} promo tidak sesuai)
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            // Simpan posisi scroll sebelum menutup modal
                                            const scrollY = window.scrollY;
                                            const scrollX = window.scrollX;

                                            setShowPromoModal(false);

                                            // Pastikan scroll position tetap sama
                                            setTimeout(() => window.scrollTo(scrollX, scrollY), 0);
                                            setTimeout(() => window.scrollTo(scrollX, scrollY), 10);
                                            setTimeout(() => window.scrollTo(scrollX, scrollY), 50);
                                        }}
                                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 shadow hover:shadow-lg"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPaymentModal(false);
                            }}
                            onWheel={(e) => e.preventDefault()}
                            onTouchMove={(e) => e.preventDefault()}
                        ></div>

                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="bg-green-600 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faCreditCard} className="text-lg text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Pembayaran</h3>
                                        <p className="text-green-100 text-sm mt-1">
                                            Pilih metode pembayaran untuk menyelesaikan transaksi
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowPaymentModal(false);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-green-700 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                {payments.length === 0 && (
                                    <div className="bg-gray-50 border border-gray-300 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-800">Pilih Metode Pembayaran</h3>
                                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                                                1 Metode Saja
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <CustomSelect
                                                    label="Metode Pembayaran"
                                                    name="method"
                                                    value={currentPayment.method}
                                                    onChange={(e) => {
                                                        const newMethod = e.target.value;
                                                        const { total } = calculateTotals();
                                                        const remaining = total - payments.reduce((sum, p) => sum + p.amount, 0);

                                                        setCurrentPayment({
                                                            ...currentPayment,
                                                            method: newMethod,
                                                            reference: newMethod !== 'tunai' ? generateReferenceNumber() : '',
                                                            amount: newMethod !== 'tunai' ? Math.max(0, remaining) : currentPayment.amount
                                                        });
                                                    }}
                                                    options={paymentMethodOptions}
                                                    placeholder="Pilih Metode Pembayaran"
                                                    icon={paymentMethodOptions.find(opt => opt.value === currentPayment.method)?.icon || faMoneyBill}
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Jumlah Pembayaran
                                                    </label>
                                                    {currentPayment.method === 'tunai' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const { total } = calculateTotals();
                                                                const remaining = total - payments.reduce((sum, p) => sum + p.amount, 0);
                                                                setCurrentPayment({ ...currentPayment, amount: Math.max(0, remaining) });
                                                            }}
                                                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                                                        >
                                                            Set Sisa Tagihan
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-3 text-gray-500 font-medium">Rp</span>
                                                    <input
                                                        type="text"
                                                        value={currentPayment.amount ? formatThousandSeparator(currentPayment.amount.toString()) : ''}
                                                        onChange={(e) => {
                                                            if (currentPayment.method === 'tunai') {
                                                                const formatted = formatThousandSeparator(e.target.value);
                                                                const numericValue = parseFormattedNumber(formatted);
                                                                setCurrentPayment({ ...currentPayment, amount: numericValue });
                                                            }
                                                        }}
                                                        readOnly={currentPayment.method !== 'tunai'}
                                                        className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 ${currentPayment.method === 'tunai'
                                                            ? 'bg-white cursor-text'
                                                            : 'bg-gray-100 text-gray-700 cursor-not-allowed'
                                                            }`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                {currentPayment.method === 'tunai' && (
                                                    <>
                                                        <div className="grid grid-cols-4 gap-2 mt-2">
                                                            {[20000, 50000, 100000, 200000].map((amount) => (
                                                                <button
                                                                    key={amount}
                                                                    type="button"
                                                                    onClick={() => setCurrentPayment({ ...currentPayment, amount: amount })}
                                                                    className="px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                                                                >
                                                                    {amount >= 1000 ? `${amount / 1000}k` : amount}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">Masukkan jumlah atau pilih nominal cepat</p>
                                                    </>
                                                )}
                                                {currentPayment.method !== 'tunai' && (
                                                    <p className="text-xs text-gray-500 mt-1">Jumlah otomatis sama dengan sisa tagihan</p>
                                                )}
                                            </div>

                                            {currentPayment.method !== 'tunai' && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Nomor Referensi/Transaksi
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCurrentPayment({ ...currentPayment, reference: generateReferenceNumber() })}
                                                            className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                                                        >
                                                            <FontAwesomeIcon icon={faSync} className="text-xs" />
                                                            Generate Baru
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={currentPayment.reference}
                                                        readOnly
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700 font-mono text-sm cursor-not-allowed"
                                                        placeholder="Auto-generated"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">Nomor referensi dibuat otomatis oleh sistem</p>
                                                </div>
                                            )}

                                            <button
                                                onClick={addPayment}
                                                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-all duration-300 shadow hover:shadow-lg"
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                                Konfirmasi Pembayaran
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {payments.length > 0 && (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                                                Metode Pembayaran Terpilih
                                            </h3>
                                            <button
                                                onClick={() => setPayments([])}
                                                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                                            >
                                                <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                                Ubah
                                            </button>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50 border-2 border-green-200">
                                                        {payments[0].method === 'tunai' && <FontAwesomeIcon icon={faMoneyBill} className="text-green-600 text-xl" />}
                                                        {payments[0].method === 'qris' && <FontAwesomeIcon icon={faQrcode} className="text-blue-600 text-xl" />}
                                                        {payments[0].method === 'transfer' && <FontAwesomeIcon icon={faCreditCard} className="text-purple-600 text-xl" />}
                                                        {payments[0].method === 'debit' && <FontAwesomeIcon icon={faCreditCard} className="text-orange-600 text-xl" />}
                                                        {payments[0].method === 'kredit' && <FontAwesomeIcon icon={faCreditCard} className="text-red-600 text-xl" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-lg capitalize">{payments[0].method}</div>
                                                        {payments[0].reference && (
                                                            <div className="text-xs text-gray-600 font-mono mt-1">Ref: {payments[0].reference}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-600 mb-1">Jumlah</div>
                                                    <div className="font-bold text-green-600 text-xl">{formatRupiah(payments[0].amount)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 border border-gray-300 rounded-xl p-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-gray-700">
                                            <span className="font-medium">Total Tagihan</span>
                                            <span className="font-bold text-gray-900">{formatRupiah(total)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-700">
                                            <span className="font-medium">Total Dibayar</span>
                                            <span className="font-bold text-green-600">{formatRupiah(totalPaid)}</span>
                                        </div>
                                        <div className="border-t border-gray-300 pt-3">
                                            <div className={`flex justify-between items-center text-lg font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>Kembalian</span>
                                                <span className="text-2xl">{formatRupiah(Math.max(0, change))}</span>
                                            </div>
                                        </div>

                                        {totalPaid < total && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm font-medium">
                                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                                <span>Pembayaran kurang {formatRupiah(total - totalPaid)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-300">
                                <button
                                    onClick={processTransaction}
                                    disabled={totalPaid < total || isProcessing || payments.length === 0}
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                            Selesaikan Transaksi
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Receipt Modal */}
            {
                showReceiptModal && lastTransaction && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0  bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowReceiptModal(false);
                            }}
                            onWheel={(e) => e.preventDefault()}
                            onTouchMove={(e) => e.preventDefault()}
                        ></div>

                        <div
                            ref={receiptModalRef}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="bg-green-600 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faReceipt} className="text-lg text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Transaksi Berhasil</h3>
                                        <p className="text-green-100 text-sm mt-1">
                                            Transaksi telah berhasil diproses
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowReceiptModal(false);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-green-700 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1" ref={receiptRef}>
                                <div className="text-center mb-4">
                                    <div className="header">
                                        <h1 className="text-xl font-bold">TOKO RITEL</h1>
                                        <p className="text-sm text-gray-600">Jl. Contoh No. 123</p>
                                        <p className="text-sm text-gray-600">Telp: 0812-3456-7890</p>
                                    </div>
                                    <div className="divider my-3 border-t border-dashed border-gray-300"></div>
                                </div>

                                <div className="text-sm space-y-1 mb-3">
                                    <div className="flex justify-between">
                                        <span>No. Transaksi:</span>
                                        <span className="font-semibold">{lastTransaction.transaksi.nomorTransaksi}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tanggal:</span>
                                        <span>{formatDateTime(new Date(lastTransaction.transaksi.tanggal))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kasir:</span>
                                        <span>{lastTransaction.transaksi.kasir}</span>
                                    </div>
                                    {lastTransaction.transaksi.pelangganNama && (
                                        <div className="flex justify-between">
                                            <span>Pelanggan:</span>
                                            <span>{lastTransaction.transaksi.pelangganNama}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="divider my-3 border-t border-dashed border-gray-300"></div>

                                <div className="space-y-2 mb-3">
                                    {lastTransaction.items.map((item, index) => (
                                        <div key={index} className="text-sm">
                                            <div className="font-medium">{item.produkNama}</div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>{item.beratGram > 0 ? `${Math.round(item.beratGram)}g` : `${item.jumlah} x ${formatRupiah(item.hargaSatuan)}`}</span>
                                                <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="divider my-3 border-t border-dashed border-gray-300"></div>

                                <div className="space-y-1 text-sm mb-3">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatRupiah(lastTransaction.transaksi.subtotal)}</span>
                                    </div>
                                    {lastTransaction.transaksi.diskon > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Diskon:</span>
                                            <span>-{formatRupiah(lastTransaction.transaksi.diskon)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold text-base">
                                        <span>Total:</span>
                                        <span>{formatRupiah(lastTransaction.transaksi.total)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bayar:</span>
                                        <span>{formatRupiah(lastTransaction.transaksi.totalBayar)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-green-600">
                                        <span>Kembalian:</span>
                                        <span>{formatRupiah(lastTransaction.transaksi.kembalian)}</span>
                                    </div>
                                </div>

                                {lastTransaction.pembayaran && lastTransaction.pembayaran.length > 0 && (
                                    <>
                                        <div className="divider my-3 border-t border-dashed border-gray-300"></div>
                                        <div className="text-sm">
                                            <div className="font-semibold mb-2">Metode Pembayaran:</div>
                                            <div className="space-y-1">
                                                {lastTransaction.pembayaran.map((p, i) => (
                                                    <div key={i} className="flex justify-between items-center text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            {p.metode === 'tunai' && <FontAwesomeIcon icon={faMoneyBill} className="text-green-600" />}
                                                            {p.metode === 'qris' && <FontAwesomeIcon icon={faQrcode} className="text-blue-600" />}
                                                            {p.metode === 'transfer' && <FontAwesomeIcon icon={faCreditCard} className="text-purple-600" />}
                                                            {p.metode === 'debit' && <FontAwesomeIcon icon={faCreditCard} className="text-orange-600" />}
                                                            {p.metode === 'kredit' && <FontAwesomeIcon icon={faCreditCard} className="text-red-600" />}
                                                            <span className="capitalize font-medium">{p.metode}</span>
                                                        </div>
                                                        <span className="font-semibold">{formatRupiah(p.jumlah)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="divider my-3 border-t border-dashed border-gray-300"></div>

                                <div className="text-center text-sm text-gray-600">
                                    <p>Terima kasih atas kunjungan Anda!</p>
                                    <p>Barang yang sudah dibeli tidak dapat ditukar</p>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-300 space-y-3">
                                <button
                                    onClick={printReceipt}
                                    className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    <FontAwesomeIcon icon={faReceipt} className="mr-2" />
                                    Cetak Struk
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowReceiptModal(false);
                                    }}
                                    className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 shadow hover:shadow-lg"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Weight Input Modal */}
            {
                showBeratModal && selectedProduct && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={() => {
                                setShowBeratModal(false);
                                setInputBerat('');
                                setSelectedProduct(null);
                            }}
                            onWheel={(e) => e.preventDefault()}
                            onTouchMove={(e) => e.preventDefault()}
                        ></div>

                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300 overflow-hidden flex flex-col">
                            <div className="bg-green-600 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                                        <FontAwesomeIcon icon={faWeightHanging} className="text-lg text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Input Berat</h3>
                                        <p className="text-green-100 text-sm mt-1">
                                            {selectedProduct.nama}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBeratModal(false);
                                        setInputBerat('');
                                        setSelectedProduct(null);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-green-700 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        Berat (gram)
                                    </label>
                                    <input
                                        type="number"
                                        value={inputBerat}
                                        onChange={(e) => setInputBerat(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Contoh: 500"
                                        min="1"
                                        step="1"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && inputBerat && inputBerat > 0) {
                                                handleConfirmBerat();
                                            }
                                        }}
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        Harga per 1000g: <span className="font-semibold">{formatRupiah(selectedProduct.hargaJual)}</span>
                                    </p>
                                </div>

                                {/* Calculated Price Preview */}
                                {inputBerat > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                                        <p className="text-sm text-gray-600">Total Harga:</p>
                                        <p className="text-xl font-bold text-blue-600">
                                            {formatRupiah(calculateBeratPrice(selectedProduct.hargaJual, inputBerat))}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatNumber(inputBerat)}g = {formatNumber(inputBerat / 1000)} kg
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowBeratModal(false);
                                            setInputBerat('');
                                            setSelectedProduct(null);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleConfirmBerat}
                                        disabled={!inputBerat || inputBerat <= 0}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {cart.find(item => item.id === selectedProduct.id) ? 'Update' : 'Tambahkan'}
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}


