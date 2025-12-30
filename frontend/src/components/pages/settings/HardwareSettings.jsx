import { useState, useEffect } from 'react';
import { useToast } from '../../common/ToastContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBarcode, faPrint, faCashRegister, faPlug, faRefresh,
    faCheckCircle, faTimesCircle, faSync, faExclamationTriangle,
    faMouse, faKeyboard, faPenNib
} from '@fortawesome/free-solid-svg-icons';
import { printerAPI, hardwareAPI } from '../../../api';

export default function HardwareSettings() {
    const { addToast } = useToast();
    const [devices, setDevices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [testing, setTesting] = useState({});

    useEffect(() => {
        detectDevices();
    }, []);

    const detectDevices = async () => {
        setIsLoading(true);
        try {
            const response = await hardwareAPI.detectHardware();
            setDevices(response.devices || []);
            addToast(`✅ Ditemukan ${response.count} perangkat`, 'success');
        } catch (error) {
            console.error('Error detecting hardware:', error);
            addToast('❌ Gagal mendeteksi hardware: ' + error, 'error');
            setDevices([]);
        } finally {
            setIsLoading(false);
        }
    };

    const testDevice = async (device) => {
        setTesting({ ...testing, [device.port]: true });

        try {
            let response;

            if (device.type === 'scanner') {
                response = await hardwareAPI.testScanner(device.port);
            } else if (device.type === 'printer') {
                response = await printerAPI.testPrinter(device.port);
            } else if (device.type === 'cash_drawer') {
                response = await hardwareAPI.testCashDrawer(device.port);
            } else {
                // Try scanner by default
                response = await hardwareAPI.testScanner(device.port);
            }

            if (response.success) {
                addToast(`✅ ${response.message}`, 'success');
            } else {
                addToast(`❌ ${response.message}`, 'error');
            }
        } catch (error) {
            addToast('❌ Gagal test perangkat: ' + error, 'error');
        } finally {
            setTesting({ ...testing, [device.port]: false });
        }
    };

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'scanner':
                return faBarcode;
            case 'printer':
                return faPrint;
            case 'cash_drawer':
                return faCashRegister;
            case 'mouse':
                return faMouse;
            case 'keyboard':
                return faKeyboard;
            case 'pen':
                return faPenNib;
            default:
                return faPlug;
        }
    };

    const getDeviceColor = (type) => {
        switch (type) {
            case 'scanner':
                return 'text-blue-600 bg-blue-100';
            case 'printer':
                return 'text-green-600 bg-green-100';
            case 'cash_drawer':
                return 'text-purple-600 bg-purple-100';
            case 'mouse':
                return 'text-pink-600 bg-pink-100';
            case 'keyboard':
                return 'text-indigo-600 bg-indigo-100';
            case 'pen':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getDeviceTypeName = (type) => {
        switch (type) {
            case 'scanner':
                return 'Barcode Scanner';
            case 'printer':
                return 'Printer Thermal';
            case 'cash_drawer':
                return 'Cash Drawer';
            case 'mouse':
                return 'Mouse';
            case 'keyboard':
                return 'Keyboard';
            case 'pen':
                return 'Pen / Digitizer';
            default:
                return 'Unknown Device';
        }
    };

    return (
        <div className="min-h-screen bg-green-50 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                                <FontAwesomeIcon icon={faPlug} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Pengaturan Hardware</h2>
                                <p className="text-gray-600 mt-1">Deteksi dan test perangkat hardware yang terhubung</p>
                            </div>
                        </div>
                        <button
                            onClick={detectDevices}
                            disabled={isLoading}
                            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <FontAwesomeIcon
                                icon={faRefresh}
                                className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}
                            />
                            {isLoading ? 'Mendeteksi...' : 'Refresh Perangkat'}
                        </button>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <FontAwesomeIcon icon={faPlug} className="mr-2" />
                            <span className="font-medium">{devices.length}</span> perangkat terdeteksi
                        </div>
                    </div>
                </div>

                {/* Device List */}
                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
                        <FontAwesomeIcon icon={faSync} className="text-4xl text-green-600 animate-spin mb-4" />
                        <p className="text-gray-600">Mendeteksi perangkat hardware...</p>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-yellow-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Tidak Ada Perangkat</h3>
                        <p className="text-gray-600 mb-4">
                            Tidak ada perangkat hardware yang terdeteksi.
                            Pastikan perangkat sudah terhubung dengan benar.
                        </p>
                        <button
                            onClick={detectDevices}
                            className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition-colors"
                        >
                            <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                            Coba Lagi
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {devices.map((device, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                            >
                                {/* Device Icon & Type */}
                                <div className="flex items-start mb-4">
                                    <div className={`w-12 h-12 rounded-lg ${getDeviceColor(device.type)} flex items-center justify-center mr-3 flex-shrink-0 border border-gray-200`}>
                                        <FontAwesomeIcon icon={getDeviceIcon(device.type)} className="text-xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 truncate">
                                            {getDeviceTypeName(device.type)}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">{device.name}</p>
                                    </div>
                                </div>

                                {/* Device Info */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Port:</span>
                                        <span className="font-medium text-gray-800">{device.port}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Koneksi:</span>
                                        <span className="font-medium text-gray-800">{device.connection}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Status:</span>
                                        <span className="flex items-center">
                                            {device.isConnected ? (
                                                <>
                                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 mr-1" />
                                                    <span className="text-green-600 font-medium">Terhubung</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faTimesCircle} className="text-red-600 mr-1" />
                                                    <span className="text-red-600 font-medium">Terputus</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                {device.description && (
                                    <p className="text-xs text-gray-500 mb-4 border-t border-gray-100 pt-3">
                                        {device.description}
                                    </p>
                                )}

                                {/* Test Button - Only for testable devices */}
                                {['scanner', 'printer', 'cash_drawer'].includes(device.type) ? (
                                    <button
                                        onClick={() => testDevice(device)}
                                        disabled={testing[device.port] || !device.isConnected}
                                        className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
                                    >
                                        {testing[device.port] ? (
                                            <>
                                                <FontAwesomeIcon icon={faSync} className="mr-2 animate-spin" />
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                                Test Perangkat
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg font-medium text-center">
                                        <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-600" />
                                        Device Detected
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-green-600 mt-0.5 mr-3" />
                        <div className="text-sm text-green-800">
                            <strong>Informasi Deteksi Hardware:</strong>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                <li><strong>Mouse, Keyboard, Pen:</strong> Otomatis terdeteksi sistem (tidak perlu test)</li>
                                <li><strong>Barcode Scanner USB:</strong> Biasanya muncul sebagai HID Keyboard Device</li>
                                <li><strong>Test Printer:</strong> Akan mencetak struk percobaan</li>
                                <li><strong>Test Cash Drawer:</strong> Akan membuka laci kasir</li>
                                <li><strong>Driver:</strong> Pastikan driver perangkat sudah terinstall dengan benar</li>
                                <li><strong>Refresh:</strong> Klik "Refresh Perangkat" jika ada hardware baru dipasang</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}