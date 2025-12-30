// components/common/CustomSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';

const CustomSelect = ({
    name,
    value,
    onChange,
    options = [],
    placeholder = "Pilih...",
    label,
    icon,
    size = "md",
    disabled = false,
    error = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({
            target: {
                name: name,
                value: optionValue
            }
        });
        setIsOpen(false);
    };

    const getSelectedLabel = () => {
        if (!value) return placeholder;
        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    // Size classes
    const sizeClasses = {
        sm: "py-2 px-3 text-sm",
        md: "py-3 px-4 text-sm",
        lg: "py-4 px-4 text-base"
    };

    const optionSizeClasses = {
        sm: "py-2 px-3 text-sm",
        md: "py-2 px-4 text-sm",
        lg: "py-3 px-4 text-base"
    };

    return (
        <div className="w-full">
            {label && (
                <label className={`block text-xs font-semibold text-gray-700 mb-2 ${error ? 'text-red-600' : ''}`}>
                    {label}
                </label>
            )}

            <div className="relative" ref={dropdownRef}>
                {/* Trigger Button */}
                <button
                    type="button"
                    className={`w-full flex items-center justify-between border rounded-lg transition-all duration-200 bg-white
                        ${error ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500' :
                            'border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500'}
                        ${sizeClasses[size]}
                        ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400 cursor-pointer'}
                    `}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        {icon && (
                            <FontAwesomeIcon
                                icon={icon}
                                className={`${error ? 'text-red-500' : 'text-gray-400'} flex-shrink-0`}
                            />
                        )}
                        <span className={`truncate ${!value ? 'text-gray-500' : 'text-gray-800'}`}>
                            {getSelectedLabel()}
                        </span>
                    </div>

                    <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} flex-shrink-0`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl shadow-gray-200/80 backdrop-blur-sm max-h-60 overflow-y-auto">
                        <div className="py-2">
                            {options.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    Tidak ada pilihan tersedia
                                </div>
                            ) : (
                                options.map((option, index) => (
                                    <div
                                        key={option.value || index}
                                        className={`
                                            flex items-center justify-between px-4 cursor-pointer transition-all duration-200
                                            ${optionSizeClasses[size]}
                                            ${value === option.value
                                                ? 'bg-green-50 text-green-700 font-semibold'
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }
                                            ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}
                                        `}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            {/* Option Icon */}
                                            {option.icon && (
                                                <FontAwesomeIcon
                                                    icon={option.icon}
                                                    className={`text-sm flex-shrink-0 ${value === option.value ? 'text-green-600' : 'text-gray-400'
                                                        }`}
                                                />
                                            )}

                                            {/* Option Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {option.label}
                                                </div>
                                                {option.description && (
                                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                                        {option.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Checkmark for selected option */}
                                        {value === option.value && (
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                className="text-green-600 text-sm flex-shrink-0 ml-2"
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
};

export default CustomSelect;