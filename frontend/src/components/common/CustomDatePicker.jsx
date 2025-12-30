// components/common/CustomDatePicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faChevronLeft,
    faChevronRight,
    faTimes,
    faChevronDown
} from '@fortawesome/free-solid-svg-icons';

const CustomDatePicker = ({
    name,
    value,
    onChange,
    placeholder = "Pilih tanggal...",
    label,
    size = "md",
    disabled = false,
    error = false,
    minDate = null,
    maxDate = null,
    required = false,
    alignLeft = false // Prop baru untuk mengatur alignment
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('calendar'); // 'calendar', 'month', 'year'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setView('calendar');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update selected date when value prop changes
    useEffect(() => {
        if (value) {
            setSelectedDate(new Date(value));
        } else {
            setSelectedDate(null);
        }
    }, [value]);

    // Size classes
    const sizeClasses = {
        sm: "py-2 px-3 text-sm",
        md: "py-[14px] px-6 text-sm",
        lg: "py-4 px-4 text-base"
    };

    // Alignment classes untuk dropdown
    const alignmentClasses = alignLeft
        ? "left-0"
        : "right-0";

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        onChange({
            target: {
                name: name,
                value: date.toISOString().split('T')[0] // Format YYYY-MM-DD
            }
        });
        setIsOpen(false);
        setView('calendar');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSelectedDate(null);
        onChange({
            target: {
                name: name,
                value: ''
            }
        });
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const navigateYear = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setFullYear(prev.getFullYear() + direction);
            return newDate;
        });
    };

    const selectMonth = (month) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(month);
        setCurrentDate(newDate);
        setView('calendar');
    };

    const selectYear = (year) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(year);
        setCurrentDate(newDate);
        setView('calendar');
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const isDateDisabled = (date) => {
        if (minDate && date < new Date(minDate)) return true;
        if (maxDate && date > new Date(maxDate)) return true;
        return false;
    };

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            days.push(date);
        }

        return days;
    };

    const formatDisplayDate = () => {
        if (!selectedDate) return placeholder;
        return selectedDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getMonthName = (date) => {
        return date.toLocaleDateString('id-ID', { month: 'short' });
    };

    const getYear = (date) => {
        return date.getFullYear();
    };

    const daysOfWeek = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    // Generate years for year selection (current year - 10 to current year + 10)
    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 10; i <= currentYear + 10; i++) {
            years.push(i);
        }
        return years;
    };

    const CalendarView = () => (
        <>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-2 px-1">
                <button
                    type="button"
                    onClick={() => navigateMonth(-1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>

                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={() => setView('month')}
                        className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                        {getMonthName(currentDate)}
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('year')}
                        className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                        {getYear(currentDate)}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => navigateMonth(1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                >
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {daysOfWeek.map((day, index) => (
                    <div
                        key={day}
                        className={`h-5 flex items-center justify-center text-[10px] font-medium
                            ${index === 0 ? 'text-red-500' : 'text-gray-500'}
                        `}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0.5">
                {generateCalendarDays().map((date, index) => {
                    if (!date) {
                        return <div key={`empty-${index}`} className="h-5" />;
                    }

                    const isDisabled = isDateDisabled(date);
                    const isSelected = isSameDay(date, selectedDate);
                    const isTodayDate = isToday(date);

                    return (
                        <button
                            key={date.toISOString()}
                            type="button"
                            onClick={() => !isDisabled && handleDateSelect(date)}
                            disabled={isDisabled}
                            className={`
                                h-5 w-5 flex items-center justify-center text-[10px] rounded transition-all duration-150
                                ${isDisabled
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : isSelected
                                        ? 'bg-primary text-white font-semibold'
                                        : isTodayDate
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50'
                                }
                            `}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => handleDateSelect(new Date())}
                    className="px-2 py-1 text-[10px] text-primary hover:bg-green-50 rounded transition-colors"
                >
                    Hari Ini
                </button>
                <button
                    type="button"
                    onClick={() => setView('month')}
                    className="px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 rounded transition-colors"
                >
                    Pilih Bulan
                </button>
            </div>
        </>
    );

    const MonthView = () => (
        <>
            <div className="flex items-center justify-between mb-2 px-1">
                <button
                    type="button"
                    onClick={() => navigateYear(-1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>

                <button
                    type="button"
                    onClick={() => setView('year')}
                    className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
                >
                    {getYear(currentDate)}
                </button>

                <button
                    type="button"
                    onClick={() => navigateYear(1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                >
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-1">
                {months.map((month, index) => (
                    <button
                        key={month}
                        type="button"
                        onClick={() => selectMonth(index)}
                        className={`
                            py-1.5 text-[10px] rounded transition-all duration-150 text-center
                            ${currentDate.getMonth() === index
                                ? 'bg-primary text-white font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }
                        `}
                    >
                        {month}
                    </button>
                ))}
            </div>

            <button
                type="button"
                onClick={() => setView('calendar')}
                className="w-full mt-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 rounded transition-colors border border-gray-200"
            >
                ← Kembali
            </button>
        </>
    );

    const YearView = () => {
        const years = generateYears();
        const currentYear = getYear(currentDate);

        return (
            <>
                <div className="flex items-center justify-between mb-2 px-1">
                    <button
                        type="button"
                        onClick={() => setCurrentDate(prev => {
                            const newDate = new Date(prev);
                            newDate.setFullYear(prev.getFullYear() - 20);
                            return newDate;
                        })}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                    </button>

                    <div className="text-xs font-medium text-gray-700">
                        {years[0]} - {years[years.length - 1]}
                    </div>

                    <button
                        type="button"
                        onClick={() => setCurrentDate(prev => {
                            const newDate = new Date(prev);
                            newDate.setFullYear(prev.getFullYear() + 20);
                            return newDate;
                        })}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                    {years.map((year) => (
                        <button
                            key={year}
                            type="button"
                            onClick={() => selectYear(year)}
                            className={`
                                py-1.5 text-[10px] rounded transition-all duration-150 text-center
                                ${currentYear === year
                                    ? 'bg-primary text-white font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }
                            `}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setView('month')}
                    className="w-full mt-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50 rounded transition-colors border border-gray-200"
                >
                    ← Kembali
                </button>
            </>
        );
    };

    return (
        <div className="w-full">
            {label && (
                <label className={`block text-xs font-semibold text-gray-700 mb-2 ${error ? 'text-red-600' : ''}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative" ref={dropdownRef}>
                {/* Trigger Button */}
                <button
                    type="button"
                    className={`w-full flex items-center justify-between border rounded-xl focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white
                        ${error ? 'border-red-500' : 'border-gray-300'}
                        ${sizeClasses[size]}
                        ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400 cursor-pointer'}
                    `}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <FontAwesomeIcon
                            icon={faCalendarAlt}
                            className={`${error ? 'text-red-500' : 'text-gray-400'} flex-shrink-0`}
                        />
                        <span className={`truncate ${!selectedDate ? 'text-gray-500' : 'text-gray-800'}`}>
                            {formatDisplayDate()}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {selectedDate && !disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-xs" />
                            </button>
                        )}
                        <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : '-rotate-90'} flex-shrink-0`}
                        />
                    </div>
                </button>

                {/* Calendar Dropdown - MENGGUNAKAN ALIGNMENT PROP */}
                {isOpen && (
                    <div className={`absolute z-50 w-56 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg shadow-gray-200/50 p-2 ${alignmentClasses}`}>
                        {view === 'calendar' && <CalendarView />}
                        {view === 'month' && <MonthView />}
                        {view === 'year' && <YearView />}
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

export default CustomDatePicker;