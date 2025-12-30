import React from 'react';
import PageTemplate from '../PageTemplate';
import { faShoppingBasket } from '@fortawesome/free-solid-svg-icons';

const LaporanPembelian = () => {
    return (
        <PageTemplate
            title="Laporan Pembelian"
            subtitle="Laporan pembelian dan stok masuk"
            icon={faShoppingBasket}
            message="Belum ada data pembelian"
        />
    );
};

export default LaporanPembelian;
