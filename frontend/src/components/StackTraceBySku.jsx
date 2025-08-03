import StackTraceApi from "@/api/StackTraceApi";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  History,
  Info,
  Loader2,
  Package,
  PlusCircle,
  Tag,
  User,
} from "lucide-react";
import { useState } from "react";

const StackTraceBySku = ({ skuToTrace }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(100);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");

  const {
    data: stackTraceSkuSingle,
    isPending: isLoadingStackTrace,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "stack-trace-single-sku",
      from,
      to,
      limit,
      page,
      category,
      skuToTrace,
    ],
    queryFn: () =>
      StackTraceApi.getAllStackTraceSku({
        from,
        to,
        limit,
        page,
        category,
        sku: skuToTrace,
      }),
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!skuToTrace,
  });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const getCategoryIcon = (category) => {
    switch (category) {
      case "increase":
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case "decrease":
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      case "spawn":
        return <PlusCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    setPage(1);
    refetch();
  };

  const data = stackTraceSkuSingle?.data || [];
  const total = data.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <dialog id="stack-trace-single-sku" className="modal">
      <div className="modal-box max-w-7xl w-full">
        <button
          className="btn w-full"
          onClick={() =>
            document.getElementById("stack-trace-single-sku").close()
          }
        >
          Close
        </button>
        <h2 className="text-2xl font-bold mb-4">
          Stack Tracing SKU: <span className="text-blue-600">{skuToTrace}</span>{" "}
          — Max {limit} perubahan
        </h2>

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
              className="input input-bordered w-40"
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
              className="input input-bordered w-40"
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

        {isLoadingStackTrace ? (
          <div className="flex justify-center items-center h-40 text-blue-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Memuat data...
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            <AlertCircle className="mx-auto mb-2" />
            Gagal memuat data. Silakan coba lagi.
          </div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-500">
            <Info className="mx-auto mb-2" />
            Tidak ditemukan perubahan untuk SKU ini.
          </div>
        ) : (
          <div className=" border rounded-lg ">
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

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Halaman {page} dari {totalPages || 1} — Total {total} perubahan
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>Close</button>
      </form>
    </dialog>
  );
};

export default StackTraceBySku;
