import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faUser, faLock, faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../contexts/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user types
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.username.trim()) {
            setError('Username tidak boleh kosong');
            return;
        }

        if (!formData.password) {
            setError('Password tidak boleh kosong');
            return;
        }

        setLoading(true);

        try {
            const result = await login(formData.username, formData.password);

            if (!result.success) {
                setError(result.message || 'Login gagal. Silakan coba lagi.');
            }
            // If success, AuthContext will handle redirect via App.jsx
        } catch (err) {
            console.error('Login error:', err);
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 border border-gray-200">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="bg-green-700 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg border border-green-800">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Sistem Kasir</h1>
                    <p className="text-gray-600 mt-2">Silakan login untuk melanjutkan</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            <div className="flex items-center">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2" />
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Username Field */}
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Username
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                placeholder="Masukkan username"
                                disabled={loading}
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                placeholder="Masukkan password"
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${loading
                                ? 'bg-green-400 cursor-not-allowed'
                                : 'bg-green-700 hover:bg-green-800 active:bg-green-900'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin h-5 w-5 mr-3" />
                                <span>Memproses...</span>
                            </div>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                {/* Default Credentials Info */}
                {/* <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-800 font-semibold mb-1">
                        Default Admin:
                    </p>
                    <p className="text-xs text-green-700">
                        Username: <span className="font-mono font-semibold">admin</span>
                    </p>
                    <p className="text-xs text-green-700">
                        Password: <span className="font-mono font-semibold">admin123</span>
                    </p>
                    <p className="text-xs text-green-600 mt-2 italic">
                        * Ganti password setelah login pertama
                    </p>
                </div> */}
            </div>
        </div>
    );
};

export default Login;