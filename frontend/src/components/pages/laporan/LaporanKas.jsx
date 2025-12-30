import React from 'react';
import PageTemplate from '../PageTemplate';
import { faWallet } from '@fortawesome/free-solid-svg-icons';

const LaporanKas = () => {
    return (
        <PageTemplate
            title="Laporan Kas"
            subtitle="Arus kas masuk dan keluar"
            icon={faWallet}
            message="Belum ada data kas"
        />
    );
};

export default LaporanKas;
