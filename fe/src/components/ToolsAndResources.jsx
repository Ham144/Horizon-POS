import React from "react";
import { useNavigate } from "react-router-dom";

const ToolsAndResources = () => {
  const navigate = useNavigate();

  return (
    <div className="mb-8 md:mb-10">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">
        Alat & Fitur
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 md:p-6">
            <h3 className="card-title text-base md:text-lg">Kelola Pengguna</h3>
            <p className="text-sm md:text-base">
              Atur akun dan hak akses pengguna sistem
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => navigate("/all_account")}
                className="btn btn-sm"
              >
                Pengguna
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 md:p-6">
            <h3 className="card-title text-base md:text-lg">Kelola SPG</h3>
            <p className="text-sm md:text-base">
              Atur dan pantau kinerja sales promotion girl
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => navigate("/spg_list")}
                className="btn btn-sm"
              >
                SPG
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 md:p-6">
            <h3 className="card-title text-base md:text-lg">Kelola Kasir</h3>
            <p className="text-sm md:text-base">
              Atur dan pantau kinerja kasir di outlet
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => navigate("/kasir_list")}
                className="btn btn-sm"
              >
                Kasir
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 md:p-6">
            <h3 className="card-title text-base md:text-lg">
              Manajemen Outlet
            </h3>
            <p className="text-sm md:text-base">
              Atur dan pantau performa semua outlet
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => navigate("/outlet_list")}
                className="btn btn-sm"
              >
                Outlet
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 md:p-6">
            <h3 className="card-title text-base md:text-lg">Pelanggan</h3>
            <p className="text-sm md:text-base">
              Lihat dan kelola data pelanggan
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => navigate("/customer_list")}
                className="btn btn-sm"
              >
                Pelanggan
              </button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 md:p-6">
            <h3 className="card-title text-base md:text-lg">
              Aplikasi & Database
            </h3>
            <p className="text-sm md:text-base">
              Download aplikasi kasir dan backup database
            </p>
            <div className="card-actions justify-end">
              <button
                onClick={() => navigate("/database")}
                className="btn btn-sm"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ToolsAndResources);
