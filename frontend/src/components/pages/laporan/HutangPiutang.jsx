import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandHoldingUsd, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

const HutangPiutang = () => {
    return (
        <div className="page">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Hutang & Piutang</h2>
                <p className="text-gray-600">Kelola piutang pelanggan dan hutang supplier</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FontAwesomeIcon icon={faHandHoldingUsd} className="mr-2 text-green-500" />
                        Piutang
                    </h3>
                    <div className="text-center text-gray-500 py-8">
                        <p>Belum ada piutang</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-red-500" />
                        Hutang
                    </h3>
                    <div className="text-center text-gray-500 py-8">
                        <p>Belum ada hutang</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HutangPiutang;
