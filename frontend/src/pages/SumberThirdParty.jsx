import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConfigUnlistedSource,
  updateConfigUnlistedSource,
  resetConfigUnlistedSource,
  getUnlistedLibraryByQueries,
} from "../api/unlistedLibraryApi";
import { ShieldQuestion } from "lucide-react";

const SumberThirdParty = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("config");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Pilihan interval refresh token
  const cronIntervals = [5, 10, 15, 20, 30, 50, 75, 90];

  // State untuk form fields sesuai dengan model ConfigUnlistedLibrary
  const [formData, setFormData] = useState({
    isDefault: false,
    inUse: true,
    baseEndpoint: "",
    getTokenEndpoint: "",
    getProductsEndpoint: "",
    stringQueries: "",
    latestToken: "",
    cronInterval: 20, // Default 30 hari
    start_date: "", // Default start_date
    end_date: "", // Default end_date
  });

  // State untuk form validation errors
  const [errors, setErrors] = useState({});

  // Query untuk mengambil konfigurasi
  const {
    data: configData,
    isLoading: isLoadingConfig,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ["unlistedLibraryConfig"],
    queryFn: async () => {
      const response = await getConfigUnlistedSource();
      return response.data;
    },
  });

  // Mutation untuk update konfigurasi
  const updateMutation = useMutation({
    mutationFn: updateConfigUnlistedSource,
    onSuccess: () => {
      setSuccessMessage("Konfigurasi berhasil disimpan");
      setTimeout(() => setSuccessMessage(""), 3000);
      queryClient.invalidateQueries({ queryKey: ["unlistedLibraryConfig"] });
    },
    onError: (error) => {
      console.error("Error updating config:", error);
    },
  });

  // Mutation untuk reset konfigurasi
  const resetMutation = useMutation({
    mutationFn: resetConfigUnlistedSource,
    onSuccess: () => {
      setShowResetConfirm(false);
      setSuccessMessage("Konfigurasi berhasil direset");
      setTimeout(() => setSuccessMessage(""), 3000);
      queryClient.invalidateQueries({ queryKey: ["unlistedLibraryConfig"] });
    },
    onError: (error) => {
      console.error("Error resetting config:", error);
    },
  });

  // Mutation untuk fetch produk
  const fetchProductsMutation = useMutation({
    mutationFn: () => getUnlistedLibraryByQueries(),
    onSuccess: (data) => {
      setSuccessMessage("Data produk berhasil diperbarui");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });

  useEffect(() => {
    // Isi form dengan data konfigurasi yang sudah ada
    if (configData) {
      setFormData({
        isDefault: configData.isDefault || false,
        inUse: configData.inUse !== undefined ? configData.inUse : true,
        baseEndpoint: configData.baseEndpoint || "",
        getTokenEndpoint: configData.getTokenEndpoint || "",
        getProductsEndpoint: configData.getProductsEndpoint || "",
        stringQueries: configData.stringQueries || "",
        latestToken: configData.latestToken || "",
        cronInterval: configData.cronInterval || 30,
        start_date: configData.start_date || "",
        end_date: configData.end_date || "",
      });
    }
  }, [configData]);

  // Handler untuk perubahan form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Jika input type checkbox, gunakan checked property
    const inputValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));

    // Hapus error jika user mulai mengetik
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Validasi form sebelum submit
  const validateForm = () => {
    const newErrors = {};

    if (!formData.baseEndpoint.trim()) {
      newErrors.baseEndpoint = "Base Endpoint wajib diisi";
    }

    if (!formData.getTokenEndpoint.trim()) {
      newErrors.getTokenEndpoint = "Token Endpoint wajib diisi";
    }

    if (!formData.getProductsEndpoint.trim()) {
      newErrors.getProductsEndpoint = "Products Endpoint wajib diisi";
    }

    // Token akan dikelola oleh cron job, jadi tidak perlu validasi di sini

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler untuk menyimpan perubahan konfigurasi
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      updateMutation.mutate(formData);
    }
  };

  // Handler untuk reset konfigurasi
  const handleReset = () => {
    resetMutation.mutate();
  };

  // Handler untuk mengambil data produk
  const handleFetchProducts = () => {
    fetchProductsMutation.mutate();
  };

  // Status loading
  const isLoading =
    isLoadingConfig ||
    updateMutation.isPending ||
    resetMutation.isPending ||
    fetchProductsMutation.isPending;

  // Error handling
  const error =
    configError ||
    updateMutation.error ||
    resetMutation.error ||
    fetchProductsMutation.error;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-6">
          Konfigurasi Sumber Third Party
        </h1>

        {/* Alert untuk pesan sukses */}
        {successMessage && (
          <div className="alert alert-success mb-4 shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Alert untuk error */}
        {error && (
          <div className="alert alert-error mb-4 shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error?.message || "Terjadi kesalahan"}</span>
            </div>
          </div>
        )}

        {/* Tabs untuk navigasi antar halaman */}
        <div className="tabs tabs-boxed mb-6 bg-slate-200">
          <a
            className={`tab ${
              activeTab === "config" ? "bg-green-600 text-white" : ""
            }`}
            onClick={() => setActiveTab("config")}
          >
            Konfigurasi
          </a>
          <a
            className={`tab ${
              activeTab === "products" ? "bg-green-600 text-white" : ""
            }`}
            onClick={() => setActiveTab("products")}
          >
            Produk
          </a>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-4">
            <span className="loading loading-spinner loading-lg text-green-600"></span>
          </div>
        )}

        {/* Form Konfigurasi */}
        {activeTab === "config" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
              {/* Pengaturan Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="cursor-pointer label justify-start gap-2">
                    <input
                      type="checkbox"
                      name="inUse"
                      className="checkbox checkbox-success"
                      checked={formData.inUse}
                      onChange={handleChange}
                    />
                    <span className="label-text">Aktifkan Konfigurasi</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="cursor-pointer label justify-start gap-2">
                    <input
                      type="checkbox"
                      name="isDefault"
                      className="checkbox checkbox-success"
                      checked={formData.isDefault}
                      onChange={handleChange}
                    />
                    <span className="label-text">Jadikan Default</span>
                  </label>
                </div>
              </div>

              {/* URL Endpoints */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">
                    Base Endpoint{" "}
                    <div
                      className="tooltip"
                      data-tip="base endpoint untuk mengambil data dari third party"
                    >
                      <ShieldQuestion />
                    </div>
                  </span>
                </label>
                <input
                  type="text"
                  name="baseEndpoint"
                  className={`input input-bordered border-slate-300 w-full ${
                    errors.baseEndpoint ? "input-error" : ""
                  }`}
                  placeholder="https://api.example.com"
                  value={formData.baseEndpoint}
                  onChange={handleChange}
                />
                {errors.baseEndpoint && (
                  <span className="text-error text-sm mt-1">
                    {errors.baseEndpoint}
                  </span>
                )}
                <span className="label-text-alt mt-1 text-slate-500">
                  Contoh: https://api.distributor.com
                </span>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">
                    Token Endpoint{" "}
                    <div
                      className="tooltip"
                      data-tip="token endpoint untuk mendapatkan token jika token sudah expired"
                    >
                      <ShieldQuestion />
                    </div>
                  </span>
                </label>
                <input
                  type="text"
                  name="getTokenEndpoint"
                  className={`input input-bordered border-slate-300 w-full ${
                    errors.getTokenEndpoint ? "input-error" : ""
                  }`}
                  placeholder="/oauth/token"
                  value={formData.getTokenEndpoint}
                  onChange={handleChange}
                />
                {errors.getTokenEndpoint && (
                  <span className="text-error text-sm mt-1">
                    {errors.getTokenEndpoint}
                  </span>
                )}
                <span className="label-text-alt mt-1 text-slate-500">
                  Contoh: /oauth/token (endpoint untuk mendapatkan token)
                </span>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">
                    Products Endpoint{" "}
                    <div
                      className="tooltip"
                      data-tip="products endpoint untuk mengambil data produk (sku, description, brand)"
                    >
                      <ShieldQuestion />
                    </div>
                  </span>
                </label>
                <input
                  type="text"
                  name="getProductsEndpoint"
                  className={`input input-bordered border-slate-300 w-full ${
                    errors.getProductsEndpoint ? "input-error" : ""
                  }`}
                  placeholder="/api/products"
                  value={formData.getProductsEndpoint}
                  onChange={handleChange}
                />
                {errors.getProductsEndpoint && (
                  <span className="text-error text-sm mt-1">
                    {errors.getProductsEndpoint}
                  </span>
                )}
                <span className="label-text-alt mt-1 text-slate-500">
                  Contoh: /api/products (endpoint untuk mengambil data produk)
                </span>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">
                    String Queries{" "}
                    <div
                      className="tooltip"
                      data-tip="per_page artinya seberapa banyak item diambil dari third party,  (buat 10000 saja karena lebih baik menggunakan filter tangal untuk mendapatkan data)"
                    >
                      <ShieldQuestion />
                    </div>
                  </span>
                </label>
                <input
                  type="text"
                  name="stringQueries"
                  className="input input-bordered border-slate-300 w-full"
                  placeholder="per_page=100&sort=date"
                  value={formData.stringQueries}
                  onChange={handleChange}
                />
                <span className="label-text-alt mt-1 text-slate-500">
                  Contoh: per_page=100 (parameter tambahan untuk request API)
                </span>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">
                    Dimulai dari tanggal (opsional)
                    <div
                      className="tooltip"
                      data-tip="tanggal untuk memulai pengambilan data jika tidak diisi maka default : hari ini dikurang 30 hari"
                    >
                      <ShieldQuestion />
                    </div>
                  </span>
                </label>
                <input
                  type="text"
                  name="start_date"
                  className="input input-bordered border-slate-300 w-full"
                  placeholder="2022-06-13"
                  value={formData.start_date}
                  onChange={handleChange}
                />
                <span className="label-text-alt mt-1 text-slate-500">
                  Contoh: 2022-06-13 (parameter tambahan untuk request API)
                </span>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-medium">
                    Sampai dengan tanggal (opsional)
                    <div
                      className="tooltip"
                      data-tip="tanggal untuk berhenti pengambilan data jika tidak diisi maka default : hari ini"
                    >
                      <ShieldQuestion />
                    </div>
                  </span>
                </label>
                <input
                  type="text"
                  name="end_date"
                  className="input input-bordered border-slate-300 w-full"
                  placeholder="2022-06-13"
                  value={formData.end_date}
                  onChange={handleChange}
                />
                <span className="label-text-alt mt-1 text-slate-500">
                  Contoh: 2022-06-13 (parameter tambahan untuk request API)
                </span>
              </div>

              {/* Interval Pembaruan Token */}
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-medium">
                    Interval Pembaruan Token (Hari)
                    <div
                      className="tooltip"
                      data-tip="waktu interval otomatis menjalankan konfigurasi ini"
                    >
                      <ShieldQuestion />
                    </div>
                  </span>
                </label>
                <select
                  name="cronInterval"
                  className="select select-bordered border-slate-300 w-full"
                  value={formData.cronInterval}
                  onChange={handleChange}
                >
                  {cronIntervals.map((interval) => (
                    <option key={interval} value={interval}>
                      {interval} Hari
                    </option>
                  ))}
                </select>
                <span className="label-text-alt mt-1 text-slate-500">
                  Token akan diperbarui secara otomatis sesuai interval yang
                  dipilih
                </span>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  className="btn btn-error text-white"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isLoading}
                >
                  Reset Konfigurasi
                </button>

                <button
                  type="submit"
                  className="btn bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  Update Konfigurasi
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Produk */}
        {activeTab === "products" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                Data Produk dari Third Party
              </h2>
              <button
                onClick={handleFetchProducts}
                className="btn bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading || !configData}
              >
                Perbarui Data
              </button>
            </div>

            <div className="bg-slate-100 p-4 rounded-md mb-6">
              <h3 className="font-medium text-slate-700 mb-2">
                Informasi Konfigurasi Saat Ini
              </h3>
              {configData ? (
                <div className="text-sm">
                  <p>
                    <span className="font-semibold">Base Endpoint:</span>{" "}
                  </p>
                  <p>
                    <span className="font-semibold">Endpoint Products:</span>{" "}
                    {configData.getProductsEndpoint}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className={`badge ${
                        configData.inUse ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {configData.inUse ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Default:</span>{" "}
                    <span
                      className={`badge ${
                        configData.isDefault ? "badge-info" : "badge-ghost"
                      }`}
                    >
                      {configData.isDefault ? "Ya" : "Tidak"}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Interval Pembaruan:</span>{" "}
                    <span className="badge badge-primary">
                      {configData.cronInterval} Hari
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Status Token:</span>{" "}
                    <span>Secret</span>
                  </p>
                </div>
              ) : (
                <p className="text-slate-500">Konfigurasi belum tersedia</p>
              )}
            </div>

            <div className="text-slate-600">
              <p>
                Klik tombol "Perbarui Data" untuk mengambil data terbaru dari
                API third party dan menyimpannya ke database.
              </p>
              <p className="mt-2">
                Data akan disimpan sebagai referensi untuk inventory dan brand.
              </p>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Reset */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                Konfirmasi Reset
              </h3>
              <p className="text-slate-600 mb-6">
                Apakah Anda yakin ingin mereset konfigurasi? Tindakan ini tidak
                dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-error text-white"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SumberThirdParty;
