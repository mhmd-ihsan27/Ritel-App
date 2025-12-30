import React from 'react';
import PageTemplate from '../PageTemplate';
import { faUserFriends } from '@fortawesome/free-solid-svg-icons';

const LaporanPelanggan = () => {
    return (
        <PageTemplate
            title="Laporan Pelanggan"
            subtitle="Analisis perilaku dan statistik pelanggan"
            icon={faUserFriends}
            message="Belum ada analisis pelanggan"
        />
    );
};

export default LaporanPelanggan;
