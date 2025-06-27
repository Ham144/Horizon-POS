import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoicesByStatus, markInvoiceAsPrinted } from "../api/invoiceApi";
import { formatCurrency } from "../utils/formatCurrency";
import toast from "react-hot-toast";
import { Printer, Check, Clock, Search, X } from "lucide-react";
import { Link } from "react-router-dom";

const KwitansiPembayaranTertunda = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Query untuk mengambil invoice yang sudah dibayar (done=true) tapi belum dicetak kwitansi (isPrintedKwitansi=false)
  // Status "kwitansi_tertunda" akan otomatis filter:
  // 1. done = true
  // 2. isVoid = false
  // 3. isPrintedKwitansi = false
  const {
    data: invoicesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "invoices",
      {
        status: "kwitansi_tertunda",
        limit,
        page,
        isPrintedKwitansi: false,
        search: searchTerm,
      },
    ],
    queryFn: getInvoicesByStatus,
  });

  // Mutation untuk menandai invoice sebagai sudah dicetak kwitansi (cancel)
  const { mutate: markAsPrinted } = useMutation({
    mutationFn: markInvoiceAsPrinted,
    onSuccess: () => {
      toast.success("Invoice berhasil ditandai sebagai sudah dicetak");
      queryClient.invalidateQueries(["invoices"]);
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Gagal mengubah status invoice"
      );
    },
  });

  // Handle cancel
  const handleCancel = (invoiceId) => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menandai invoice ini sebagai sudah dicetak? Invoice ini tidak akan dikirim email oleh cron job."
      )
    ) {
      markAsPrinted(invoiceId);
    }
  };

  // Handle pencarian
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset page ke 1 saat pencarian baru
  };

  // Menghitung total halaman
  const totalPages = invoicesData?.pagination?.totalPages || 1;

  // Helper untuk format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Kwitansi Pembayaran Tertunda
        </h1>
        <p className="text-gray-600">
          Daftar invoice yang sudah dibayar namun belum dicetak bukti
          pembayaran. Invoice ini akan dijadwalkan untuk dikirim email oleh
          sistem pada tiap jam 7 pagi (default), anda bisa mengatur pengirim,
          judul, host, dan konfigurasi smtp lainnya di{" "}
          <Link to="/email_config" className="text-blue-500 badge">
            Email Config
          </Link>
          .
        </p>

        <div className="bg-blue-50 p-4 mt-3 rounded-lg text-xs">
          <p className="font-medium mb-2">
            Halaman ini hanya menampilkan invoice dengan kriteria berikut:
          </p>
          <ul className="list-disc ml-5">
            <li>
              Invoice sudah dibayar (<code>done: true</code>)
            </li>
            <li>
              Invoice tidak dibatalkan (<code>isVoid: false</code>)
            </li>
            <li>
              Invoice belum dicetak kwitansi (
              <code>isPrintedKwitansi: false</code>)
            </li>
            <li>
              Invoice memiliki alamat email pelanggan (field{" "}
              <code>customer</code>)
            </li>
          </ul>
          <p className="mt-2">
            Jika Anda mengklik tombol "Batalkan", invoice akan ditandai sebagai{" "}
            <code>isPrintedKwitansi: true</code> dan tidak akan dikirim oleh
            cron job.
          </p>
        </div>
      </div>

      {/* Search dan Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap gap-4 items-end"
        >
          <div className="form-control ">
            <label className="label">
              <span className="label-text">Cari Invoice</span>
            </label>
            <div className="input-group flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Kode Invoice atau Kasir"
                className="input input-bordered"
              />
              <button type="submit" className="btn btn-square">
                <Search size={18} />
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Tampilkan</span>
            </label>
            <select
              className="select select-bordered"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </form>
      </div>

      {/* Loading dan Error State */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {isError && (
        <div className="alert alert-error my-4">
          <X size={18} />
          <span>Error: {error?.message || "Gagal memuat data invoice"}</span>
        </div>
      )}

      {/* Data Invoice */}
      {!isLoading && !isError && (
        <>
          {invoicesData?.data?.length === 0 ? (
            <div className="alert alert-info">
              <Clock size={18} />
              <span>Tidak ada invoice yang menunggu pencetakan kwitansi</span>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="table table-zebra">
                <thead>
                  <tr className="bg-gray-100">
                    <th>No</th>
                    <th>Kode Invoice</th>
                    <th>Tanggal</th>
                    <th>Kasir</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesData?.data?.map((invoice, index) => (
                    <tr key={invoice._id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>{invoice.kodeInvoice}</td>
                      <td>{formatDate(invoice.createdAt)}</td>
                      <td>{invoice.salesPerson || "-"}</td>
                      <td>
                        {invoice.customer ? (
                          <div className="flex flex-col">
                            <span>{invoice.customer}</span>
                            <span className="text-xs text-gray-500">
                              {invoice.customerName || ""}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{formatCurrency(invoice.total)}</td>
                      <td>
                        <span className="badge badge-success">Lunas</span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => handleCancel(invoice._id)}
                            title="Tandai sebagai sudah dicetak (batalkan pengiriman)"
                          >
                            <X size={16} />
                            <span className="hidden md:inline">Batalkan</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="join">
                <button
                  className="join-item btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  «
                </button>

                {[...Array(totalPages).keys()].map((p) => (
                  <button
                    key={p}
                    className={`join-item btn ${
                      page === p + 1 ? "btn-active" : ""
                    }`}
                    onClick={() => setPage(p + 1)}
                  >
                    {p + 1}
                  </button>
                ))}

                <button
                  className="join-item btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KwitansiPembayaranTertunda;
