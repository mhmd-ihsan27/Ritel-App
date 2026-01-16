import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faClock, faUserPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { staffReportAPI } from '../../api/staff-report';
import { userAPI } from '../../api/user';
import { useToast } from '../common/ToastContainer';

const ShiftSettingModal = ({ isOpen, onClose, onSave }) => {
    const [shifts, setShifts] = useState([]);
    const [allStaff, setAllStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch settings and staff in parallel
            const [settingsData, staffData] = await Promise.all([
                staffReportAPI.getShiftSettings(),
                userAPI.getAllStaff()
            ]);

            setAllStaff(staffData || []);

            console.log("Shift Settings Data:", settingsData); // DEBUG LOG

            if (settingsData && settingsData.length > 0) {
                setShifts(settingsData.map(s => {
                    // Handle potential casing issues (staffIds vs StaffIDs)
                    const rawIds = s.staffIds || s.StaffIDs;
                    return {
                        ...s,
                        // Use String for IDs to prevent JS precision loss for large int64
                        staffIdsArray: rawIds ? rawIds.split(',').map(String) : []
                    };
                }));
            } else {
                // Fallback dev mode without wails data
                setShifts([
                    { id: 1, name: 'Shift 1', startTime: '06:00', endTime: '14:00', staffIdsArray: [] },
                    { id: 2, name: 'Shift 2', startTime: '14:00', endTime: '22:00', staffIdsArray: [] }
                ]);
            }
        } catch (error) {
            console.error("Failed to load data", error);
            showError('Gagal memuat data');
            // Fallback for dev if API fails
            setShifts([
                { id: 1, name: 'Shift 1 (Offline)', startTime: '06:00', endTime: '14:00', staffIdsArray: [] },
                { id: 2, name: 'Shift 2 (Offline)', startTime: '14:00', endTime: '22:00', staffIdsArray: [] }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (index, field, value) => {
        const newShifts = [...shifts];
        newShifts[index][field] = value;
        setShifts(newShifts);
    };

    const handleStaffToggle = (shiftIndex, staffId) => {
        const newShifts = [...shifts];
        const currentIds = newShifts[shiftIndex].staffIdsArray || [];
        const staffIdStr = String(staffId);

        if (currentIds.includes(staffIdStr)) {
            newShifts[shiftIndex].staffIdsArray = currentIds.filter(id => id !== staffIdStr);
        } else {
            newShifts[shiftIndex].staffIdsArray = [...currentIds, staffIdStr];
        }
        setShifts(newShifts);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const shift of shifts) {
                const staffIDsString = shift.staffIdsArray.join(',');
                await staffReportAPI.updateShiftSettings(shift.id, shift.startTime, shift.endTime, staffIDsString);
            }

            showSuccess('Pengaturan shift berhasil disimpan');
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save settings", error);
            showError('Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-2 text-green-600" />
                        Pengaturan Shift & Staff
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {shifts.map((shift, index) => (
                                <div key={shift.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h4 className="font-bold text-gray-800 mb-3 text-lg border-b pb-2 border-gray-200">{shift.name}</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Waktu Shift */}
                                        <div className="space-y-4">
                                            <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Waktu Operasional</h5>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Jam Mulai</label>
                                                <input
                                                    type="time"
                                                    value={shift.startTime}
                                                    onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Jam Selesai</label>
                                                <input
                                                    type="time"
                                                    value={shift.endTime}
                                                    onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Assignment Staff */}
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                                                Assign Staff (Kasir)
                                            </h5>
                                            <div className="bg-white border border-gray-200 rounded-lg h-40 overflow-y-auto p-2">
                                                {allStaff.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {allStaff.map(staff => (
                                                            <div key={staff.id} className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`shift-${shift.id}-staff-${staff.id}`}
                                                                    checked={shift.staffIdsArray?.includes(String(staff.id))}
                                                                    onChange={() => handleStaffToggle(index, staff.id)}
                                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                                                                />
                                                                <label
                                                                    htmlFor={`shift-${shift.id}-staff-${staff.id}`}
                                                                    className="ml-2 block text-sm text-gray-700 cursor-pointer select-none"
                                                                >
                                                                    {staff.namaLengkap}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 text-center py-4">Tidak ada data staff</p>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 italic">
                                                *Staff yang dipilih akan otomatis tercatat di laporan shift ini.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                        disabled={saving}
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 font-medium text-sm flex items-center transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={saving || loading}
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftSettingModal;
