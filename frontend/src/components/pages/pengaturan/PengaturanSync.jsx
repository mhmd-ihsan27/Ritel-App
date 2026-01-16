import React, { useState } from 'react';
import { ForcePushSync, ForcePullSync } from '../../../../wailsjs/go/main/App';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

const PengaturanSync = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handlePushSync = async () => {
        if (!window.confirm("Apakah Anda yakin ingin MENDORONG semua data Desktop ke Web? Data Web akan diperbarui.")) return;

        setLoading(true);
        setStatus('Sedang melakukan Push Sync (Desktop -> Web)...');
        try {
            await ForcePushSync();
            toast.success("Push Sync Berhasil! Data Desktop telah dikirim ke Web.");
            setStatus('Push Sync Selesai.');
        } catch (err) {
            console.error(err);
            toast.error("Gagal melakukan Push Sync: " + err);
            setStatus('Push Sync Gagal.');
        } finally {
            setLoading(false);
        }
    };

    const handlePullSync = async () => {
        if (!window.confirm("Apakah Anda yakin ingin MENARIK semua data dari Web ke Desktop? Data Desktop akan diperbarui.")) return;

        setLoading(true);
        setStatus('Sedang melakukan Pull Sync (Web -> Desktop)...');
        try {
            await ForcePullSync();
            toast.success("Pull Sync Berhasil! Data Web telah ditarik ke Desktop.");
            setStatus('Pull Sync Selesai.');
        } catch (err) {
            console.error(err);
            toast.error("Gagal melakukan Pull Sync: " + err);
            setStatus('Pull Sync Gagal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Sinkronisasi Data</h1>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Manual Sync</h2>
                <p className="text-gray-600 mb-6">
                    Gunakan fitur ini jika data antara Desktop dan Web tidak sinkron.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Push Sync Card */}
                    <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
                        <h3 className="font-bold text-blue-800 mb-2">Desktop ➔ Web (Push)</h3>
                        <p className="text-sm text-blue-600 mb-4 h-12">
                            Kirim semua data lokal (Desktop) ke server (Web). Gunakan jika ada transaksi offline yang belum masuk ke Web.
                        </p>
                        <button
                            onClick={handlePushSync}
                            disabled={loading}
                            className={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading && status.includes('Push') ? 'Memproses...' : 'Lakukan Push Sync'}
                        </button>
                    </div>

                    {/* Pull Sync Card */}
                    <div className="border border-green-200 rounded-lg p-5 bg-green-50">
                        <h3 className="font-bold text-green-800 mb-2">Web ➔ Desktop (Pull)</h3>
                        <p className="text-sm text-green-600 mb-4 h-12">
                            Tarik data dari server (Web) ke lokal (Desktop). Gunakan jika data di Web lebih lengkap daripada di Desktop.
                        </p>
                        <button
                            onClick={handlePullSync}
                            disabled={loading}
                            className={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {loading && status.includes('Pull') ? 'Memproses...' : 'Lakukan Pull Sync'}
                        </button>
                    </div>
                </div>

                {/* Status Indicator */}
                {loading && (
                    <div className="mt-6 flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 animate-pulse">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {status}
                    </div>
                )}
                {!loading && status && (
                    <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded text-gray-700 text-center">
                        Status Terakhir: {status}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PengaturanSync;
