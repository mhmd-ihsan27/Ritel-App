// pages/PromoDiskon.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPercent, faPlus, faEdit, faTrash, faTimes, faSave,
    faTag, faGift, faShoppingCart, faCalendar, faToggleOn, faToggleOff,
    faCheckCircle, faExclamationTriangle, faInfoCircle, faClock,
    faTriangleExclamation, faCalculator, faLightbulb, faTags,
    faFire, faBolt, faBox, faBoxes, faLayerGroup, faSearch,
    faStore, faReceipt, faTicketAlt, faEye
} from '@fortawesome/free-solid-svg-icons';
import { produkAPI, promoAPI } from '../../../api';
import { useToast } from '../../common/ToastContainer';
import { usePreventBodyScrollMultiple } from '../../../hooks/usePreventBodyScroll';
import Pagination from '../../common/Pagination';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';

// Komponen Input yang dioptimasi dengan React.memo
const FormInput = React.memo(({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    required = false,
    min,
    max,
    className = '',
    autoComplete = 'off',
    disabled = false,
    helperText = ''
}) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && '*'}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
                autoComplete={autoComplete}
                disabled={disabled}
            />
            {helperText && (
                <p className="mt-1 text-xs text-gray-500">{helperText}</p>
            )}
        </div>
    );
});

const FormSelect = React.memo(({
    label,
    name,
    value,
    onChange,
    options,
    required = false,
    className = '',
    autoComplete = 'off',
    disabled = false
}) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && '*'}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
                required={required}
                autoComplete={autoComplete}
                disabled={disabled}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
});

const FormTextarea = React.memo(({
    label,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    rows = 3,
    className = '',
    autoComplete = 'off',
    disabled = false
}) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && '*'}
            </label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
                placeholder={placeholder}
                required={required}
                rows={rows}
                autoComplete={autoComplete}
                disabled={disabled}
            />
        </div>
    );
});

