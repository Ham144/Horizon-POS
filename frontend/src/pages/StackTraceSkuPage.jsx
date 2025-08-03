import React, { useState } from "react";
import {
  History,
  Tag,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  FileText,
  User,
  Info,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import StackTraceApi from "../api/StackTraceApi";

const StackTraceSkuPage = () => {
  // State untuk filter dan paginasi
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(100);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all"); //increase | decrease | spawn | other
  const [search, setSearch] = useState("");

  // Query data stack trace
  const {
    data: stackTraceData,
    isPending: isLoadingStackTrace,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stack-trace", from, to, limit, page, category, search],
    queryFn: () =>
      StackTraceApi.getAllStackTraceSku({
        from,
        to,
        limit,
        page,
        category,
        sku: search,
      }),
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Helper format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Helper icon kategori
  const getCategoryIcon = (category) => {
    switch (category) {
      case "increase":
        return <ArrowUp className="w-5 h-5 text-green-500" />;
      case "decrease":
        return <ArrowDown className="w-5 h-5 text-red-500" />;
      case "spawn":
        return <PlusCircle className="w-5 h-5 text-blue-500" />;
      case "other":
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  // Data log stack trace
  const data = stackTraceData?.data || [];
  const total = stackTraceData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Handler filter
  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  // Handler reset filter
  const handleReset = () => {
    setFrom("");
    setTo("");
    setPage(1);
    refetch();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className=" mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 border-b pb-4">
          <History className="w-8 h-8 text-blue-600" />
          Buku Besar Perubahan Item{" "}
          <div className="badge badge-primary text-white">beta ⭐</div>
        </h1>
        <p className="text-gray-600 mb-8">
          Menampilkan log perubahan inventaris SKU terbaru. Gunakan filter
          tanggal, kategori, atau pencarian SKU untuk mempersempit pencarian.
        </p>

        {/* Filter tanggal, limit, search SKU, dan kategori */}
        <form
          className="flex flex-wrap gap-4 items-end mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200"
          onSubmit={handleFilter}
        >
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              Dari Tanggal
            </label>
            <input
              type="date"
              className="input input-bordered w-full max-w-xs"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              Sampai Tanggal
            </label>
            <input
              type="date"
              className="input input-bordered w-full max-w-xs"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              Limit
            </label>
            <input
              type="number"
              min={1}
              max={500}
              className="input input-bordered w-24"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              Cari SKU
            </label>
            <input
              type="text"
              className="input input-bordered w-40"
              placeholder="Cari SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700">
              Kategori
            </label>
            <select
              className="select select-bordered w-40"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">Semua</option>
              <option value="increase">Penambahan</option>
              <option value="decrease">Pengurangan</option>
              <option value="spawn">Stok Baru</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary flex gap-2 items-center"
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleReset}>
            Reset
          </button>
        </form>

        {/* Tabel data */}
        {isLoadingStackTrace ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="ml-3 text-lg text-gray-600">Memuat log...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 flex-col text-red-600">
            <AlertCircle className="w-10 h-10 mb-3" />
            <p className="text-lg">Gagal memuat data. Silakan coba lagi.</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-64 flex-col text-gray-500">
            <Info className="w-10 h-10 mb-3" />
            <p className="text-lg">Belum ada log perubahan SKU ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-inner border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Waktu
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" /> SKU / Item
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" /> Aksi
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <History className="w-4 h-4" /> Qty Awal
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <ArrowUp className="w-4 h-4" /> Perubahan
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Deskripsi
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" /> Oleh
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" /> Kode Invoice
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((log, index) => (
                  <tr
                    key={log._id || index}
                    className="hover:bg-gray-50 transition duration-150 ease-in-out"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                      {log.itemId?.sku || log.itemId || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(log.category)}
                        <span
                          className={`
                          font-semibold
                          ${log.category === "increase" ? "text-green-600" : ""}
                          ${log.category === "decrease" ? "text-red-600" : ""}
                          ${log.category === "spawn" ? "text-blue-600" : ""}
                          ${log.category === "other" ? "text-gray-600" : ""}
                        `}
                        >
                          {log.category
                            ? log.category.charAt(0).toUpperCase() +
                              log.category.slice(1)
                            : "Lainnya"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.prevQuantity !== undefined ? log.prevQuantity : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-bold ${
                          log.category === "increase" ||
                          log.category === "spawn"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {log.receivedQuantityTrace > 0 ? "+" : ""}
                        {log.receivedQuantityTrace}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-700 max-w-xs text-wrap"
                      title={log.stackDescription}
                    >
                      {log.stackDescription}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {log.lastEditBy?.username || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log?.kodeInvoice?.kodeInvoice || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Navigasi halaman */}
        {data.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Halaman {page} dari {totalPages || 1} | Total log: {total}
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page === totalPages || totalPages === 0}
                title="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StackTraceSkuPage;
