import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInvoicesByStatus, getInvoiceStats } from "../api/invoiceApi";
import {
  getInventoryStats,
  searchInventoryByStockCategory,
} from "../api/inventoryStatApi";
import {
  getPurchaseOrderByStatus,
  getPurchaseOrderList,
} from "../api/purchaseOrderApi";
import {
  Search,
  PackageOpen,
  Package,
  ShoppingCart,
  XCircle,
  Clock,
  CheckCircle,
} from "lucide-react";

const Summary = () => {
  // State untuk pencarian dan filtering
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [inventoryTab, setInventoryTab] = useState("empty");
  const [invoiceTab, setInvoiceTab] = useState("completed");
  const [poTab, setPoTab] = useState("pending");

  const [inventorySearch, setInventorySearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [poSearch, setPoSearch] = useState("");

  const [inventoryPage, setInventoryPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [poPage, setPoPage] = useState(1);

  // Purchase Order section
  const [poStatusFilter, setPOStatusFilter] = useState("pending");

  // Ambil semua PO terlepas dari status
  const {
    data: allPurchaseOrders,
    isLoading: allPOLoading,
    error: allPOError,
  } = useQuery({
    queryKey: ["allPurchaseOrders"],
    queryFn: getPurchaseOrderList,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  // Filter PO berdasarkan status untuk membedakan status selesai/belum selesai
  const filterPOByStatus = (data, selectedStatus) => {
    if (!data || !data.length) return [];

    return data.filter((po) => {
      // Hitung status berdasarkan completed/pending
      let totalRequested = 0;
      let totalReceived = 0;
      let isCompleted = true;

      if (po.items && po.items.length > 0) {
        po.items.forEach((item) => {
          const requested = Number(item.request) || 0;
          const received = Number(item.received) || 0;
          totalRequested += requested;
          totalReceived += received;

          // PO dianggap tidak selesai jika ada item dengan received tidak sama dengan request
          if (received !== requested) {
            isCompleted = false;
          }
        });
      } else {
        isCompleted = false;
      }

      return selectedStatus === "completed" ? isCompleted : !isCompleted;
    });
  };

  // Filter PO berdasarkan status yang dipilih
  const filteredPOs = useMemo(() => {
    if (allPurchaseOrders?.data) {
      return filterPOByStatus(allPurchaseOrders.data, poStatusFilter);
    }
    return [];
  }, [allPurchaseOrders, poStatusFilter]);

  // Query untuk data statistik inventori
  const { data: inventoryStats, isLoading: inventoryStatsLoading } = useQuery({
    queryKey: ["inventoryStats"],
    queryFn: getInventoryStats,
    refetchOnWindowFocus: false,
  });

  // Query untuk data statistik invoice, Item Terlaris
  const {
    data: invoiceStats,
    isLoading: invoiceStatsLoading,
    error: invoiceStatsError,
  } = useQuery({
    queryKey: ["invoiceStats", dateRange],
    queryFn: (queryKey) => getInvoiceStats(queryKey),
    refetchOnWindowFocus: false,
    staleTime: 60000,
    cacheTime: 300000,
    retry: 2,
  });

  //ini untuk section Stok Kosong | Stok Menipis | Stok Normal
  const {
    data: inventoriesByCategory,
    isLoading: inventoriesByCategoryLoading,
  } = useQuery({
    queryKey: [
      "inventoryByCategory",
      {
        category: inventoryTab,
        search: inventorySearch,
        page: inventoryPage,
        limit: 10,
      },
    ],
    queryFn: (queryKey) => searchInventoryByStockCategory(queryKey),
    refetchOnWindowFocus: false,
  });

  // Query untuk invoice berdasarkan status
  const { data: invoicesByStatus, isLoading: invoicesByStatusLoading } =
    useQuery({
      queryKey: [
        "invoicesByStatus",
        {
          status: invoiceTab,
          search: invoiceSearch,
          page: invoicePage,
          limit: 10,
          ...dateRange,
        },
      ],
      queryFn: (queryKey) => getInvoicesByStatus(queryKey),
      refetchOnWindowFocus: false,
    });
  // Handler untuk pagination
  const handleInventoryPageChange = (newPage) => {
    setInventoryPage(newPage);
  };

  const handleInvoicePageChange = (newPage) => {
    setInvoicePage(newPage);
  };

  const handlePoPageChange = (newPage) => {
    setPoPage(newPage);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Bagian statistik utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Statistik Inventory */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PackageOpen size={20} />
            Statistik Inventori
          </h2>
          {inventoryStatsLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Inventori:</span>
                <span className="font-semibold">
                  {inventoryStats?.data?.inventoryCounts?.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stok Kosong:</span>
                <span className="font-semibold text-red-500">
                  {inventoryStats?.data?.inventoryCounts?.emptyStock || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stok Menipis:</span>
                <span className="font-semibold text-yellow-500">
                  {inventoryStats?.data?.inventoryCounts?.lowStock || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Item Tersedia:</span>
                <span className="font-semibold">
                  {inventoryStats?.data?.inventoryCounts?.totalItems || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nilai Total Stok:</span>
                <span className="font-semibold">
                  {formatCurrency(inventoryStats?.data?.totalStockValue || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistik Penjualan */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              Statistik Penjualan
            </div>
          </h2>
          <div className="flex gap-3 mb-4">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="border p-2 rounded text-sm"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="border p-2 rounded text-sm"
            />
          </div>
          {invoiceStatsLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ) : invoiceStatsError ? (
            <div className="text-red-500 text-sm">
              Terjadi kesalahan saat memuat data penjualan. Silakan coba lagi
              nanti.
              <div className="mt-2 text-xs text-gray-600">
                Detail: {invoiceStatsError.message || "Unknown error"}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Penjualan:</span>
                <span className="font-semibold">
                  {invoiceStats?.data?.counts?.completed || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Menunggu Pembayaran:</span>
                <span className="font-semibold text-yellow-500">
                  {invoiceStats?.data?.counts?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dibatalkan:</span>
                <span className="font-semibold text-red-500">
                  {invoiceStats?.data?.counts?.void || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pendapatan:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(invoiceStats?.data?.totalSales || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistik Purchase Order */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package size={20} />
            Statistik Purchase Order
          </h2>
          {inventoryStatsLoading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total PO:</span>
                <span className="font-semibold">
                  {inventoryStats?.data?.purchaseOrderStats?.total || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PO Selesai:</span>
                <span className="font-semibold text-green-500">
                  {inventoryStats?.data?.purchaseOrderStats?.completed || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PO Tertunda:</span>
                <span className="font-semibold text-yellow-500">
                  {inventoryStats?.data?.purchaseOrderStats?.pending || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item Diminta:</span>
                <span className="font-semibold">
                  {inventoryStats?.data?.purchaseOrderStats?.itemsRequested ||
                    0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Item Diterima:</span>
                <span className="font-semibold">
                  {inventoryStats?.data?.purchaseOrderStats?.itemsReceived || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Terlaris */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Item Terlaris</h2>
        {invoiceStatsLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Terjual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Penjualan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceStats?.data?.topSellingItems?.length > 0 ? (
                  invoiceStats.data.topSellingItems.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.totalSales)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Tidak ada data penjualan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabs untuk Inventory, Invoice dan Purchase Order */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tab Inventory */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b">
            <div className="flex flex-wrap">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  inventoryTab === "empty"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setInventoryTab("empty");
                  setInventoryPage(1);
                }}
              >
                Stok Kosong
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  inventoryTab === "low"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setInventoryTab("low");
                  setInventoryPage(1);
                }}
              >
                Stok Menipis
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  inventoryTab === "normal"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setInventoryTab("normal");
                  setInventoryPage(1);
                }}
              >
                Stok Normal
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Cari inventori..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full p-2 pl-10 border rounded"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>

            {inventoriesByCategoryLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deskripsi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoriesByCategory?.data?.length > 0 ? (
                        inventoriesByCategory.data.map((item) => (
                          <tr key={item._id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.sku}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.quantity <= 0
                                    ? "bg-red-100 text-red-800"
                                    : item.quantity <= 10
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(
                                item.RpHargaDasar
                                  ? item.RpHargaDasar.$numberDecimal
                                  : 0
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-3 text-center text-sm text-gray-500"
                          >
                            Tidak ada data inventori
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination untuk Inventory */}
                {inventoriesByCategory?.pagination?.totalPages > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    <button
                      onClick={() =>
                        handleInventoryPageChange(
                          Math.max(1, inventoryPage - 1)
                        )
                      }
                      disabled={inventoryPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1">
                      {inventoryPage} dari{" "}
                      {inventoriesByCategory.pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        handleInventoryPageChange(
                          Math.min(
                            inventoriesByCategory.pagination.totalPages,
                            inventoryPage + 1
                          )
                        )
                      }
                      disabled={
                        inventoryPage ===
                        inventoriesByCategory.pagination.totalPages
                      }
                      className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tab Invoice */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b">
            <div className="flex flex-wrap">
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                  invoiceTab === "completed"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setInvoiceTab("completed");
                  setInvoicePage(1);
                }}
              >
                <CheckCircle size={16} /> Selesai
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                  invoiceTab === "pending"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setInvoiceTab("pending");
                  setInvoicePage(1);
                }}
              >
                <Clock size={16} /> Menunggu
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                  invoiceTab === "void"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setInvoiceTab("void");
                  setInvoicePage(1);
                }}
              >
                <XCircle size={16} /> Batal
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Cari invoice..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full p-2 pl-10 border rounded"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>

            {invoicesByStatusLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kode Invoice
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kasir/SPG
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoicesByStatus?.data?.length > 0 ? (
                        invoicesByStatus.data.map((invoice) => (
                          <tr key={invoice._id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {invoice.kodeInvoice}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {new Date(invoice.createdAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {invoice.salesPerson}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(invoice.total || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-3 text-center text-sm text-gray-500"
                          >
                            Tidak ada data invoice
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination untuk Invoice */}
                {invoicesByStatus?.pagination?.totalPages > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    <button
                      onClick={() =>
                        handleInvoicePageChange(Math.max(1, invoicePage - 1))
                      }
                      disabled={invoicePage === 1}
                      className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1">
                      {invoicePage} dari{" "}
                      {invoicesByStatus.pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        handleInvoicePageChange(
                          Math.min(
                            invoicesByStatus.pagination.totalPages,
                            invoicePage + 1
                          )
                        )
                      }
                      disabled={
                        invoicePage === invoicesByStatus.pagination.totalPages
                      }
                      className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tab Purchase Order */}
        <div className="bg-white rounded-lg shadow-md lg:col-span-2">
          <div className="border-b">
            <div className="flex flex-wrap">
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                  poTab === "completed"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setPoTab("completed");
                  setPOStatusFilter("completed");
                }}
              >
                <CheckCircle size={16} /> PO Selesai
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center gap-1 ${
                  poTab === "pending"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setPoTab("pending");
                  setPOStatusFilter("pending");
                }}
              >
                <Clock size={16} /> PO Tertunda
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Cari purchase order..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                className="w-full p-2 pl-10 border rounded"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>

            {/* Tabel PO */}
            <div className="mt-4 bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ERP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plat
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allPOLoading ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-3">
                          <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : allPOError ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-3 text-center text-sm text-red-500"
                        >
                          Terjadi kesalahan saat memuat data purchase order
                        </td>
                      </tr>
                    ) : filteredPOs.length > 0 ? (
                      filteredPOs.map((po) => {
                        // Hitung total item dan item yang diterima
                        let totalRequested = 0;
                        let totalReceived = 0;
                        let isCompleted = true; // Asumsikan awalnya completed

                        if (po.items && po.items.length > 0) {
                          // Cek apakah setiap item memiliki received sama dengan request
                          po.items.forEach((item) => {
                            const requested = Number(item.request) || 0;
                            const received = Number(item.received) || 0;

                            totalRequested += requested;
                            totalReceived += received;

                            // PO dianggap tidak selesai jika ada item dengan received tidak sama dengan request
                            if (received !== requested) {
                              isCompleted = false; // Set ke false dan tidak akan berubah lagi
                            }
                          });
                        } else {
                          // Jika tidak ada item, anggap sebagai pending
                          isCompleted = false;
                        }

                        return (
                          <tr key={po._id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {po.Erp}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {po.plat || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {new Date(po.createdAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {totalRequested}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isCompleted
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {totalReceived} / {totalRequested}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-3 text-center text-sm text-gray-500"
                        >
                          {poStatusFilter === "completed"
                            ? "Tidak ada purchase order yang selesai"
                            : "Tidak ada purchase order yang tertunda"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
