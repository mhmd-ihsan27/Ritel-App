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
    const [appliedPromo, setAppliedPromo] = useState(null);
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

    // Barcode scanner
    const [isScanning, setIsScanning] = useState(false);
    const barcodeInputRef = useRef(null);
    const scanTimeoutRef = useRef(null);

    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Weight input modal state
    const [showBeratModal, setShowBeratModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [inputBerat, setInputBerat] = useState('');
    const [payments, setPayments] = useState([]);
    const [currentPayment, setCurrentPayment] = useState({ method: 'tunai', amount: 0, reference: '' });
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastTransaction, setLastTransaction] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const searchRef = useRef(null);
    const customerSearchRef = useRef(null);
    const receiptRef = useRef(null);
    const receiptModalRef = useRef(null);

    // Prevent body scroll when any modal is open
    // usePreventBodyScrollMultiple(showPaymentModal, showCustomerModal, showReceiptModal, showPromoModal);

    // Debug user object on mount
    useEffect(() => {
        console.log('[DEBUG TRANSAKSI] Component mounted');
        console.log('[DEBUG TRANSAKSI] User object:', user);
        console.log('[DEBUG TRANSAKSI] User ID:', user?.id);
        console.log('[DEBUG TRANSAKSI] User role:', user?.role);
        console.log('[DEBUG TRANSAKSI] User namaLengkap:', user?.namaLengkap);
    }, [user]);

    // Load products and customers from database on mount
    useEffect(() => {
        loadProducts();
        loadCustomers();
        loadActivePromos();
        loadPointSettings();
    }, []);

    // Barcode scanner detection
    useEffect(() => {
        const focusOnBarcodeInput = () => {
            // Jangan fokus ke input barcode jika ada modal yang terbuka
            if (showCustomerModal || showPromoModal || showPaymentModal || showReceiptModal) {
                return;
            }

            if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
                const activeTag = document.activeElement?.tagName;
                if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
                    barcodeInputRef.current.focus();
                }
            }
        };

        focusOnBarcodeInput();

        const handleClick = (e) => {
            // Jangan fokus ke input barcode jika ada modal yang terbuka
            if (showCustomerModal || showPromoModal || showPaymentModal || showReceiptModal) {
                return;
            }

            const targetTag = e.target.tagName;
            if (targetTag !== 'INPUT' && targetTag !== 'TEXTAREA' && targetTag !== 'SELECT' && targetTag !== 'BUTTON') {
                focusOnBarcodeInput();
            }
        };

        document.addEventListener('click', handleClick);
        const focusInterval = setInterval(() => {
            // Jangan fokus ke input barcode jika ada modal yang terbuka
            if (showCustomerModal || showPromoModal || showPaymentModal || showReceiptModal) {
                return;
            }
            focusOnBarcodeInput();
        }, 1000);

        console.log('🔵 Barcode scanner (hidden input) ready');

        return () => {
            document.removeEventListener('click', handleClick);
            clearInterval(focusInterval);
            console.log('🔴 Barcode scanner cleanup');
        };
    }, [showCustomerModal, showPromoModal, showPaymentModal, showReceiptModal]);

    // Handle barcode input change
    const handleBarcodeInput = (e) => {
        const value = e.target.value;

        if (value.length > 0) {
            setIsScanning(true);
            console.log(`📝 Barcode buffer: "${value}"`);

            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            scanTimeoutRef.current = setTimeout(() => {
                if (value.length >= 3) {
                    console.log('✅ BARCODE SCANNED:', value);
                    searchProductByBarcode(value);
                    e.target.value = '';
                    setIsScanning(false);
                } else {
                    console.log('⚠️ Barcode too short:', value);
                    e.target.value = '';
                    setIsScanning(false);
                }
            }, 150);
        }
    };

    // Handle Enter key on barcode input
    const handleBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            const value = e.target.value.trim();

            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            if (value.length >= 3) {
                console.log('✅ BARCODE SCANNED (Enter):', value);
                searchProductByBarcode(value);
                e.target.value = '';
                setIsScanning(false);
            } else if (value.length > 0) {
                console.log('⚠️ Barcode too short:', value);
                e.target.value = '';
                setIsScanning(false);
            }
        } else if (e.key === 'Escape') {
            e.target.value = '';
            setIsScanning(false);
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowProductDropdown(false);
            }
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Effect untuk handle click outside receipt modal
    useEffect(() => {
        const handleClickOutsideReceipt = (event) => {
            if (receiptModalRef.current && !receiptModalRef.current.contains(event.target)) {
                setShowReceiptModal(false);
            }
        };

        if (showReceiptModal) {
            document.addEventListener('mousedown', handleClickOutsideReceipt);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutsideReceipt);
        };
    }, [showReceiptModal]);

    // Effect untuk reset promo ketika produk yang terkait promo dihapus dari keranjang
    useEffect(() => {
        if (appliedPromo && cart.length === 0) {
            removePromo();
        } else if (appliedPromo && promoAppliedProducts.size > 0) {
            const hasRelatedProducts = cart.some(item =>
                promoAppliedProducts.has(item.id)
            );

            if (!hasRelatedProducts) {
                removePromo();
                addToast('Promo dihapus karena produk yang terkait tidak ada di keranjang', 'info');
            }
        }
    }, [cart, appliedPromo, promoAppliedProducts]);

    // Effect untuk mencegah scroll saat modal ditutup
    useEffect(() => {
        const handleModalClose = () => {
            // Simpan posisi scroll saat ini
            const currentScroll = window.scrollY;
            const currentScrollX = window.scrollX;

            // Gunakan requestAnimationFrame untuk memastikan DOM sudah update
            requestAnimationFrame(() => {
                window.scrollTo(currentScrollX, currentScroll);
            });

            // Backup dengan setTimeout jika requestAnimationFrame tidak cukup
            setTimeout(() => {
                window.scrollTo(currentScrollX, currentScroll);
            }, 10);

            setTimeout(() => {
                window.scrollTo(currentScrollX, currentScroll);
            }, 50);
        };

        if (!showCustomerModal && !showPromoModal && !showPaymentModal && !showReceiptModal) {
            handleModalClose();
        }
    }, [showCustomerModal, showPromoModal, showPaymentModal, showReceiptModal]);

    // Scroll position preservation ketika modal ditutup
    useEffect(() => {
        const isAnyModalOpen = showCustomerModal || showPromoModal || showPaymentModal || showReceiptModal;

        if (!isAnyModalOpen) {
            // Ketika semua modal tertutup, pastikan scroll position tetap
            const handleModalClose = () => {
                // Simpan posisi scroll saat ini
                const currentScroll = window.scrollY;
                const currentScrollX = window.scrollX;

                // Gunakan requestAnimationFrame untuk memastikan DOM sudah update
                requestAnimationFrame(() => {
                    window.scrollTo(currentScrollX, currentScroll);
                });

                // Backup dengan setTimeout jika requestAnimationFrame tidak cukup
                setTimeout(() => {
                    window.scrollTo(currentScrollX, currentScroll);
                }, 10);

                setTimeout(() => {
                    window.scrollTo(currentScrollX, currentScroll);
                }, 50);

                setTimeout(() => {
                    window.scrollTo(currentScrollX, currentScroll);
                }, 100);
            };

            handleModalClose();
        }
    }, [showCustomerModal, showPromoModal, showPaymentModal, showReceiptModal]);

    const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const data = await produkAPI.getAll();
            const productArray = Array.isArray(data) ? data : [];
            setProducts(productArray);
            setFilteredProducts(productArray);
        } catch (error) {
            addToast('❌ Gagal memuat produk: ' + error.message, 'error');
            setProducts([]);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
            const data = await pelangganAPI.getAll();
            const customerArray = Array.isArray(data) ? data : [];
            setCustomers(customerArray);
        } catch (error) {
            setCustomers([]);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    const loadActivePromos = async () => {
        try {
            const data = await promoAPI.getActive();
            const promoArray = Array.isArray(data) ? data : [];
            setActivePromos(promoArray);
        } catch (error) {
            setActivePromos([]);
        }
    };

    const loadPointSettings = async () => {
        try {
            const data = await settingsAPI.getPoinSettings();
            setPointSettings(data);
        } catch (error) {
            console.error('Failed to load point settings:', error);
        }
    };

    const searchProductByBarcode = (barcode) => {
        console.log('Searching for barcode:', barcode);
        console.log('Available products:', products.length);

        if (!barcode || barcode.trim().length === 0) {
            console.log('Empty barcode, skipping...');
            return;
        }

        const cleanBarcode = barcode.trim().toUpperCase();
        const product = products.find(p =>
            (p.barcode && p.barcode.toUpperCase() === cleanBarcode) ||
            (p.sku && p.sku.toUpperCase() === cleanBarcode)
        );

        if (product) {
            console.log('Product found:', product.nama);
            addToCart(product, true);
        } else {
            console.log('Product not found for barcode:', cleanBarcode);
            addToast(`❌ Produk dengan barcode "${barcode}" tidak ditemukan`, 'error');
        }
    };

    // Filter customers based on search
    useEffect(() => {
        if (customerSearch.trim() === '') {
            setFilteredCustomers([]);
            return;
        }

        const term = customerSearch.toLowerCase().trim();
        const filtered = customers.filter(c => {
            const nameMatch = c.nama && c.nama.toLowerCase().includes(term);
            const phoneMatch = c.telepon && c.telepon.includes(term);
            return nameMatch || phoneMatch;
        });

        setFilteredCustomers(filtered);
        setShowCustomerDropdown(filtered.length > 0);
    }, [customerSearch, customers]);

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setPointsToRedeem(0); // Reset points when customer changes
        setShowCustomerModal(false);
        addToast(`Pelanggan: ${customer.nama}`, 'info');
        recalculateDiscount();
    };

    const clearCustomer = () => {
        setSelectedCustomer(null);
        setPointsToRedeem(0); // Reset points when customer is cleared
        setPointsDiscount(0);
        recalculateDiscount();
        addToast('Pelanggan dihapus', 'info');
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

        setIsValidatingPromo(true);
        try {
            const { subtotal } = calculateTotals();
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

            const response = await promoAPI.apply({
                kode: promoCode,
                subtotal: subtotal,
                totalQuantity: totalQuantity,
                pelangganId: parseInt(selectedCustomer?.id) || 0,
                items: cart.map(item => ({
                    produkId: item.id,
                    jumlah: item.quantity,
                    hargaSatuan: item.pricePerKg,  // Fix: gunakan pricePerKg bukan price
                    beratGram: item.beratGram || 0  // Fix: tambahkan beratGram untuk produk curah
                }))
            });

            if (response.success) {
                setAppliedPromo(response.promo);
                setPromoDiscount(response.diskonJumlah);

                const relatedProductIds = new Set();

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
                recalculateDiscount();
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

    // Helper function untuk menentukan apakah produk eligible untuk promo
    const isProductEligibleForPromo = (product, promo) => {
        if (promo.kategori && product.category !== promo.kategori) {
            return false;
        }

        if (promo.minHarga && product.price < promo.minHarga) {
            return false;
        }

        if (promo.produkIds && Array.isArray(promo.produkIds) && !promo.produkIds.includes(product.id)) {
            return false;
        }

        return true;
    };

    // Helper function untuk check apakah promo bisa digunakan dengan cart saat ini
    const isPromoEligibleForCart = async (promo) => {
        if (cart.length === 0) {
            return false;
        }

        if (promo.tipe_promo === 'buy_x_get_y') {
            if (!promo.produkX) {
                return false;
            }

            const hasProductX = cart.some(item => item.id === promo.produkX.id);
            if (!hasProductX) {
                return false;
            }

            if (promo.tipeBuyGet === 'beda') {
                if (!promo.produkY) {
                    return false;
                }
                const hasProductY = cart.some(item => item.id === promo.produkY.id);
                if (!hasProductY) {
                    return false;
                }
            }

            return true;
        }

        return true;
    };

    const selectPromo = async (promo) => {
        if (cart.length === 0) {
            addToast('Keranjang kosong, tidak bisa menerapkan promo', 'error');
            return;
        }

        const scrollY = window.scrollY;

        setPromoCode(promo.kode || promo.nama);
        setShowPromoModal(false);

        setIsValidatingPromo(true);
        try {
            const { subtotal } = calculateTotals();
            const response = await promoAPI.apply({
                kode: promo.kode || promo.nama,
                subtotal: subtotal,
                totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
                pelangganId: parseInt(selectedCustomer?.id) || 0,
                items: cart.map(item => ({
                    produkId: item.id,
                    jumlah: item.quantity,
                    hargaSatuan: item.pricePerKg,  // Fix: gunakan pricePerKg bukan price
                    beratGram: item.beratGram || 0  // Fix: tambahkan beratGram untuk produk curah
                }))
            });

            if (response.success) {
                setAppliedPromo(response.promo);
                setPromoDiscount(response.diskonJumlah);

                const relatedProductIds = new Set();

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

                addToast(`🎁 Promo "${response.promo.nama}" diterapkan!`, 'success');
                recalculateDiscount();
            } else {
                addToast(response.message, 'error');
                setPromoCode('');
            }
        } catch (error) {
            addToast('Gagal menerapkan promo: ' + error, 'error');
            setPromoCode('');
        } finally {
            setIsValidatingPromo(false);
        }

        setTimeout(() => {
            window.scrollTo(0, scrollY);
        }, 100);
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setPromoDiscount(0);
        setPromoAppliedProducts(new Set());
        recalculateDiscount();
        addToast('Promo dihapus', 'info');
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

        if (appliedPromo && promoAppliedProducts.has(productId)) {
            const newPromoProducts = new Set(promoAppliedProducts);
            newPromoProducts.delete(productId);

            let hasEligibleProduct = false;

            if (appliedPromo.tipe_promo === 'buy_x_get_y') {
                if (appliedPromo.produkX) {
                    hasEligibleProduct = newCart.some(item => item.id === appliedPromo.produkX.id);

                    if (hasEligibleProduct && appliedPromo.tipeBuyGet === 'beda' && appliedPromo.produkY) {
                        const hasProductY = newCart.some(item => item.id === appliedPromo.produkY.id);
                        hasEligibleProduct = hasProductY;
                    }
                }
            } else {
                hasEligibleProduct = newCart.some(item => newPromoProducts.has(item.id));
            }

            if (!hasEligibleProduct) {
                setAppliedPromo(null);
                setPromoCode('');
                setPromoDiscount(0);
                setPromoAppliedProducts(new Set());
                addToast('Promo dihapus karena produk terkait sudah tidak ada di keranjang', 'info');
            } else {
                setPromoAppliedProducts(newPromoProducts);
            }
        }

        setCart(newCart);
    };

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
                pelangganId: parseInt(selectedCustomer?.id) || 0,
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
                promoKode: appliedPromo?.kode || '',
                poinDitukar: pointsToRedeem,
                diskon: discount,
                catatan: '',
                kasir: user.namaLengkap || 'Kasir',
                staffId: user.id,
                staffNama: user.namaLengkap || 'Kasir'
            };


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
                setAppliedPromo(null);
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

    // Format stok - untuk produk curah max 2 desimal, untuk satuan tidak ada desimal
    const formatStok = (stok, jenisProduk) => {
        if (stok === null || stok === undefined) return 0;

        // Default ke 'satuan' jika jenisProduk tidak ada atau invalid
        const jenisValid = jenisProduk || 'satuan';

        // Jika produk curah, format dengan 2 desimal
        if (jenisValid === 'curah') {
            return Number(stok).toFixed(2);
        }

        // Jika produk satuan atau default, format tanpa desimal
        return Math.floor(stok);
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
                                                    {appliedPromo && promoAppliedProducts.has(item.id) && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                            <FontAwesomeIcon icon={faTags} className="mr-1 text-xs" />
                                                            Promo
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">{item.category}</div>
                                                <div className="text-sm font-semibold text-green-600 mt-1">
                                                    {item.jenisProduk === 'satuan' ? (
                                                        <strong>{item.quantity} pcs</strong>
                                                    ) : (
                                                        <>
                                                            <strong>{item.beratGram}g</strong> <span className="text-gray-400 font-normal">({(item.beratGram / 1000).toFixed(3)} kg)</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    @ {formatRupiah(item.pricePerKg)} / {item.jenisProduk === 'satuan' ? 'pcs' : '1000g'}
                                                </div>

                                                {/* Tampilkan info gratis untuk promo buy_x_get_y */}
                                                {appliedPromo && appliedPromo.tipe_promo === 'buy_x_get_y' && appliedPromo.produkX && item.id === appliedPromo.produkX.id && appliedPromo.tipeBuyGet === 'sama' && (
                                                    (() => {
                                                        const setSize = appliedPromo.buyQuantity + appliedPromo.getQuantity;
                                                        const kelipatan = Math.floor(item.quantity / setSize);
                                                        if (kelipatan > 0) {
                                                            const itemsGratis = kelipatan * appliedPromo.getQuantity;
                                                            const itemsToPay = item.quantity - itemsGratis;
                                                            return (
                                                                <div className="text-xs text-orange-600 mt-1 font-medium">
                                                                    Bayar {itemsToPay}, Bawa {item.quantity} (Gratis {itemsGratis})
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div className="text-xs text-red-600 mt-1 font-medium">
                                                                Tambah {setSize - item.quantity} lagi untuk dapat promo
                                                            </div>
                                                        );
                                                    })()
                                                )}

                                                {appliedPromo && appliedPromo.tipe_promo === 'buy_x_get_y' && appliedPromo.tipeBuyGet === 'beda' && appliedPromo.produkY && item.id === appliedPromo.produkY.id && (
                                                    (() => {
                                                        const productX = cart.find(p => p.id === appliedPromo.produkX?.id);
                                                        if (productX) {
                                                            const kelipatan = Math.floor(productX.quantity / appliedPromo.buyQuantity);
                                                            const totalGratis = kelipatan * appliedPromo.getQuantity;
                                                            const gratisY = Math.min(totalGratis, item.quantity);
                                                            const itemsToPay = item.quantity - gratisY;
                                                            if (gratisY > 0) {
                                                                return (
                                                                    <div className="text-xs text-orange-600 mt-1 font-medium">
                                                                        Bayar {itemsToPay}, Bawa {item.quantity} (Gratis {gratisY})
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    })()
                                                )}
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

                                    {!appliedPromo ? (
                                        <div className="space-y-3">
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    placeholder="Kode promo"
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
                                                        'Apply'
                                                    )}
                                                </button>
                                            </div>

                                            {/* Link untuk melihat promo tersedia */}
                                            <div className="flex justify-between items-center">
                                                <button
                                                    onClick={() => setShowPromoModal(true)}
                                                    disabled={cart.length === 0}
                                                    className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <FontAwesomeIcon icon={faTags} className="text-xs" />
                                                    Lihat Promo Tersedia
                                                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <FontAwesomeIcon icon={faTags} className="text-orange-600 text-sm" />
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm">{appliedPromo.nama}</div>
                                                        <div className="text-xs text-gray-600">{appliedPromo.kode}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={removePromo}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-2">Diskon: {formatRupiah(promoDiscount)}</div>

                                            {/* Info khusus untuk promo buy_x_get_y */}
                                            {appliedPromo.tipe_promo === 'buy_x_get_y' && (
                                                <div className="text-xs bg-orange-100 text-orange-800 p-2 rounded mb-2">
                                                    <div className="font-medium mb-1">
                                                        🎁 Beli {appliedPromo.buyQuantity} Gratis {appliedPromo.getQuantity}
                                                    </div>
                                                    {appliedPromo.tipeBuyGet === 'sama' && appliedPromo.produkX && (
                                                        <div>
                                                            Produk: {appliedPromo.produkX.nama}
                                                        </div>
                                                    )}
                                                    {appliedPromo.tipeBuyGet === 'beda' && appliedPromo.produkX && appliedPromo.produkY && (
                                                        <div>
                                                            Beli: {appliedPromo.produkX.nama}<br />
                                                            Gratis: {appliedPromo.produkY.nama}
                                                        </div>
                                                    )}
                                                    {(() => {
                                                        const productX = cart.find(item => item.id === appliedPromo.produkX?.id);
                                                        if (productX) {
                                                            if (appliedPromo.tipeBuyGet === 'sama') {
                                                                const setSize = appliedPromo.buyQuantity + appliedPromo.getQuantity;
                                                                const kelipatan = Math.floor(productX.quantity / setSize);
                                                                if (kelipatan > 0) {
                                                                    const totalGratis = kelipatan * appliedPromo.getQuantity;
                                                                    return (
                                                                        <div className="mt-1 font-medium">
                                                                            📦 Anda mendapat {totalGratis} item gratis!<br />
                                                                            <span className="text-xs font-normal">
                                                                                (Total {productX.quantity} unit: {productX.quantity - totalGratis} bayar + {totalGratis} gratis)
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="mt-1 font-normal text-xs">
                                                                            ⚠️ Tambah {setSize - productX.quantity} unit lagi untuk dapat promo
                                                                        </div>
                                                                    );
                                                                }
                                                            } else {
                                                                const kelipatan = Math.floor(productX.quantity / appliedPromo.buyQuantity);
                                                                if (kelipatan > 0) {
                                                                    const totalGratis = kelipatan * appliedPromo.getQuantity;
                                                                    return (
                                                                        <div className="mt-1 font-medium">
                                                                            📦 Anda mendapat {totalGratis} {appliedPromo.produkY?.nama} gratis!
                                                                        </div>
                                                                    );
                                                                }
                                                            }
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            )}

                                            {promoAppliedProducts.size > 0 && appliedPromo.tipe_promo !== 'buy_x_get_y' && (
                                                <div className="text-xs text-gray-600">
                                                    Berlaku untuk: {Array.from(promoAppliedProducts).map(id => {
                                                        const product = cart.find(p => p.id === id);
                                                        return product ? product.name : '';
                                                    }).filter(Boolean).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
            </div>

            {/* Customer Modal */}
            {showCustomerModal && (
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
            )}

            {/* Promo Modal */}
            {showPromoModal && (
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
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
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
            )}

            {/* Receipt Modal */}
            {showReceiptModal && lastTransaction && (
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
                                            <span>{item.jumlah} x {formatRupiah(item.hargaSatuan)}</span>
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
            )}

            {/* Weight Input Modal */}
            {showBeratModal && selectedProduct && (
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
                                        {inputBerat}g = {(inputBerat / 1000).toFixed(3)} kg
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
            )}
        </div>
    );
}


