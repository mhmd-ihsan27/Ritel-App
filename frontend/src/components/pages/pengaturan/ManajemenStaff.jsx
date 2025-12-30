import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus,
    faEdit,
    faKey,
    faUserShield,
    faUserTie,
    faSearch,
    faTimes,
    faSync,
    faExclamationTriangle,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { userAPI } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../common/ToastContainer';

const ManajemenStaff = () => {
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        namaLengkap: '',
        role: 'staff',
        status: 'active'
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await userAPI.getAll();
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            showToast('error', 'Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadUsers();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        console.log('handleCreate called with formData:', formData);

        // Validation
        if (!formData.username.trim()) {
            showToast('error', 'Username tidak boleh kosong');
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            showToast('error', 'Password minimal 6 karakter');
            return;
        }

        if (!formData.namaLengkap.trim()) {
            showToast('error', 'Nama lengkap tidak boleh kosong');
            return;
        }

        try {
            console.log('Calling CreateUser with:', formData);
            const result = await userAPI.create(formData);
            console.log('CreateUser result:', result);

            // Tampilkan notifikasi sukses dengan desain Toast.jsx
            showToast('success', `User "${formData.namaLengkap}" berhasil dibuat!`, 4000);

            setShowCreateModal(false);
            resetForm();
            loadUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            showToast('error', error.message || 'Gagal membuat user: ' + (error.toString ? error.toString() : JSON.stringify(error)), 5000);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();

        try {
            await userAPI.update({
                id: selectedUser.id,
                username: formData.username,
                password: formData.password, // Optional
                namaLengkap: formData.namaLengkap,
                role: formData.role,
                status: formData.status
            });

            // Tampilkan notifikasi sukses dengan desain Toast.jsx
            showToast('success', `Data user "${formData.namaLengkap}" berhasil diperbarui!`, 4000);

            setShowEditModal(false);
            resetForm();
            setSelectedUser(null);
            loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('error', error.message || 'Gagal mengupdate user', 5000);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('error', 'Password baru tidak cocok');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast('error', 'Password minimal 6 karakter');
            return;
        }

        try {
            // For admin changing other user's password
            // Note: This currently only works in desktop mode
            // TODO: Add web API endpoint for admin password change
            if (window.go && window.go.main && window.go.main.App && window.go.main.App.ChangePassword) {
                await window.go.main.App.ChangePassword({
                    userId: selectedUser.id,
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                });
            } else {
                throw new Error('Password change not available in web mode');
            }

            // Tampilkan notifikasi sukses dengan desain Toast.jsx
            showToast('success', `Password untuk "${selectedUser.namaLengkap}" berhasil diubah!`, 4000);

            setShowPasswordModal(false);
            resetPasswordForm();
            setSelectedUser(null);
        } catch (error) {
            console.error('Error changing password:', error);
            showToast('error', error.message || 'Gagal mengubah password', 5000);
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: '', // Leave blank for optional update
            namaLengkap: user.namaLengkap,
            role: user.role,
            status: user.status
        });
        setShowEditModal(true);
    };

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        resetPasswordForm();
        setShowPasswordModal(true);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            namaLengkap: '',
            role: 'staff',
            status: 'active'
        });
    };

    const resetPasswordForm = () => {
        setPasswordData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const filteredUsers = users.filter(user =>
        user.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-green-50 p-6 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 mb-3">
                            <div className="bg-green-700 p-4 rounded-2xl shadow-lg border border-green-800">
                                <FontAwesomeIcon icon={faUserShield} className="text-white text-3xl" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">Manajemen Staff</h2>
                                <p className="text-gray-600 mt-1">Kelola akun staff dan admin</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 border border-green-800"
                        >
                            <FontAwesomeIcon icon={faSync} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Cari user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={() => {
                                resetForm();
                                setShowCreateModal(true);
                            }}
                            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faUserPlus} />
                            <span>Tambah User</span>
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Memuat data...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {searchTerm ? 'Tidak ada user yang sesuai' : 'Belum ada user'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Username
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-blue-100' : 'bg-green-100'
                                                        }`}>
                                                        <FontAwesomeIcon
                                                            icon={user.role === 'admin' ? faUserShield : faUserTie}
                                                            className={user.role === 'admin' ? 'text-blue-600' : 'text-green-600'}
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.namaLengkap}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{user.username}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Admin' : 'Staff'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    title="Edit"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    onClick={() => openPasswordModal(user)}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Ganti Password"
                                                >
                                                    <FontAwesomeIcon icon={faKey} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Create Modal - Dengan Background Baru */}
                {showCreateModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={() => setShowCreateModal(false)}
                        ></div>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="bg-green-700 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                                        <FontAwesomeIcon icon={faUserPlus} className="text-xl text-green-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Tambah User Baru</h3>
                                        <p className="text-green-100 text-sm mt-1">
                                            Tambahkan akun staff atau admin baru
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-green-800 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                            minLength={6}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.namaLengkap}
                                            onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Nonaktif</option>
                                        </select>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow hover:shadow-lg"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleCreate}
                                    className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal - Dengan Background Baru */}
                {showEditModal && selectedUser && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={() => {
                                setShowEditModal(false);
                                resetForm();
                                setSelectedUser(null);
                            }}
                        ></div>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="bg-blue-600 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                                        <FontAwesomeIcon icon={faEdit} className="text-xl text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Edit User</h3>
                                        <p className="text-blue-100 text-sm mt-1">
                                            Perbarui informasi akun user
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        resetForm();
                                        setSelectedUser(null);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-blue-700 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form onSubmit={handleEdit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password Baru (opsional)
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            placeholder="Kosongkan jika tidak ingin mengubah"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter (jika diisi)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.namaLengkap}
                                            onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Nonaktif</option>
                                        </select>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        resetForm();
                                        setSelectedUser(null);
                                    }}
                                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow hover:shadow-lg"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleEdit}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change Password Modal - Dengan Background Baru */}
                {showPasswordModal && selectedUser && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <div
                            className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px]"
                            onClick={() => {
                                setShowPasswordModal(false);
                                resetPasswordForm();
                                setSelectedUser(null);
                            }}
                        ></div>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-gray-300 max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="bg-yellow-600 p-6 text-white relative">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4">
                                        <FontAwesomeIcon icon={faKey} className="text-xl text-yellow-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Ganti Password</h3>
                                        <p className="text-yellow-100 text-sm mt-1">
                                            Ubah kata sandi untuk akun ini
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        resetPasswordForm();
                                        setSelectedUser(null);
                                    }}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-yellow-700 hover:text-white border border-white border-opacity-30 rounded-lg transition-all duration-300 hover:scale-110"
                                    title="Tutup"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        User: <span className="font-semibold">{selectedUser.namaLengkap}</span>
                                    </p>
                                </div>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password Lama
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                            minLength={6}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Konfirmasi Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        resetPasswordForm();
                                        setSelectedUser(null);
                                    }}
                                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow hover:shadow-lg"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="mr-2" />
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleChangePassword}
                                    className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                                >
                                    <FontAwesomeIcon icon={faKey} className="mr-2" />
                                    Ganti Password
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManajemenStaff;

// VVRDailyFresh