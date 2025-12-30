import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PageTemplate = ({ title, subtitle, icon, message = "Halaman dalam pengembangan", children }) => {
    return (
        <div className="page">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <p className="text-gray-600">{subtitle}</p>
            </div>
            {children || (
                <div className="bg-white rounded-xl shadow p-6">
                    <div className="text-center text-gray-500 py-8">
                        {icon && <FontAwesomeIcon icon={icon} className="text-4xl mb-2" />}
                        <p>{message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageTemplate;
