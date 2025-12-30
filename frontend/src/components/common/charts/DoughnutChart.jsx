import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

const DoughnutChart = ({ data, title, height = 300, showLegend = false }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Selalu nonaktifkan legend default
            },
            title: {
                display: !!title,
                text: title,
                color: '#111827',
                font: {
                    size: 16,
                    weight: 'bold',
                    family: "'Inter', sans-serif"
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                    size: 13,
                    family: "'Inter', sans-serif"
                },
                bodyFont: {
                    size: 12,
                    family: "'Inter', sans-serif"
                },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }

                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);

                        // Format as currency if applicable
                        const formattedValue = new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                        }).format(value);

                        return `${label}${formattedValue} (${percentage}%)`;
                    }
                }
            }
        }
    };

    // Calculate percentages for custom legend
    const total = data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0;
    const percentages = data.datasets[0]?.data.map(value =>
        total > 0 ? ((value / total) * 100).toFixed(1) : 0
    ) || [];

    return (
        <div>
            {/* Chart Container */}
            <div style={{ height: `${height}px` }}>
                <Doughnut data={data} options={options} />
            </div>

            {/* Custom Legend di Bawah Chart */}
            {data.labels && data.labels.length > 0 && (
                <div className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {data.labels.map((label, index) => {
                            const value = data.datasets[0]?.data[index] || 0;
                            const percentage = percentages[index];
                            const color = data.datasets[0]?.backgroundColor[index] || '#ccc';

                            return (
                                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                                    <div
                                        className="w-3 h-3 rounded-full mx-auto mb-2"
                                        style={{ backgroundColor: color }}
                                    ></div>
                                    <p className="text-xs font-medium text-gray-700 mb-1">{label}</p>
                                    <p className="text-sm font-bold text-gray-800">
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0
                                        }).format(value)}
                                    </p>
                                    <p className="text-xs text-gray-600">{percentage}%</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoughnutChart;