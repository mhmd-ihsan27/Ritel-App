import React from 'react';
import PageTemplate from '../PageTemplate';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';

const LabaRugi = () => {
    return (
        <PageTemplate
            title="Laporan Laba Rugi"
            subtitle="Analisis keuntungan dan kerugian"
            icon={faChartPie}
            message="Belum ada data laba rugi"
        />
    );
};

export default LabaRugi;