// Komponen Preview Section yang terpisah
const PreviewSection = React.memo(({ products, discountType, discountValue, formatRupiah }) => {
    const totalHargaNormal = products.reduce((sum, p) => sum + (p.hargaJual || 0), 0);
    const totalDiskon = products.reduce((sum, p) => {
        const harga = p.hargaJual || 0;
        if (discountType === 'persen') {
            return sum + ((Math.min(discountValue, 90) / 100) * harga);
        } else {
            return sum + Math.min(discountValue, harga);
        }
    }, 0);
    const totalHargaSetelahDiskon = totalHargaNormal - totalDiskon;

    return (
        <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faCalculator} className="text-sm" />
                Preview Hasil
            </h4>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Total Harga Normal:</span>
                    <span className="font-semibold">{formatRupiah(totalHargaNormal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total Diskon:</span>
                    <span className="font-semibold text-red-600">-{formatRupiah(totalDiskon)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Harga Setelah Diskon:</span>
                    <span className="font-bold text-green-600">{formatRupiah(totalHargaSetelahDiskon)}</span>
                </div>
            </div>
        </div>
    );
});

// Komponen Bundling Preview
const BundlingPreview = React.memo(({
    selectedProducts,
    tipeBundling,
    hargaBundling,
    diskonBundling,
    formatRupiah
}) => {
    const calculateBundling = useCallback(() => {
        const totalHargaNormal = selectedProducts.reduce((total, product) => total + (product.hargaJual || 0), 0);
        let hargaBundlingResult = 0;
        let totalPenghematan = 0;

        if (tipeBundling === 'harga_tetap') {
            hargaBundlingResult = parseInt(hargaBundling) || 0;
            totalPenghematan = totalHargaNormal - hargaBundlingResult;
        } else {
            const diskon = parseInt(diskonBundling) || 0;
            const diskonAmount = (diskon / 100) * totalHargaNormal;
            hargaBundlingResult = totalHargaNormal - diskonAmount;
            totalPenghematan = diskonAmount;
        }

        return {
            totalHargaNormal,
            hargaBundling: hargaBundlingResult,
            totalPenghematan,
            isValid: totalPenghematan > 0 && hargaBundlingResult > 0
        };
    }, [selectedProducts, tipeBundling, hargaBundling, diskonBundling]);

    const bundlingResult = calculateBundling();

    if (selectedProducts.length < 2) return null;

    return (
        <div className="bg-white rounded-lg p-4 border border-teal-200">
            <h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faBoxes} className="text-sm" />
                Preview Bundling
            </h4>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Total Harga Normal:</span>
                    <span className="font-semibold">{formatRupiah(bundlingResult.totalHargaNormal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Harga Bundling:</span>
                    <span className="font-semibold text-teal-600">
                        {formatRupiah(bundlingResult.hargaBundling)}
                    </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Penghematan:</span>
                    <span className="font-bold text-green-600">
                        {formatRupiah(bundlingResult.totalPenghematan)}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Penghematan:</span>
                    <span className="text-xs font-bold text-green-600">
                        {Math.round((bundlingResult.totalPenghematan / bundlingResult.totalHargaNormal) * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
});

// Komponen BuyXGetY Preview
const BuyXGetYPreview = React.memo(({ formData, formatRupiah }) => {
    const calculateExample = useCallback(() => {
        const { produkX, produkY, buyQuantity, getQuantity, tipeBuyGet } = formData;
        const qtyBeli = parseInt(buyQuantity) || 0;
        const qtyGratis = parseInt(getQuantity) || 0;

        if (!produkX || qtyBeli <= 0 || qtyGratis <= 0) {
            return null;
        }

        const hargaX = produkX.hargaJual || 0;
        const hargaY = tipeBuyGet === 'sama' ? hargaX : (produkY ? produkY.hargaJual : 0);
        const contohBeli = 6;
        const kelipatan = Math.floor(contohBeli / qtyBeli);
        const totalGratis = kelipatan * qtyGratis;
        const totalBayar = contohBeli;
        const totalHargaNormal = totalBayar * hargaX;
        const totalPotongan = totalGratis * (tipeBuyGet === 'sama' ? hargaX : hargaY);
        const totalHargaAkhir = totalHargaNormal - totalPotongan;

        return {
            contohBeli,
            totalGratis,
            totalHargaNormal,
            totalPotongan,
            totalHargaAkhir
        };
    }, [formData]);

    const example = calculateExample();

    if (!example) return null;

    return (
        <div className="bg-white rounded-lg p-4 border border-lime-200">
            <h4 className="font-semibold text-lime-800 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} className="text-sm" />
                Simulasi Otomatis
            </h4>
            <div className="text-center mb-3">
                <div className="text-lg font-bold text-lime-600">
                    Buy {formData.buyQuantity} Get {formData.getQuantity}
                </div>
                <div className="text-sm text-gray-600">
                    {formData.tipeBuyGet === 'sama' ? 'Produk Sama' : 'Produk Berbeda'}
                </div>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Contoh: Beli {example.contohBeli} item</span>
                    <span className="font-semibold">{example.totalGratis} item gratis</span>
                </div>
                <div className="flex justify-between">
                    <span>Total Harga Normal:</span>
                    <span className="font-semibold">{formatRupiah(example.totalHargaNormal)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Potongan:</span>
                    <span className="font-bold text-green-600">
                        -{formatRupiah(example.totalPotongan)}
                    </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Bayar:</span>
                    <span className="font-bold text-lime-600">
                        {formatRupiah(example.totalHargaAkhir)}
                    </span>
                </div>
            </div>
        </div>
    );
});

// Komponen Modal Utama
const PromoModal = React.memo(({
    showModal,
    editMode,
    loading,
    jenisPromo,
    formData,
    selectedProducts,
    formRef,
    onClose,
    onSubmit,
    onJenisPromoChange,
    onInputChange,
    onNumberChange,
    onOpenProductSelector,
    formatRupiah,
    calculateTotalHargaNormal,
    renderPromoForm
}) => {
    if (!showModal) return null;

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const handleModalClose = () => {
        if (!loading) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={handleModalClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-primary px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FontAwesomeIcon icon={editMode ? faEdit : faPlus} className="text-lg" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">
                                    {editMode ? 'Edit Promo' : 'Buat Promo Baru'}
                                </h2>
                                <p className="text-green-100 text-sm">
                                    {editMode ? 'Perbarui informasi promo' : 'Pilih jenis promo dan lengkapi informasi'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleModalClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pilih Jenis Promo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { value: 'diskon_produk', label: 'Diskon Produk', icon: faPercent, color: 'green' },

                                { value: 'buy_x_get_y', label: 'Buy X Get Y', icon: faGift, color: 'green' }
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => onJenisPromoChange(type.value)}
                                    disabled={loading}
                                    className={`p-4 border-2 rounded-xl text-left transition-all ${jenisPromo === type.value
                                        ? 'border-green-500 bg-green-50 ring-1 ring-green-200'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${jenisPromo === type.value
                                            ? 'bg-green-700 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            <FontAwesomeIcon icon={type.icon} className={jenisPromo === type.value ? 'text-white' : 'text-gray-600'} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{type.label}</h4>
                                            <p className="text-gray-600 text-sm">Buat promo {type.label.toLowerCase()}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form ref={formRef} onSubmit={onSubmit} noValidate>
                        <div className="space-y-6">
                            {/* Render Form Spesifik Berdasarkan Jenis Promo */}
                            {renderPromoForm()}

                            {/* INFORMASI UMUM PROMO */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Umum Promo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Nama Promo"
                                        name="nama"
                                        value={formData.nama}
                                        onChange={onInputChange}
                                        placeholder="Masukkan nama promo"
                                        required
                                        disabled={loading}
                                    />
                                    <FormInput
                                        label="Kode Promo"
                                        name="kode"
                                        value={formData.kode}
                                        onChange={onInputChange}
                                        placeholder="PROMO123"
                                        maxLength="20"
                                        className="font-mono"
                                        disabled={loading}
                                    />
                                    <FormInput
                                        label="Tanggal Mulai"
                                        name="tanggalMulai"
                                        value={formData.tanggalMulai}
                                        onChange={onInputChange}
                                        type="date"
                                        min={getMinDate()}
                                        disabled={loading}
                                    />
                                    <FormInput
                                        label="Tanggal Berakhir"
                                        name="tanggalSelesai"
                                        value={formData.tanggalSelesai}
                                        onChange={onInputChange}
                                        type="date"
                                        min={formData.tanggalMulai || getMinDate()}
                                        disabled={loading}
                                    />
                                    <FormInput
                                        label="Minimum Quantity"
                                        name="minQuantity"
                                        value={formData.minQuantity}
                                        onChange={onNumberChange}
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        disabled={loading}
                                        helperText="Minimum jumlah produk yang harus dibeli untuk aktifkan promo"
                                    />
                                    <FormSelect
                                        label="Tipe Produk Berlaku"
                                        name="tipeProdukBerlaku"
                                        value={formData.tipeProdukBerlaku}
                                        onChange={onInputChange}
                                        options={[
                                            { value: 'semua', label: '🌐 Semua Produk' },
                                            { value: 'curah', label: '⚖️ Curah (kg)' },
                                            { value: 'satuan', label: '📦 Satuan Tetap' }
                                        ]}
                                        disabled={loading || jenisPromo === 'buy_x_get_y'}
                                        helperText={jenisPromo === 'buy_x_get_y' ? 'Buy X Get Y hanya untuk produk satuan tetap' : 'Pilih tipe produk yang berlaku untuk promo ini'}
                                    />
                                    <FormSelect
                                        label="Status Promo"
                                        name="status"
                                        value={formData.status}
                                        onChange={onInputChange}
                                        options={[
                                            { value: 'aktif', label: 'Aktif' },
                                            { value: 'nonaktif', label: 'Nonaktif' }
                                        ]}
                                        disabled={loading}
                                    />
                                    <div className="md:col-span-2">
                                        <FormTextarea
                                            label="Deskripsi"
                                            name="deskripsi"
                                            value={formData.deskripsi}
                                            onChange={onInputChange}
                                            placeholder="Deskripsikan promo secara detail..."
                                            rows="3"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* INFORMASI/HUKUM */}
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                    Informasi Penting
                                </h3>
                                <div className="space-y-2 text-sm text-blue-700">
                                    <div className="flex items-start gap-2">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5 flex-shrink-0" />
                                        <p>Pastikan semua informasi promo sudah benar sebelum disimpan</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FontAwesomeIcon icon={faClock} className="mt-0.5 flex-shrink-0" />
                                        <p>Periode promo harus sesuai dengan tanggal yang ditentukan</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FontAwesomeIcon icon={faShoppingCart} className="mt-0.5 flex-shrink-0" />
                                        <p>Minimum quantity akan diterapkan pada transaksi</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 mt-6">
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    disabled={loading}
                                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2 font-medium"
                                >
                                    <FontAwesomeIcon icon={loading ? faClock : faSave} />
                                    <span>{loading ? 'Menyimpan...' : 'Simpan Promo'}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
});

// Product Selector Modal
const ProductSelectorModal = React.memo(({
    showProductSelector,
    productSelectionType,
    searchTerm,
    filteredProducts,
    selectedProducts,
    formData,
    onClose,
    onSearchChange,
    onProductToggle,
    onSelectProductForX,
    onSelectProductForY,
    formatRupiah
}) => {
    if (!showProductSelector) return null;

    const handleProductSelect = (product) => {
        switch (productSelectionType) {
            case 'diskon':
            case 'bundling':
                onProductToggle(product);
                break;
            case 'produkX':
                onSelectProductForX(product);
                break;
            case 'produkY':
                onSelectProductForY(product);
                break;
            default:
                onProductToggle(product);
        }
    };

    const getSelectedCount = () => {
        switch (productSelectionType) {
            case 'diskon':
            case 'bundling':
                return selectedProducts.length;
            case 'produkX':
                return formData.produkX ? 1 : 0;
            case 'produkY':
                return formData.produkY ? 1 : 0;
            default:
                return 0;
        }
    };

    const isProductSelected = (product) => {
        switch (productSelectionType) {
            case 'diskon':
            case 'bundling':
                return selectedProducts.find(p => p.id === product.id);
            case 'produkX':
                return formData.produkX && formData.produkX.id === product.id;
            case 'produkY':
                return formData.produkY && formData.produkY.id === product.id;
            default:
                return false;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-primary px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faSearch} className="text-lg" />
                            <div>
                                <h2 className="text-xl font-bold">Pilih Produk</h2>
                                <p className="text-green-100 text-sm">
                                    {getSelectedCount()} produk terpilih
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari produk berdasarkan nama atau SKU..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            autoComplete="off"
                        />
                        <FontAwesomeIcon
                            icon={faSearch}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(80vh-140px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleProductSelect(product)}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${isProductSelected(product)
                                    ? 'border-green-500 bg-green-50 ring-1 ring-green-200'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">
                                            {product.nama}
                                        </h4>
                                        <p className="text-gray-600 text-xs mb-2">SKU: {product.sku}</p>
                                        <p className="font-bold text-green-600 text-sm">
                                            {formatRupiah(product.hargaJual)}
                                        </p>
                                    </div>
                                    {isProductSelected(product) && (
                                        <div className="ml-2">
                                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-lg" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">
                            {filteredProducts.length} produk ditemukan
                        </span>
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            {(productSelectionType === 'diskon' || productSelectionType === 'bundling') && (
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Simpan ({selectedProducts.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Preview Promo Modal
const PreviewPromoModal = React.memo(({
    showPreviewModal,
    previewPromo,
    previewProducts,
    loading,
    onClose,
    formatRupiah,
    formatDate,
    getPromoTypeLabel
}) => {
    if (!showPreviewModal || !previewPromo) return null;

    const renderPreviewContent = () => {
        const tipePromo = previewPromo.tipe_promo || previewPromo.tipe;

        switch (tipePromo) {
            case 'diskon_produk':
                return (
                    <div className="space-y-4">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h4 className="font-semibold text-green-800 mb-3">Detail Diskon</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Tipe Diskon:</span>
                                    <p className="font-semibold">{previewPromo.tipe === 'persen' ? 'Persentase' : 'Nominal'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Nilai Diskon:</span>
                                    <p className="font-semibold">
                                        {previewPromo.tipe === 'persen' ? `${previewPromo.nilai}%` : formatRupiah(previewPromo.nilai)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3">Produk yang Terlibat</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {previewProducts.map(product => (
                                    <div key={product.id} className="flex justify-between items-center p-2 border-b border-gray-100">
                                        <div>
                                            <p className="font-medium text-gray-800">{product.nama}</p>
                                            <p className="text-gray-600 text-sm">SKU: {product.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-800">{formatRupiah(product.hargaJual)}</p>
                                            {previewPromo.tipe === 'persen' && (
                                                <p className="text-green-600 text-sm">
                                                    Diskon: {formatRupiah((previewPromo.nilai / 100) * product.hargaJual)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'bundling':
                const totalHargaNormal = previewProducts.reduce((sum, p) => sum + (p.hargaJual || 0), 0);
                const hargaBundling = previewPromo.hargaBundling || 0;
                const penghematan = totalHargaNormal - hargaBundling;

                return (
                    <div className="space-y-4">
                        <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                            <h4 className="font-semibold text-teal-800 mb-3">Detail Bundling</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Tipe Bundling:</span>
                                    <p className="font-semibold">
                                        {previewPromo.tipeBundling === 'harga_tetap' ? 'Harga Tetap' : 'Diskon Persentase'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Harga Bundling:</span>
                                    <p className="font-semibold text-teal-600">{formatRupiah(hargaBundling)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3">Paket Produk</h4>
                            <div className="space-y-3">
                                {previewProducts.map(product => (
                                    <div key={product.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-800">{product.nama}</p>
                                            <p className="text-gray-600 text-sm">SKU: {product.sku}</p>
                                        </div>
                                        <p className="font-semibold text-gray-800">{formatRupiah(product.hargaJual)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total Harga Normal:</span>
                                    <span className="font-bold text-gray-800">{formatRupiah(totalHargaNormal)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-semibold text-green-600">Total Penghematan:</span>
                                    <span className="font-bold text-green-600">{formatRupiah(penghematan)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'buy_x_get_y':
                return (
                    <div className="space-y-4">
                        <div className="bg-lime-50 rounded-lg p-4 border border-lime-200">
                            <h4 className="font-semibold text-lime-800 mb-3">Detail Buy X Get Y</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Tipe:</span>
                                    <p className="font-semibold">
                                        {previewPromo.tipeBuyGet === 'sama' ? 'Produk Sama' : 'Produk Berbeda'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Promo:</span>
                                    <p className="font-semibold text-lime-600">
                                        Beli {previewPromo.buyQuantity} Get {previewPromo.getQuantity}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3">Produk yang Terlibat</h4>
                            <div className="space-y-3">
                                <div className="p-3 border border-lime-200 rounded-lg bg-lime-50">
                                    <p className="font-semibold text-lime-700 mb-2">Produk X (Dibeli)</p>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-800">{previewPromo.produkX?.nama || 'Tidak tersedia'}</p>
                                            <p className="text-gray-600 text-sm">Harga: {formatRupiah(previewPromo.produkX?.hargaJual || 0)}</p>
                                        </div>
                                        <p className="font-semibold">Beli: {previewPromo.buyQuantity}</p>
                                    </div>
                                </div>
                                {previewPromo.tipeBuyGet === 'beda' && previewPromo.produkY && (
                                    <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                                        <p className="font-semibold text-green-700 mb-2">Produk Y (Gratis)</p>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800">{previewPromo.produkY.nama}</p>
                                                <p className="text-gray-600 text-sm">Harga: {formatRupiah(previewPromo.produkY.hargaJual)}</p>
                                            </div>
                                            <p className="font-semibold text-green-600">Gratis: {previewPromo.getQuantity}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <p className="text-gray-600">Tipe promo tidak dikenali</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-primary px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faEye} className="text-lg" />
                            <div>
                                <h2 className="text-xl font-bold">Preview Promo</h2>
                                <p className="text-green-100 text-sm">
                                    Detail informasi promo dan produk yang terlibat
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Memuat data produk...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{previewPromo.nama}</h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 font-medium`}>
                                                {getPromoTypeLabel(previewPromo.tipe_promo || previewPromo.tipe)}
                                            </span>
                                            {previewPromo.kode && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono font-medium">
                                                    {previewPromo.kode}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${previewPromo.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} font-medium`}>
                                            {previewPromo.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                </div>
                                {previewPromo.deskripsi && (
                                    <p className="text-gray-600 mt-3 text-sm">{previewPromo.deskripsi}</p>
                                )}
                            </div>

                            {/* Periode Promo */}
                            {(previewPromo.tanggalMulai || previewPromo.tanggalSelesai) && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-2">Periode Promo</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Mulai:</span>
                                            <p className="font-semibold">{formatDate(previewPromo.tanggalMulai)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Berakhir:</span>
                                            <p className="font-semibold">{formatDate(previewPromo.tanggalSelesai)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Minimum Quantity */}
                            {previewPromo.minQuantity > 0 && (
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <h4 className="font-semibold text-orange-800 mb-2">Syarat & Ketentuan</h4>
                                    <p className="text-sm">
                                        Minimum quantity: <span className="font-semibold">{previewPromo.minQuantity} produk</span>
                                    </p>
                                </div>
                            )}

                            {/* Content Spesifik berdasarkan Tipe Promo */}
                            {renderPreviewContent()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const PromoDiskon = () => {
    const [promos, setPromos] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // State untuk konfirmasi delete
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState(null);

    // State untuk preview promo
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewPromo, setPreviewPromo] = useState(null);
    const [previewProducts, setPreviewProducts] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // State untuk jenis promo
    const [jenisPromo, setJenisPromo] = useState('diskon_produk');
    const [formData, setFormData] = useState({
        id: 0,
        nama: '',
        kode: '',
        tipe: 'persen',
        nilai: 0,
        minQuantity: 0,        // DIUBAH: minPembelian -> minQuantity
        maxDiskon: 0,
        tanggalMulai: '',
        tanggalSelesai: '',
        status: 'aktif',
        deskripsi: '',
        buyQuantity: 0,
        getQuantity: 0,
        hargaBundling: 0,
        produkIds: [],
        tipeBundling: 'harga_tetap',
        diskonBundling: 0,
        produkX: null,
        produkY: null,
        tipeBuyGet: 'sama',
        tipeProdukBerlaku: 'semua'  // Tambahan: filter promo untuk curah/satuan/semua
    });

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [productSelectionType, setProductSelectionType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Ref untuk form elements
    const formRef = useRef(null);

    // TAMBAHAN: State untuk menyimpan form data sementara untuk mencegah refresh
    const [formCache, setFormCache] = useState({});

    // Prevent body scroll when modal is open
    usePreventBodyScrollMultiple(showModal || showDeleteConfirm || showProductSelector || showPreviewModal);

    // PERBAIKAN: Scroll preservation
    const scrollPositionRef = useRef(0);

    useEffect(() => {
        loadPromos();
        loadProducts();
    }, []);

    // PERBAIKAN: Handle scroll preservation ketika modal dibuka
    useEffect(() => {
        if (showModal || showDeleteConfirm || showProductSelector || showPreviewModal) {
            scrollPositionRef.current = window.scrollY;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Tidak perlu restore scroll position karena kita tidak ingin page ke atas
        }
    }, [showModal, showDeleteConfirm, showProductSelector, showPreviewModal]);

    const loadPromos = async () => {
        try {
            const result = await promoAPI.getAll();
            setPromos(result || []);
        } catch (error) {
            console.error('Error loading promos:', error);
            toast.showError('Gagal memuat data promo');
        }
    };

    const loadProducts = async () => {
        try {
            const result = await produkAPI.getAll();
            setProducts(result || []);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.showError('Gagal memuat data produk');
        }
    };

    // PERBAIKAN: Simpan cache form sebelum menutup modal
    const handleModalClose = useCallback(() => {
        if (!editMode && formData.nama) {
            setFormCache(prev => ({
                ...prev,
                [jenisPromo]: { ...formData, selectedProducts: [...selectedProducts] }
            }));
        }
        setShowModal(false);
    }, [editMode, formData, jenisPromo, selectedProducts]);

    const resetForm = useCallback(() => {
        // PERBAIKAN: Cek apakah ada cache untuk jenis promo ini
        const cachedData = formCache[jenisPromo] || {};

        setFormData(prev => ({
            id: 0,
            nama: cachedData.nama || '',
            kode: cachedData.kode || '',
            tipe: cachedData.tipe || 'persen',
            nilai: cachedData.nilai || 0,
            minQuantity: cachedData.minQuantity || 0,  // DIUBAH: minPembelian -> minQuantity
            maxDiskon: cachedData.maxDiskon || 0,
            tanggalMulai: cachedData.tanggalMulai || '',
            tanggalSelesai: cachedData.tanggalSelesai || '',
            status: cachedData.status || 'aktif',
            deskripsi: cachedData.deskripsi || '',
            buyQuantity: cachedData.buyQuantity || 0,
            getQuantity: cachedData.getQuantity || 0,
            hargaBundling: cachedData.hargaBundling || 0,
            produkIds: cachedData.produkIds || [],
            tipeBundling: cachedData.tipeBundling || 'harga_tetap',
            diskonBundling: cachedData.diskonBundling || 0,
            produkX: cachedData.produkX || null,
            produkY: cachedData.produkY || null,
            tipeBuyGet: cachedData.tipeBuyGet || 'sama'
        }));

        setSelectedProducts(cachedData.selectedProducts || []);
        setEditMode(false);
        setSearchTerm('');
    }, [formCache, jenisPromo]);

    const handleOpenModal = useCallback(() => {
        resetForm();
        setShowModal(true);
    }, [resetForm]);

    const handleEditPromo = useCallback(async (promo) => {
        setEditMode(true);
        setJenisPromo(promo.tipe_promo || promo.tipe);

        let promoProducts = [];
        try {
            const products = await promoAPI.getProducts(promo.id);
            promoProducts = products || [];
            setSelectedProducts(promoProducts);
        } catch (error) {
            console.error('Error loading promo products:', error);
            toast.showError('Gagal memuat produk promo');
        }
        setFormData({
            id: promo.id,
            nama: promo.nama,
            kode: promo.kode || '',
            tipe: promo.tipe,
            nilai: promo.nilai,
            minQuantity: promo.minQuantity || 0,  // DIUBAH: minPembelian -> minQuantity
            maxDiskon: promo.maxDiskon,
            tanggalMulai: promo.tanggalMulai ? promo.tanggalMulai.split('T')[0] : '',
            tanggalSelesai: promo.tanggalSelesai ? promo.tanggalSelesai.split('T')[0] : '',
            status: promo.status,
            deskripsi: promo.deskripsi || '',
            buyQuantity: promo.buyQuantity || 0,
            getQuantity: promo.getQuantity || 0,
            hargaBundling: promo.hargaBundling || 0,
            produkIds: promoProducts.map(p => p.id),
            tipeBundling: promo.tipeBundling || 'harga_tetap',
            diskonBundling: promo.diskonBundling || 0,
            produkX: promo.produkX || null,
            produkY: promo.produkY || null,
            tipeBuyGet: promo.tipeBuyGet || 'sama',
            tipeProdukBerlaku: promo.tipeProdukBerlaku || 'semua'
        });
        setShowModal(true);
    }, []);

    const handleDeleteClick = useCallback((promo) => {
        setPromoToDelete(promo);
        setShowDeleteConfirm(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!promoToDelete) return;
        try {
            await promoAPI.delete(promoToDelete.id);
            toast.showSuccess('Promo berhasil dihapus');
            loadPromos();
        } catch (error) {
            console.error('Error deleting promo:', error);
            toast.showError('Gagal menghapus promo');
        } finally {
            setShowDeleteConfirm(false);
            setPromoToDelete(null);
        }
    };

    const handleCancelDelete = useCallback(() => {
        setShowDeleteConfirm(false);
        setPromoToDelete(null);
    }, []);

    // PERBAIKAN: Fungsi untuk preview promo
    const handlePreviewPromo = useCallback(async (promo) => {
        try {
            setLoading(true);
            const products = await promoAPI.getProducts(promo.id);
            setPreviewProducts(products || []);
            setPreviewPromo(promo);
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Error loading preview products:', error);
            toast.showError('Gagal memuat data produk untuk preview');
        } finally {
            setLoading(false);
        }
    }, []);

    // TAMBAHAN: Fungsi untuk mendapatkan tanggal minimum (tahun ini)
    const getMinDate = useCallback(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }, []);

    // PERBAIKAN UTAMA: Handle input change yang disederhanakan
    const handleDirectInputChange = useCallback((e) => {
        const { name, value } = e.target;

        if (name === 'kode') {
            const sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: sanitizedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }, []);

    // PERBAIKAN UTAMA: Handle number change yang disederhanakan
    const handleDirectNumberChange = useCallback((e) => {
        const { name, value } = e.target;

        if (value === '') {
            setFormData(prev => ({ ...prev, [name]: '' }));
        } else {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue >= 0) {
                setFormData(prev => ({ ...prev, [name]: numValue }));
            }
        }
    }, []);

    const handleJenisPromoChange = useCallback((newJenisPromo) => {
        if (jenisPromo !== newJenisPromo) {
            setJenisPromo(newJenisPromo);
            setFormData(prev => ({
                ...prev,
                tipe: newJenisPromo === 'diskon_produk' ? 'persen' : prev.tipe,
                tipeBundling: newJenisPromo === 'bundling' ? 'harga_tetap' : prev.tipeBundling,
                tipeBuyGet: newJenisPromo === 'buy_x_get_y' ? 'sama' : prev.tipeBuyGet,
                tipeProdukBerlaku: newJenisPromo === 'buy_x_get_y' ? 'satuan' : prev.tipeProdukBerlaku,
                produkX: newJenisPromo === 'buy_x_get_y' ? null : prev.produkX,
                produkY: newJenisPromo === 'buy_x_get_y' ? null : prev.produkY
            }));
            if (newJenisPromo !== 'diskon_produk' && newJenisPromo !== 'bundling') {
                setSelectedProducts([]);
            }
        }
    }, [jenisPromo]);

    const validateForm = () => {
        if (!formData.nama.trim()) {
            toast.showError('Nama promo tidak boleh kosong');
            return false;
        }

        const today = new Date();
        const currentYear = today.getFullYear();

        if (formData.tanggalMulai) {
            const startDate = new Date(formData.tanggalMulai);
            const startYear = startDate.getFullYear();

            if (startYear < currentYear || isNaN(startYear)) {
                toast.showError(`Tanggal mulai harus tahun ${currentYear} atau setelahnya`);
                return false;
            }
        }

        if (formData.tanggalSelesai) {
            const endDate = new Date(formData.tanggalSelesai);
            const endYear = endDate.getFullYear();

            if (endYear < currentYear || isNaN(endYear)) {
                toast.showError(`Tanggal berakhir harus tahun ${currentYear} atau setelahnya`);
                return false;
            }
        }

        if (formData.tanggalMulai && formData.tanggalSelesai) {
            const startDate = new Date(formData.tanggalMulai);
            const endDate = new Date(formData.tanggalSelesai);

            if (endDate < startDate) {
                toast.showError('Tanggal berakhir tidak boleh lebih kecil dari tanggal mulai');
                return false;
            }
        }

        if (formData.kode && !/^[A-Z0-9_\-]+$/.test(formData.kode)) {
            toast.showError('Kode promo hanya boleh berisi huruf kapital, angka, underscore, atau strip');
            return false;
        }

        if (formData.minQuantity < 0) {
            toast.showError('Minimum quantity tidak boleh negatif');
            return false;
        }

        switch (jenisPromo) {
            case 'diskon_produk':
                if (selectedProducts.length === 0) {
                    toast.showError('Pilih minimal 1 produk untuk diskon');
                    return false;
                }
                if (formData.tipe === 'persen' && (formData.nilai <= 0 || formData.nilai > 90)) {
                    toast.showError('Diskon persentase harus antara 1% - 90%');
                    return false;
                }
                if (formData.tipe === 'nominal' && formData.nilai <= 0) {
                    toast.showError('Diskon nominal harus lebih dari 0');
                    return false;
                }
                break;
            case 'bundling':
                if (selectedProducts.length < 2) {
                    toast.showError('Minimal pilih 2 produk untuk bundling');
                    return false;
                }
                if (formData.tipeBundling === 'harga_tetap' && formData.hargaBundling <= 0) {
                    toast.showError('Harga bundling harus lebih dari 0');
                    return false;
                }
                if (formData.tipeBundling === 'diskon_persen' && (formData.diskonBundling <= 0 || formData.diskonBundling > 90)) {
                    toast.showError('Diskon bundling harus antara 1% - 90%');
                    return false;
                }
                break;
            case 'buy_x_get_y':
                if (!formData.produkX) {
                    toast.showError('Pilih produk X (produk yang dibeli)');
                    return false;
                }
                if (formData.tipeBuyGet === 'beda' && !formData.produkY) {
                    toast.showError('Pilih produk Y (produk gratis)');
                    return false;
                }
                if (formData.buyQuantity <= 0 || formData.getQuantity <= 0) {
                    toast.showError('Jumlah produk yang dibeli dan gratis harus lebih dari 0');
                    return false;
                }
                break;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        try {
            if (!validateForm()) {
                setLoading(false);
                return;
            }

            const payload = {
                ...formData,
                tipe_promo: jenisPromo,
                nilai: Number(formData.nilai) || 0,
                minQuantity: Number(formData.minQuantity) || 0,  // DIUBAH: minPembelian -> minQuantity
                maxDiskon: Number(formData.maxDiskon) || 0,
                buyQuantity: Number(formData.buyQuantity) || 0,
                getQuantity: Number(formData.getQuantity) || 0,
                hargaBundling: Number(formData.hargaBundling) || 0,
                diskonBundling: Number(formData.diskonBundling) || 0,
                produkIds: selectedProducts.map(p => p.id),
                produkX: formData.produkX ? formData.produkX.id : null,
                produkY: formData.produkY ? formData.produkY.id : null
            };

            if (editMode) {
                await promoAPI.update(payload);
                toast.showSuccess('Promo berhasil diupdate');
            } else {
                await promoAPI.create(payload);
                toast.showSuccess('Promo berhasil ditambahkan');
            }

            setFormCache(prev => {
                const newCache = { ...prev };
                delete newCache[jenisPromo];
                return newCache;
            });

            setShowModal(false);
            resetForm();
            loadPromos();
        } catch (error) {
            console.error('Error saving promo:', error);
            toast.showError(error.message || 'Gagal menyimpan promo');
        } finally {
            setLoading(false);
        }
    };

    const handleProductToggle = useCallback((product) => {
        setSelectedProducts(prev => {
            const isSelected = prev.find(p => p.id === product.id);
            if (isSelected) {
                return prev.filter(p => p.id !== product.id);
            } else {
                return [...prev, product];
            }
        });
    }, []);

    const openProductSelector = useCallback((type) => {
        setProductSelectionType(type);
        setShowProductSelector(true);
        setSearchTerm('');
    }, []);

    const selectProductForX = useCallback((product) => {
        setFormData(prev => ({ ...prev, produkX: product }));
        setShowProductSelector(false);
    }, []);

    const selectProductForY = useCallback((product) => {
        setFormData(prev => ({ ...prev, produkY: product }));
        setShowProductSelector(false);
    }, []);

    const calculateTotalHargaNormal = useCallback(() => {
        return selectedProducts.reduce((total, product) => total + (product.hargaJual || 0), 0);
    }, [selectedProducts]);

    const calculateBundling = useCallback(() => {
        const totalHargaNormal = calculateTotalHargaNormal();
        let hargaBundling = 0;
        let totalPenghematan = 0;
        if (formData.tipeBundling === 'harga_tetap') {
            hargaBundling = parseInt(formData.hargaBundling) || 0;
            totalPenghematan = totalHargaNormal - hargaBundling;
        } else {
            const diskon = parseInt(formData.diskonBundling) || 0;
            const diskonAmount = (diskon / 100) * totalHargaNormal;
            hargaBundling = totalHargaNormal - diskonAmount;
            totalPenghematan = diskonAmount;
        }
        return {
            totalHargaNormal,
            hargaBundling,
            totalPenghematan,
            isValid: totalPenghematan > 0 && hargaBundling > 0
        };
    }, [calculateTotalHargaNormal, formData.tipeBundling, formData.hargaBundling, formData.diskonBundling]);

    const formatRupiah = useCallback((amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    const getPromoTypeLabel = useCallback((tipe) => {
        const labels = {
            'persen': 'Diskon Persentase',
            'nominal': 'Diskon Nominal',
            'bundling': 'Promo Bundling',
            'buy_x_get_y': 'Buy X Get Y',
            'diskon_produk': 'Diskon Produk'
        };
        return labels[tipe] || tipe;
    }, []);

    const getPromoHoverStyle = useCallback((tipePromo) => {
        switch (tipePromo) {
            case 'diskon_produk':
                return 'hover:border-green-300 hover:bg-green-25';
            case 'bundling':
                return 'hover:border-teal-300 hover:bg-teal-25';
            case 'buy_x_get_y':
                return 'hover:border-lime-300 hover:bg-lime-25';
            default:
                return 'hover:border-green-300 hover:bg-green-25';
        }
    }, []);

    const getPromoTypeColor = useCallback((tipe) => {
        const colors = {
            'persen': 'bg-green-100 text-green-800 border border-green-200',
            'nominal': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
            'bundling': 'bg-teal-100 text-teal-800 border border-teal-200',
            'buy_x_get_y': 'bg-lime-100 text-lime-800 border border-lime-200',
            'diskon_produk': 'bg-green-100 text-green-800 border border-green-200'
        };
        return colors[tipe] || 'bg-gray-100 text-gray-800 border border-gray-200';
    }, []);

    const getPromoStatusInfo = useCallback((promo) => {
        if (promo.status !== 'aktif') {
            return { status: 'nonaktif', label: 'Nonaktif', color: 'gray' };
        }
        const now = new Date();
        const start = promo.tanggalMulai ? new Date(promo.tanggalMulai) : null;
        const end = promo.tanggalSelesai ? new Date(promo.tanggalSelesai) : null;
        if (start && now < start) {
            const diffTime = start - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                status: 'akan_datang',
                label: `Mulai dalam ${diffDays} hari`,
                color: 'green'
            };
        }
        if (end && now > end) {
            return { status: 'berakhir', label: 'Sudah Berakhir', color: 'red' };
        }
        if (end) {
            const diffTime = end - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
                status: 'berlangsung',
                label: `Berakhir dalam ${diffDays} hari`,
                color: 'green'
            };
        }
        return { status: 'berlangsung', label: 'Sedang Berlangsung', color: 'green' };
    }, []);

    const filteredProducts = useMemo(() =>
        products.filter(product =>
            product.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ), [products, searchTerm]
    );

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    }, []);

    const totalItems = promos.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPromos = promos.slice(startIndex, endIndex);

    const getPromoValueDisplay = useCallback((promo) => {
        const tipePromo = promo.tipe_promo || promo.tipe;

        return (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                {/* Value display utama */}
                {getPromoMainValueDisplay(promo)}

                {/* Tampilkan min quantity jika ada */}
                {promo.minQuantity > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                        <div className="text-xs text-gray-500">Min. Quantity</div>
                        <div className="text-sm font-semibold text-orange-600">
                            {promo.minQuantity} produk
                        </div>
                    </div>
                )}
            </div>
        );
    }, [formatRupiah]);

    // Helper function untuk display utama
    const getPromoMainValueDisplay = useCallback((promo) => {
        const tipePromo = promo.tipe_promo || promo.tipe;
        switch (tipePromo) {
            case 'diskon_produk':
                if (promo.tipe === 'persen') {
                    return (
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{promo.nilai}%</div>
                            <div className="text-xs text-gray-500">Diskon</div>
                        </div>
                    );
                } else {
                    return (
                        <div className="text-center">
                            <div className="text-xl font-bold text-emerald-600">{formatRupiah(promo.nilai)}</div>
                            <div className="text-xs text-gray-500">Potongan</div>
                        </div>
                    );
                }
            case 'bundling':
                return (
                    <div className="text-center">
                        <div className="text-lg font-bold text-teal-600">{formatRupiah(promo.hargaBundling)}</div>
                        <div className="text-xs text-gray-500">Harga Paket</div>
                    </div>
                );
            case 'buy_x_get_y':
                return (
                    <div className="text-center">
                        <div className="text-lg font-bold text-lime-600">
                            Beli {promo.buyQuantity}
                        </div>
                        <div className="text-xs text-gray-500">
                            Gratis {promo.getQuantity}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }, [formatRupiah]);

    // ===============================
    // RENDER FORM FUNCTIONS - DIPERBAIKI
    // ===============================
    const renderDiskonProdukForm = useCallback(() => (
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Diskon Produk</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilih Produk *
                    </label>
                    <button
                        type="button"
                        onClick={() => openProductSelector('diskon')}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        {selectedProducts.length > 0 ? (
                            <div>
                                <span className="font-semibold">{selectedProducts.length} produk terpilih</span>
                                <span className="text-gray-500 text-sm block">
                                    Total harga: {formatRupiah(selectedProducts.reduce((sum, p) => sum + (p.hargaJual || 0), 0))}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-500">Pilih produk...</span>
                        )}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                        label="Tipe Diskon"
                        name="tipe"
                        value={formData.tipe}
                        onChange={handleDirectInputChange}
                        options={[
                            { value: 'persen', label: 'Persentase (%)' },
                            { value: 'nominal', label: 'Nominal (Rp)' }
                        ]}
                        disabled={loading}
                    />
                    <FormInput
                        label={formData.tipe === 'persen' ? 'Diskon (%)' : 'Diskon (Rp)'}
                        name="nilai"
                        value={formData.nilai}
                        onChange={handleDirectNumberChange}
                        type="number"
                        min="0"
                        max={formData.tipe === 'persen' ? '90' : undefined}
                        required
                        disabled={loading}
                    />
                </div>
                {selectedProducts.length > 0 && formData.nilai > 0 && (
                    <PreviewSection
                        products={selectedProducts}
                        discountType={formData.tipe}
                        discountValue={formData.nilai}
                        formatRupiah={formatRupiah}
                    />
                )}
            </div>
        </div>
    ), [formData.tipe, formData.nilai, selectedProducts, openProductSelector, handleDirectInputChange, handleDirectNumberChange, formatRupiah, loading]);

    const renderBundlingForm = useCallback(() => {
        return (
            <div className="bg-teal-50 rounded-xl p-5 border border-teal-200">
                <h3 className="text-lg font-semibold text-teal-800 mb-4">Promo Bundling</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Produk Bundling * (Minimal 2 produk)
                        </label>
                        <button
                            type="button"
                            onClick={() => openProductSelector('bundling')}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left hover:bg-gray-50 transition-colors"
                            autoComplete="off"
                            disabled={loading}
                        >
                            {selectedProducts.length > 0 ? (
                                <div>
                                    <span className="font-semibold">{selectedProducts.length} produk terpilih</span>
                                    <span className="text-gray-500 text-sm block">
                                        Total harga normal: {formatRupiah(calculateTotalHargaNormal())}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-500">Pilih produk untuk bundling...</span>
                            )}
                        </button>
                    </div>
                    <FormSelect
                        label="Tipe Bundling"
                        name="tipeBundling"
                        value={formData.tipeBundling}
                        onChange={handleDirectInputChange}
                        options={[
                            { value: 'harga_tetap', label: 'Harga Bundling Tetap' },
                            { value: 'diskon_persen', label: 'Diskon Persentase' }
                        ]}
                        disabled={loading}
                    />
                    {formData.tipeBundling === 'harga_tetap' ? (
                        <FormInput
                            label="Harga Bundling (Rp) *"
                            name="hargaBundling"
                            value={formData.hargaBundling}
                            onChange={handleDirectNumberChange}
                            type="number"
                            min="0"
                            placeholder="Masukkan harga bundling"
                            required
                            disabled={loading}
                        />
                    ) : (
                        <FormInput
                            label="Diskon Bundling (%) *"
                            name="diskonBundling"
                            value={formData.diskonBundling}
                            onChange={handleDirectNumberChange}
                            type="number"
                            min="0"
                            max="90"
                            placeholder="Masukkan diskon persentase"
                            required
                            disabled={loading}
                        />
                    )}
                    {selectedProducts.length >= 2 && (
                        <BundlingPreview
                            selectedProducts={selectedProducts}
                            tipeBundling={formData.tipeBundling}
                            hargaBundling={formData.hargaBundling}
                            diskonBundling={formData.diskonBundling}
                            formatRupiah={formatRupiah}
                        />
                    )}
                    {selectedProducts.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <h5 className="font-medium text-gray-700 mb-2">Produk Terpilih:</h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedProducts.map(product => (
                                    <div key={product.id} className="flex justify-between items-center text-sm">
                                        <span className="truncate flex-1">{product.nama}</span>
                                        <span className="font-semibold ml-2">{formatRupiah(product.hargaJual)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }, [formData.tipeBundling, formData.hargaBundling, formData.diskonBundling, selectedProducts, calculateTotalHargaNormal, openProductSelector, handleDirectInputChange, handleDirectNumberChange, formatRupiah, loading]);

    const renderBuyXGetYForm = useCallback(() => {
        return (
            <div className="bg-lime-50 rounded-xl p-5 border border-lime-200">
                <h3 className="text-lg font-semibold text-lime-800 mb-4">Buy X Get Y</h3>
                <div className="space-y-4">
                    <FormSelect
                        label="Tipe Promo"
                        name="tipeBuyGet"
                        value={formData.tipeBuyGet}
                        onChange={handleDirectInputChange}
                        options={[
                            { value: 'sama', label: 'Buy X Get X (Produk Sama)' },
                            { value: 'beda', label: 'Buy X Get Y (Produk Berbeda)' }
                        ]}
                        disabled={loading}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Produk X (Produk yang Dibeli) *
                            </label>
                            <button
                                type="button"
                                onClick={() => openProductSelector('produkX')}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left hover:bg-gray-50 transition-colors"
                                autoComplete="off"
                                disabled={loading}
                            >
                                {formData.produkX ? (
                                    <div>
                                        <span className="font-semibold">{formData.produkX.nama}</span>
                                        <span className="text-gray-500 text-sm block">
                                            Harga: {formatRupiah(formData.produkX.hargaJual)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-gray-500">Pilih produk X...</span>
                                )}
                            </button>
                        </div>
                        {formData.tipeBuyGet === 'beda' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Produk Y (Produk Gratis) *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => openProductSelector('produkY')}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left hover:bg-gray-50 transition-colors"
                                    autoComplete="off"
                                    disabled={loading}
                                >
                                    {formData.produkY ? (
                                        <div>
                                            <span className="font-semibold">{formData.produkY.nama}</span>
                                            <span className="text-gray-500 text-sm block">
                                                Harga: {formatRupiah(formData.produkY.hargaJual)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">Pilih produk Y...</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="Beli (X) *"
                            name="buyQuantity"
                            value={formData.buyQuantity}
                            onChange={handleDirectNumberChange}
                            type="number"
                            min="1"
                            placeholder="Jumlah beli"
                            required
                            disabled={loading}
                        />
                        <FormInput
                            label="Gratis (Y) *"
                            name="getQuantity"
                            value={formData.getQuantity}
                            onChange={handleDirectNumberChange}
                            type="number"
                            min="1"
                            placeholder="Jumlah gratis"
                            required
                            disabled={loading}
                        />
                    </div>
                    <BuyXGetYPreview
                        formData={formData}
                        formatRupiah={formatRupiah}
                    />
                </div>
            </div>
        );
    }, [formData, openProductSelector, handleDirectInputChange, handleDirectNumberChange, formatRupiah, loading]);

    const renderPromoForm = useCallback(() => {
        switch (jenisPromo) {
            case 'diskon_produk':
                return renderDiskonProdukForm();
            case 'bundling':
                return renderBundlingForm();
            case 'buy_x_get_y':
                return renderBuyXGetYForm();
            default:
                return null;
        }
    }, [jenisPromo, renderDiskonProdukForm, renderBundlingForm, renderBuyXGetYForm]);

    return (
        <div className="page min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-4">
                    <div className="bg-primary p-4 rounded-2xl shadow-lg">
                        <FontAwesomeIcon icon={faPercent} className="text-white text-3xl" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Promo & Diskon</h2>
                        <p className="text-gray-600">Kelola promosi dan diskon untuk meningkatkan penjualan</p>
                    </div>
                </div>
            </div>
            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-primary px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faGift} className="text-xl" />
                            <h3 className="text-xl font-semibold">Daftar Promo</h3>
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="bg-white hover:bg-green-50 text-green-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium shadow-sm"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Tambah Promo</span>
                        </button>
                    </div>
                </div>
                {/* Promo List */}
                <div className="p-6">
                    {promos.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FontAwesomeIcon icon={faGift} className="text-2xl text-green-600" />
                            </div>
                            <p className="text-gray-800 font-semibold text-lg mb-2">Belum Ada Promo</p>
                            <p className="text-gray-600 text-sm mb-4">
                                Klik tombol "Tambah Promo" untuk membuat promo baru
                            </p>
                            <button
                                onClick={handleOpenModal}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors mx-auto shadow-sm"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                <span>Tambah Promo Pertama</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedPromos.map((promo) => {
                                    const statusInfo = getPromoStatusInfo(promo);
                                    const tipePromo = promo.tipe_promo || promo.tipe;
                                    const hoverStyle = getPromoHoverStyle(tipePromo);
                                    return (
                                        <div
                                            key={promo.id}
                                            className={`bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 group ${hoverStyle} shadow-sm hover:shadow-md`}
                                        >
                                            {/* Header dengan Status */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
                                                        {promo.nama}
                                                    </h4>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${getPromoTypeColor(tipePromo)} font-medium`}>
                                                            {getPromoTypeLabel(tipePromo)}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.status === 'berlangsung' ? 'bg-green-100 text-green-800 border border-green-200' :
                                                            statusInfo.status === 'akan_datang' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                                statusInfo.status === 'berakhir' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                                    'bg-gray-100 text-gray-800 border border-gray-200'
                                                            } font-medium`}>
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    statusInfo.status === 'berlangsung' ? faToggleOn :
                                                                        statusInfo.status === 'akan_datang' ? faClock :
                                                                            statusInfo.status === 'berakhir' ? faTimes :
                                                                                faToggleOff
                                                                }
                                                                className="mr-1"
                                                            />
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Kode Promo */}
                                            {promo.kode && (
                                                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <FontAwesomeIcon icon={faTag} className="text-gray-400 text-sm" />
                                                        <span className="font-mono font-bold text-gray-800 text-lg tracking-wide">
                                                            {promo.kode}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Value Display */}
                                            {getPromoValueDisplay(promo)}
                                            {/* Detail Informasi */}
                                            <div className="space-y-3 text-sm">
                                                {promo.minQuantity > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600 flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faShoppingCart} className="text-gray-400" />
                                                            Min. Quantity:
                                                        </span>
                                                        <span className="font-semibold text-gray-800">
                                                            {promo.minQuantity} produk
                                                        </span>
                                                    </div>
                                                )}
                                                {(promo.tanggalMulai || promo.tanggalSelesai) && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600 flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                                                            Periode:
                                                        </span>
                                                        <div className="text-right">
                                                            <div className="font-semibold text-gray-800 text-xs">
                                                                {formatDate(promo.tanggalMulai)}
                                                            </div>
                                                            <div className="text-gray-500 text-xs">
                                                                s/d {formatDate(promo.tanggalSelesai)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {promo.deskripsi && (
                                                    <div className="pt-3 border-t border-gray-200">
                                                        <div className="flex items-start gap-2">
                                                            <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                                                                {promo.deskripsi}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Action Buttons - Hanya Icon */}
                                            <div className="flex gap-1 pt-4 mt-4 border-t border-gray-200">
                                                <button
                                                    onClick={() => handlePreviewPromo(promo)}
                                                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-all duration-300 flex items-center justify-center"
                                                    title="Preview Promo"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditPromo(promo)}
                                                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-lg transition-all duration-300 flex items-center justify-center"
                                                    title="Edit Promo"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(promo)}
                                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-all duration-300 flex items-center justify-center"
                                                    title="Hapus Promo"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-8">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={handlePageChange}
                                        onItemsPerPageChange={handleItemsPerPageChange}
                                        showItemsPerPage={true}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            {/* Modals */}
            <PromoModal
                showModal={showModal}
                editMode={editMode}
                loading={loading}
                jenisPromo={jenisPromo}
                formData={formData}
                selectedProducts={selectedProducts}
                formRef={formRef}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
                onJenisPromoChange={handleJenisPromoChange}
                onInputChange={handleDirectInputChange}
                onNumberChange={handleDirectNumberChange}
                onOpenProductSelector={openProductSelector}
                formatRupiah={formatRupiah}
                calculateTotalHargaNormal={calculateTotalHargaNormal}
                renderPromoForm={renderPromoForm}
            />
            <PreviewPromoModal
                showPreviewModal={showPreviewModal}
                previewPromo={previewPromo}
                previewProducts={previewProducts}
                loading={loading}
                onClose={() => setShowPreviewModal(false)}
                formatRupiah={formatRupiah}
                formatDate={formatDate}
                getPromoTypeLabel={getPromoTypeLabel}
            />
            <DeleteConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                item={promoToDelete}
                itemType="promo"
                title="Hapus Promo"
                description="Konfirmasi penghapusan promo"
                confirmButtonText="Ya, Hapus"
                cancelButtonText="Batal"
            />
            <ProductSelectorModal
                showProductSelector={showProductSelector}
                productSelectionType={productSelectionType}
                searchTerm={searchTerm}
                filteredProducts={filteredProducts}
                selectedProducts={selectedProducts}
                formData={formData}
                onClose={() => setShowProductSelector(false)}
                onSearchChange={setSearchTerm}
                onProductToggle={handleProductToggle}
                onSelectProductForX={selectProductForX}
                onSelectProductForY={selectProductForY}
                formatRupiah={formatRupiah}
            />
        </div>
    );
};

export default PromoDiskon;