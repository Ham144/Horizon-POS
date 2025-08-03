import React from "react";
import { useNavigate } from "react-router-dom";

const QuickAccessCards = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-6 mb-8 md:mb-10">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-primary hover:shadow-lg transition-all">
        <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">
          Penjualan
        </h2>
        <p className="text-gray-600 text-sm md:text-base mb-4">
          Lihat data transaksi dan kelola invoice
        </p>
        <div className="mt-auto">
          <button
            onClick={() => navigate("/invoices")}
            className="btn btn-primary btn-sm"
          >
            Lihat Invoice
          </button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-secondary hover:shadow-lg transition-all">
        <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">
          Inventori
        </h2>
        <p className="text-gray-600 text-sm md:text-base mb-4">
          Kelola stok produk dan pantau pergerakan barang
        </p>
        <div className="mt-auto">
          <button
            onClick={() => navigate("/item_library")}
            className="btn btn-secondary btn-sm"
          >
            Kelola Stok
          </button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-l-4 border-accent hover:shadow-lg transition-all">
        <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">
          Promosi
        </h2>
        <p className="text-gray-600 text-sm md:text-base mb-4">
          Atur diskon, promo, dan voucher untuk pelanggan
        </p>
        <div className="mt-auto">
          <button
            onClick={() => navigate("/promo")}
            className="btn btn-accent btn-sm"
          >
            Atur Promosi
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuickAccessCards);
