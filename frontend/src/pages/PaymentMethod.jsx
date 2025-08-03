import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllPaymentMethod,
  createPaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodStatus,
} from "../api/paymentMethodApi";
import { Plus } from "lucide-react";

const PaymentMethod = () => {
  const queryClient = useQueryClient();

  // State untuk modal tambah metode pembayaran
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk alert/notifikasi
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // State untuk form
  const [formData, setFormData] = useState({
    method: "",
    discount: "",
    additional_fee: "",
    status: true,
  });

  // State untuk konfirmasi hapus
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Menggunakan TanStack Query untuk fetch data
  const {
    data: paymentMethods = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: getAllPaymentMethod,
  });

  // Mutasi untuk menambah metode pembayaran
  const createMutation = useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => {
      showAlert("Metode pembayaran berhasil ditambahkan");
      setIsModalOpen(false);
      setFormData({
        method: "",
        discount: "",
        additional_fee: "",
        status: true,
      });
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: () => {
      showAlert("Gagal menambahkan metode pembayaran", "error");
    },
  });

  // Mutasi untuk menghapus metode pembayaran
  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      showAlert("Metode pembayaran berhasil dihapus");
      setDeleteConfirm({ show: false, id: null });
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: () => {
      showAlert("Gagal menghapus metode pembayaran", "error");
    },
  });

  // Mutasi untuk mengubah status metode pembayaran
  const toggleStatusMutation = useMutation({
    mutationFn: togglePaymentMethodStatus,
    onSuccess: () => {
      showAlert("Status metode pembayaran berhasil diubah");
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: () => {
      showAlert("Gagal mengubah status metode pembayaran", "error");
    },
  });

  // Fungsi untuk menampilkan alert/notifikasi
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fungsi untuk menangani perubahan pada form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Fungsi untuk menambah metode pembayaran baru
  const handleAddPaymentMethod = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Fungsi untuk menghapus metode pembayaran
  const handleDeletePaymentMethod = (id) => {
    deleteMutation.mutate(id);
  };

  // Fungsi untuk mengubah status aktif/nonaktif metode pembayaran
  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  if (error) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div className="bg-base-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert/Notifikasi */}
        {alert.show && (
          <div className="toast toast-top toast-end z-50">
            <div
              className={`alert ${
                alert.type === "error" ? "alert-error" : "alert-success"
              } shadow-lg`}
            >
              <div>
                {alert.type === "error" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
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
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
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
                )}
                <span>{alert.message}</span>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-base-200 rounded-box p-6 shadow-md mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content">
                Metode Pembayaran
              </h1>
              <p className="text-base-content/70">
                Kelola semua metode pembayaran yang akan muncul di aplikasi
                mobile
              </p>
            </div>
            <button
              className="btn bg-green-400 gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus />
              Tambah Metode Pembayaran
            </button>
          </div>
        </div>

        {/* Tabel Metode Pembayaran */}
        <div className="bg-base-100 rounded-box shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center gap-2">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-base-content/70">
                  Memuat data metode pembayaran...
                </p>
              </div>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="flex flex-col justify-center items-center p-12 text-center">
              <div className="bg-base-200 p-4 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-base-content/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">
                Belum Ada Metode Pembayaran
              </h3>
              <p className="text-base-content/70 mb-4">
                Tambahkan metode pembayaran pertama Anda untuk mulai menerima
                pembayaran.
              </p>
              <button
                className="btn btn-success btn-sm"
                onClick={() => setIsModalOpen(true)}
              >
                Tambah Metode Pembayaran
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th className="rounded-tl-lg">Metode Pembayaran</th>
                    <th>Diskon</th>
                    <th>Biaya Tambahan</th>
                    <th>Status</th>
                    <th className="rounded-tr-lg text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((method) => (
                    <tr key={method._id} className="hover">
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                          </div>
                          {method.method}
                        </div>
                      </td>
                      <td>
                        {method.discount ? (
                          <div className="badge badge-accent text-white">
                            {method.discount}%
                          </div>
                        ) : (
                          <span className="text-base-content/50">-</span>
                        )}
                      </td>
                      <td>
                        {method.additional_fee ? (
                          <div className="badge badge-warning text-white">
                            Rp {method.additional_fee.toLocaleString("id-ID")}
                          </div>
                        ) : (
                          <span className="text-base-content/50">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={`badge ${
                              method.status
                                ? "badge-success text-white"
                                : "badge-error text-white"
                            }`}
                          >
                            {method.status ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <div
                            className="tooltip"
                            data-tip={
                              method.status ? "Nonaktifkan" : "Aktifkan"
                            }
                          >
                            <label className="swap swap-rotate">
                              <input
                                type="checkbox"
                                checked={method.status}
                                onChange={() => handleToggleStatus(method._id)}
                                disabled={toggleStatusMutation.isPending}
                                className="hidden"
                              />
                              <div
                                className={`swap-on ${
                                  method.status ? "text-success" : "text-error"
                                } btn btn-circle btn-sm btn-ghost`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                              <div
                                className={`swap-off ${
                                  method.status ? "text-success" : "text-error"
                                } btn btn-circle btn-sm btn-ghost`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </div>
                            </label>
                          </div>

                          <div className="tooltip" data-tip="Hapus">
                            <button
                              className="btn btn-circle btn-sm btn-error text-white"
                              onClick={() =>
                                setDeleteConfirm({ show: true, id: method._id })
                              }
                              disabled={
                                toggleStatusMutation.isPending ||
                                deleteMutation.isPending
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Tambah Metode Pembayaran */}
        {isModalOpen && (
          <div className="modal modal-open modal-bottom sm:modal-middle">
            <div className="modal-box relative">
              <button
                className="btn btn-sm btn-circle absolute right-2 top-2"
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({
                    method: "",
                    discount: "",
                    additional_fee: "",
                    status: true,
                  });
                }}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg mb-6 ">
                Tambah Metode Pembayaran
              </h3>

              <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Nama Metode Pembayaran
                    </span>
                  </label>
                  <input
                    type="text"
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    placeholder="Contoh: QRIS, Bank Transfer, Cash"
                    className="input input-bordered w-full focus:input-primary"
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      Masukkan nama metode pembayaran
                    </span>
                  </label>
                </div>

                <div className="divider">
                  Detail Tambahan (Tidak perlu diisi)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Diskon (%)</span>
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      placeholder="Diskon dalam persentase"
                      className="input input-bordered w-full focus:input-primary"
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Opsional
                      </span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        Biaya Tambahan (Rp)
                      </span>
                    </label>
                    <input
                      type="number"
                      name="additional_fee"
                      value={formData.additional_fee}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Biaya tambahan dalam Rupiah"
                      className="input input-bordered w-full focus:input-primary"
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Opsional
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleInputChange}
                      className="toggle toggle-primary"
                    />
                    <div>
                      <span className="label-text font-medium">
                        Status Aktif
                      </span>
                      <p className="text-xs text-base-content/60 mt-1">
                        {formData.status
                          ? "Metode pembayaran ini akan segera tersedia untuk transaksi"
                          : "Metode pembayaran ini tidak akan tersedia untuk transaksi"}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="modal-action pt-4">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormData({
                        method: "",
                        discount: "",
                        additional_fee: "",
                        status: true,
                      });
                    }}
                    disabled={createMutation.isPending}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div
              className="modal-backdrop bg-neutral bg-opacity-50"
              onClick={() => setIsModalOpen(false)}
            ></div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {deleteConfirm.show && (
          <div className="modal modal-open modal-bottom sm:modal-middle">
            <div className="modal-box text-center">
              <h3 className="font-bold text-lg mb-2">Konfirmasi Hapus</h3>
              <div className="py-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-error"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-base-content/80">
                  Apakah Anda yakin ingin menghapus metode pembayaran ini?
                </p>
                <p className="text-sm text-base-content/60 mt-2">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-outline"
                  onClick={() => setDeleteConfirm({ show: false, id: null })}
                  disabled={deleteMutation.isPending}
                >
                  Tidak
                </button>
                <button
                  className="btn btn-error text-white"
                  onClick={() => handleDeletePaymentMethod(deleteConfirm.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
            <div
              className="modal-backdrop bg-neutral bg-opacity-50"
              onClick={() => setDeleteConfirm({ show: false, id: null })}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethod;
