// components/common/DeleteConfirmationContent.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTags } from '@fortawesome/free-solid-svg-icons';

const DeleteConfirmationContent = ({
    item,
    itemType = "produk",
    getIcon
}) => {
    if (!item) return null;

    return (
        <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-lg" />
            </div>
            <div className="flex-1">
                <p className="text-gray-800 font-medium mb-2">
                    Anda yakin ingin menghapus {itemType} ini?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="font-semibold text-red-800 text-lg">
                        {item.nama}
                    </p>
                    {itemType === 'kategori' && item.icon && (
                        <p className="text-red-600 text-sm mt-1">
                            Icon: <FontAwesomeIcon icon={getIcon ? getIcon(item.icon) : faTags} className="mr-1" />
                            {item.icon.replace('fa', '')}
                        </p>
                    )}
                    {itemType === 'produk' && item.sku && (
                        <p className="text-red-600 text-sm mt-1">
                            SKU: {item.sku}
                        </p>
                    )}
                </div>
                <p className="text-gray-600 text-sm">
                    Tindakan ini <span className="font-semibold text-red-600">tidak dapat dibatalkan</span>.
                    Semua data {itemType} akan dihapus secara permanen.
                </p>
            </div>
        </div>
    );
};

export default DeleteConfirmationContent;