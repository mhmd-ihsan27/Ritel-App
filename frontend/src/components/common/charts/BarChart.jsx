import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const BarChart = ({ data, title, height = 300, horizontal = false }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#374151',
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                }
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
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null || context.parsed.x !== null) {
                            const value = horizontal ? context.parsed.x : context.parsed.y;

                            // Check if this is a currency or just a number
                            if (label.toLowerCase().includes('revenue') || label.toLowerCase().includes('pendapatan')) {
                                label += new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(value);
                            } else {
                                label += new Intl.NumberFormat('id-ID').format(value);
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                        family: "'Inter', sans-serif"
                    },
                    callback: function(value) {
                        return new Intl.NumberFormat('id-ID', {
                            notation: 'compact',
                            compactDisplay: 'short'
                        }).format(value);
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                        family: "'Inter', sans-serif"
                    }
                },
                grid: {
                    display: horizontal,
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };

    return (
        <div style={{ height: `${height}px` }}>
            <Bar data={data} options={options} />
        </div>
    );
};

export default BarChart;
