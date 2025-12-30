import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBarcode, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { produkAPI } from '../../../api';

const BarcodeScanner = ({ isOpen, onClose, onScanSuccess }) => {
    const [barcode, setBarcode] = useState('');
    const [jumlah, setJumlah] = useState(1);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const inputRef = useRef(null);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setScanResult(null);
            setBarcode('');
            setJumlah(1);
        }
    }, [isOpen]);

    // Handle barcode input (for USB barcode scanners that simulate keyboard)
    const handleBarcodeInput = (e) => {
        setBarcode(e.target.value);
    };

    // Handle scan submit
    const handleScan = async () => {
        if (!barcode.trim()) {
            setScanResult({
                success: false,
                message: 'Masukkan kode barcode terlebih dahulu'
            });
            return;
        }

        setScanning(true);
        setScanResult(null);

        try {
            const response = await produkAPI.scanBarcode(barcode.trim(), parseInt(jumlah) || 1);

            setScanResult(response);

            if (response.success) {
                // Notify parent component
                if (onScanSuccess) {
                    onScanSuccess(response);
                }

                // Reset form after successful scan
                setTimeout(() => {
                    setBarcode('');
                    setJumlah(1);
                    setScanResult(null);
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('Error scanning barcode:', error);
            setScanResult({
                success: false,
                message: 'Terjadi kesalahan: ' + error.message
            });
        } finally {
            setScanning(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleScan();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FontAwesomeIcon icon={faBarcode} className="text-2xl" />
                            <h3 className="text-xl font-bold">Scan Barcode</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition-colors"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-xl" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-100 mt-2">
                        Scan atau masukkan kode barcode produk
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Barcode Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode Barcode
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={barcode}
                            onChange={handleBarcodeInput}
                            onKeyPress={handleKeyPress}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent text-lg"
                            placeholder="Scan atau ketik barcode..."
                            disabled={scanning}
                        />
                    </div>

                    {/* Quantity Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Jumlah
                        </label>
                        <input
                            type="number"
                            value={jumlah}
                            onChange={(e) => setJumlah(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-transparent text-lg"
                            min="1"
                            disabled={scanning}
                        />
                    </div>

                    {/* Scan Result */}
                    {scanResult && (
                        <div className={`p-4 rounded-lg ${scanResult.success
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            <div className="flex items-start space-x-3">
                                <FontAwesomeIcon
                                    icon={scanResult.success ? faCheck : faExclamationTriangle}
                                    className={`mt-1 ${scanResult.success ? 'text-green-600' : 'text-red-600'
                                        }`}
                                />
                                <div className="flex-1">
                                    <p className={`font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {scanResult.message}
                                    </p>
                                    {scanResult.success && scanResult.produk && (
                                        <div className="mt-2 text-sm text-green-700 space-y-1">
                                            <p><strong>Produk:</strong> {scanResult.produk.nama}</p>
                                            <p><strong>SKU:</strong> {scanResult.produk.sku}</p>
                                            <p><strong>Harga:</strong> Rp {scanResult.produk.hargaBeli.toLocaleString('id-ID')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            disabled={scanning}
                        >
                            Tutup
                        </button>
                        <button
                            onClick={handleScan}
                            className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={scanning || !barcode.trim()}
                        >
                            {scanning ? 'Memproses...' : 'Scan'}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                            <strong>Tips:</strong> Jika menggunakan barcode scanner USB, cukup scan barcode dan tekan Enter.
                            Produk akan otomatis ditambahkan ke keranjang.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
