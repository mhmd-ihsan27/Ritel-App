// components/common/DeleteConfirmationModal.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faTrash,
    faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import DeleteConfirmationContent from './DeleteNotification';

const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    item,
    itemType = "produk",
    getIcon,
    title = "Hapus Item",
    description = "Konfirmasi penghapusan item",
    confirmButtonText = "Ya, Hapus",
    cancelButtonText = "Batal"
}) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            {/* Background Overlay */}
            <div
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-10 border border-gray-300 transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{title}</h3>
                            <p className="text-red-100 text-sm mt-1">{description}</p>
                        </div>
                    </div>
                </div>

                {/* Body - Menggunakan Komponen Reusable */}
                <div className="p-6">
                    <DeleteConfirmationContent
                        item={item}
                        itemType={itemType}
                        getIcon={getIcon}
                    />
                </div>

                {/* Footer - Action Buttons */}
                <div className="p-6 bg-gray-50 border-t border-gray-300 rounded-b-2xl flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 shadow hover:shadow-lg flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                        {cancelButtonText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;