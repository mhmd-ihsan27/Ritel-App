/**
 * Sync Status Component
 * Displays current sync status and allows manual sync
 */

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSync,
  faWifi,
  faCircle,
  faExclamationTriangle,
  faCheckCircle,
  faClock,
  faCloudUploadAlt
} from '@fortawesome/free-solid-svg-icons';
import { useSyncContext } from '../../contexts/SyncContext';
import { useToast } from './ToastContainer';

const SyncStatus = ({ compact = false }) => {
  const { syncStatus, isOnline, forceSync, pendingOperations } = useSyncContext();
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleForceSync = async () => {
    if (!isOnline) {
      toast.showWarning('Tidak dapat sync saat offline');
      return;
    }

    if (syncStatus.pending === 0) {
      toast.showInfo('Tidak ada data yang perlu di-sync');
      return;
    }

    setSyncing(true);
    try {
      await forceSync();
      toast.showSuccess(`Berhasil sync ${syncStatus.pending} operasi`);
    } catch (error) {
      toast.showError('Gagal melakukan sync: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  // Don't show if sync is not enabled (web mode)
  if (!syncStatus.enabled) {
    return null;
  }

  // Compact mode - just show icon and status
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {/* Online/Offline Indicator */}
        <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          <FontAwesomeIcon
            icon={faCircle}
            className={`text-xs ${isOnline ? 'animate-pulse' : ''}`}
          />
          <span className="text-xs font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Pending count */}
        {syncStatus.pending > 0 && (
          <div className="flex items-center space-x-1 text-yellow-600">
            <FontAwesomeIcon icon={faClock} className="text-xs" />
            <span className="text-xs font-medium">{syncStatus.pending}</span>
          </div>
        )}

        {/* Sync button */}
        {isOnline && syncStatus.pending > 0 && (
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
            title="Sync sekarang"
          >
            <FontAwesomeIcon
              icon={faSync}
              className={`text-sm ${syncing ? 'animate-spin' : ''}`}
            />
          </button>
        )}
      </div>
    );
  }

  // Full mode - detailed status card
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isOnline ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <FontAwesomeIcon
              icon={isOnline ? faWifi : faExclamationTriangle}
              className={`text-lg ${isOnline ? 'text-green-600' : 'text-red-600'}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Status Sinkronisasi</h3>
            <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? '🟢 Terhubung ke Server' : '🔴 Sedang Offline'}
            </p>
          </div>
        </div>

        {/* Sync Button */}
        {isOnline && syncStatus.pending > 0 && (
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon
              icon={faSync}
              className={syncing ? 'animate-spin' : ''}
            />
            <span>Sync Sekarang</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Pending */}
        <div className={`rounded-lg p-3 ${
          syncStatus.pending > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            <FontAwesomeIcon
              icon={faClock}
              className={`text-sm ${syncStatus.pending > 0 ? 'text-yellow-600' : 'text-gray-400'}`}
            />
            <span className="text-xs text-gray-600 font-medium">Menunggu Sync</span>
          </div>
          <p className={`text-2xl font-bold ${
            syncStatus.pending > 0 ? 'text-yellow-600' : 'text-gray-400'
          }`}>
            {syncStatus.pending}
          </p>
        </div>

        {/* Synced */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <FontAwesomeIcon icon={faCheckCircle} className="text-sm text-green-600" />
            <span className="text-xs text-gray-600 font-medium">Berhasil Sync</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{syncStatus.synced}</p>
        </div>

        {/* Failed */}
        <div className={`rounded-lg p-3 ${
          syncStatus.failed > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className={`text-sm ${syncStatus.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}
            />
            <span className="text-xs text-gray-600 font-medium">Gagal Sync</span>
          </div>
          <p className={`text-2xl font-bold ${
            syncStatus.failed > 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {syncStatus.failed}
          </p>
        </div>
      </div>

      {/* Last Sync Time */}
      {syncStatus.lastSync && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Terakhir update: {new Date(syncStatus.lastSync).toLocaleString('id-ID')}
          </p>
        </div>
      )}

      {/* Pending Operations List */}
      {pendingOperations.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Operasi yang Menunggu Sync ({pendingOperations.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {pendingOperations.slice(0, 5).map((op) => (
              <div key={op.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    {op.operation} - {op.table_name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    op.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    op.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {op.status}
                  </span>
                </div>
                {op.retry_count > 0 && (
                  <p className="text-gray-500 mt-1">Retry: {op.retry_count}/5</p>
                )}
              </div>
            ))}
            {pendingOperations.length > 5 && (
              <p className="text-center text-gray-500 text-xs">
                +{pendingOperations.length - 5} lagi...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info when offline */}
      {!isOnline && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <FontAwesomeIcon icon={faCloudUploadAlt} className="text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-semibold">Mode Offline</p>
              <p className="mt-1">
                Semua perubahan data akan disimpan secara lokal dan otomatis di-sync ke server ketika koneksi internet kembali.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
