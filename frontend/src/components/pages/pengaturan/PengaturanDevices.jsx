import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPrint, faSync, faCheckCircle, faExclamationCircle,
    faCheck, faTimes, faWifi, faPlug, faServer,
    faNetworkWired, faFileInvoice, faCog
} from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../common/ToastContainer';
import { printerAPI } from '../../../api';

const PengaturanDevices = () => {
    const { addToast } = useToast();
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [testingPrinter, setTestingPrinter] = useState(null);
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        loadPrinters();
        loadSettings();
    }, []);

    const loadPrinters = async () => {
        setLoading(true);
        try {
            const data = await printerAPI.getInstalledPrinters();
            setPrinters(data || []);
            if (data && data.length === 0) {
                addToast('Tidak ada printer yang terdeteksi', 'warning');
            }
        } catch (error) {
            console.error('Error loading printers:', error);
            addToast('Gagal memuat daftar printer', 'error');
            setPrinters([]);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await printerAPI.getSettings();
            setSettings(data);
            if (data && data.printerName) {
                setSelectedPrinter(data.printerName);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleSetDefaultPrinter = async (printerName) => {
        try {
            const updatedSettings = {
                ...settings,
                printerName: printerName,
            };
            await printerAPI.saveSettings(updatedSettings);
            setSelectedPrinter(printerName);
            setSettings(updatedSettings);
            addToast(`Printer "${printerName}" telah ditetapkan sebagai default`, 'success');
        } catch (error) {
            console.error('Error setting default printer:', error);
            addToast('Gagal menetapkan printer default', 'error');
        }
    };

    const handleTestPrint = async (printerName) => {
        setTestingPrinter(printerName);
        try {
            await printerAPI.testPrinter(printerName);
            addToast(`Test print berhasil dikirim ke "${printerName}"`, 'success');
        } catch (error) {
            console.error('Error test print:', error);
            addToast(`Gagal test print: ${error.message || error}`, 'error');
        } finally {
            setTestingPrinter(null);
        }
    };

    const getPrinterTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'usb':
                return faPlug;
            case 'bluetooth':
                return faWifi;
            case 'network':
                return faNetworkWired;
            case 'thermal':
                return faFileInvoice;
            case 'virtual':
                return faCog;
            default:
                return faPrint;
        }
    };

    const getPrinterTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'usb':
                return 'text-blue-500';
            case 'bluetooth':
                return 'text-purple-500';
            case 'network':
                return 'text-green-500';
            case 'thermal':
                return 'text-orange-500';
            case 'virtual':
                return 'text-gray-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'online':
                return 'text-green-500';
            case 'offline':
                return 'text-red-500';
            case 'error':
                return 'text-yellow-500';
            default:
                return 'text-gray-500';
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
                                <FontAwesomeIcon icon={faPrint} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Devices & Printer</h2>
                                <p className="text-gray-600 mt-1">Kelola printer dan devices untuk pencetakan struk</p>
                            </div>
                        </div>
                        <button
                            onClick={loadPrinters}
                            disabled={loading}
                            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <FontAwesomeIcon icon={faSync} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                            <span>{loading ? 'Memuat...' : 'Refresh'}</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="flex items-center mb-4 p-4 border-b border-gray-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 border border-blue-200">
                            <FontAwesomeIcon icon={faPrint} className="h-5 w-5 text-blue-700" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Daftar Printer Terdeteksi</h3>
                        <div className="ml-auto text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            Total: {printers.length} printer
                        </div>
                    </div>

                    <div className="p-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                <p className="text-gray-600 font-medium">Mendeteksi printer...</p>
                                <p className="text-gray-500 text-sm mt-2">Mohon tunggu sebentar</p>
                            </div>
                        ) : printers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FontAwesomeIcon icon={faPrint} className="text-3xl text-gray-400" />
                                </div>
                                <p className="text-gray-800 font-semibold text-lg mb-2">Tidak Ada Printer Terdeteksi</p>
                                <p className="text-gray-600 text-sm mb-4">
                                    Pastikan printer sudah terpasang dan terhubung dengan baik
                                </p>
                                <button
                                    onClick={loadPrinters}
                                    className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={faSync} />
                                    Coba Lagi
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {printers.map((printer, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between py-3 px-2 transition-all duration-200 hover:bg-gray-50 ${selectedPrinter === printer.name ? 'bg-green-50' : ''
                                            }`}
                                    >
                                        {/* Printer Info */}
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            {/* Printer Icon */}
                                            <div className={`flex-shrink-0 ${getPrinterTypeColor(printer.type)}`}>
                                                <FontAwesomeIcon
                                                    icon={getPrinterTypeIcon(printer.type)}
                                                    className="text-base"
                                                />
                                            </div>

                                            {/* Printer Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className="font-medium text-gray-800 text-sm">
                                                        {printer.displayName || printer.name}
                                                    </h4>
                                                    {selectedPrinter === printer.name && (
                                                        <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                                                            <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span className={getPrinterTypeColor(printer.type)}>
                                                        {printer.type || 'Unknown'}
                                                    </span>
                                                    <span>•</span>
                                                    <span className={getStatusColor(printer.status)}>
                                                        {printer.status || 'Unknown'}
                                                    </span>
                                                    {printer.port && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Port: {printer.port}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                            {selectedPrinter !== printer.name && (
                                                <button
                                                    onClick={() => handleSetDefaultPrinter(printer.name)}
                                                    className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition-all duration-200 text-xs flex items-center gap-1"
                                                    title="Set sebagai printer default"
                                                >
                                                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                                                    Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleTestPrint(printer.name)}
                                                disabled={testingPrinter === printer.name}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 text-xs flex items-center gap-1 disabled:opacity-50"
                                                title="Test printer"
                                            >
                                                {testingPrinter === printer.name ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                                                        Test...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faPrint} className="text-xs" />
                                                        Test
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="flex items-center mb-4 p-4 border-b border-gray-200">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 border border-orange-200">
                            <FontAwesomeIcon icon={faExclamationCircle} className="h-5 w-5 text-orange-700" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Panduan Penggunaan</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg mt-1">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-1">Printer Default</h4>
                                        <p className="text-sm text-gray-600">
                                            Tetapkan printer utama untuk pencetakan struk otomatis
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="bg-green-100 p-2 rounded-lg mt-1">
                                        <FontAwesomeIcon icon={faPrint} className="text-green-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-1">Test Print</h4>
                                        <p className="text-sm text-gray-600">
                                            Pastikan printer dapat bekerja dengan baik sebelum digunakan
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-purple-100 p-2 rounded-lg mt-1">
                                        <FontAwesomeIcon icon={faSync} className="text-purple-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-1">Refresh</h4>
                                        <p className="text-sm text-gray-600">
                                            Gunakan refresh jika printer baru ditambahkan atau ada perubahan
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="bg-orange-100 p-2 rounded-lg mt-1">
                                        <FontAwesomeIcon icon={faFileInvoice} className="text-orange-600 text-sm" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 mb-1">Printer Thermal</h4>
                                        <p className="text-sm text-gray-600">
                                            Untuk printer thermal, pastikan ukuran kertas sudah sesuai
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Tips */}
                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-start space-x-3">
                                <FontAwesomeIcon icon={faExclamationCircle} className="text-green-600 mt-1 text-lg" />
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Tips Penting</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Pastikan printer sudah terinstall di sistem operasi Anda</li>
                                        <li>• Untuk printer thermal, gunakan ukuran kertas 58mm atau 80mm</li>
                                        <li>• Pastikan koneksi USB/kabel printer terpasang dengan baik</li>
                                        <li>• Restart aplikasi jika printer tidak terdeteksi</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PengaturanDevices;