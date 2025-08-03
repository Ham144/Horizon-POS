import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Fragment } from "react";
import { getInvoiceFilterComplex, voidInvoice } from "../api/invoiceApi";
import { getAllSpg } from "../api/spgApi";
import { getAllAccount } from "../api/authApi";
import { useUserInfo } from "../store";
import { getOuletList, getOuletByUserId } from "../api/outletApi";
import ModalVoid from "@/components/ModalVoid";
import toast from "react-hot-toast";
import { getAllinventories } from "@/api/itemLibraryApi";
import ModalDetailInvoice from "@/components/ModalDetailInvoice";
import { SortAscIcon } from "lucide-react";

export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("id-ID", options);
  } catch (e) {
    return "Tanggal tidak valid";
  }
};

const Invoices = () => {
  const { userInfo } = useUserInfo();
  const [showDetail, setShowDetail] = useState(null);

  const queryClient = useQueryClient();
  const { mutate: handleVoidInvoice } = useMutation({
    mutationFn: (invoiceId) => voidInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "invoices",
          "user",
          "outlet",
          "spg",
          "kasir",
          "diskon",
          "promo",
          "voucher",
          "invoice",
        ],
      });
      toast?.success("Invoice berhasil dibatalkan");
      setSelectedInvoice(null);
      document.getElementById("void").checked = false;
      queryClient.invalidateQueries({
        queryKey: ["invoice", getQueryParams()],
      });
    },
    onError: (error) => {
      toast?.error(
        error?.response?.data?.message || "Gagal membatalkan invoice"
      );
      setSelectedInvoice(null);
      document.getElementById("void").checked = false;
    },
  });

  //inventoris
  const { data: handleGetInventoryById } = useQuery({
    queryKey: ["inventories"],
    queryFn: getAllinventories,
  });

  // Fetch data outlet berdasarkan user yang login
  const { data: myOutlet } = useQuery({
    queryKey: ["outlet", userInfo?._id],
    queryFn: () => getOuletByUserId(userInfo?._id),
    enabled: !!userInfo?._id,
  });

  // Fetch data semua outlet
  const { data: outletData } = useQuery({
    queryKey: ["outlet"],
    queryFn: getOuletList,
  });

  // State untuk filter
  const [status, setStatus] = useState("all");
  const [sorting, setSorting] = useState("time");
  const [outlet, setOutlet] = useState(myOutlet?.data?.kodeOutlet || "");
  const [spg, setSpg] = useState("");
  const [kasir, setKasir] = useState("");
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk expandable rows
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Format status untuk API
  const getStatusForApi = () => {
    if (status === "complete") return { done: "true", isVoid: "false" };
    if (status === "void") return { isVoid: "true" };
    if (status === "pending") return { done: "false", isVoid: "false" };
    if (status === "all") return {}; // Tidak perlu filter untuk "all"
    return {};
  };

  // Format sorting untuk API
  const getSortingForApi = () => {
    if (sorting === "time") return { sortBy: "createdAt", sortOrder: "desc" };
    if (sorting === "invoice")
      return { sortBy: "kodeInvoice", sortOrder: "asc" };
    if (sorting === "total") return { sortBy: "total", sortOrder: "desc" };
    return { sortBy: "createdAt", sortOrder: "desc" };
  };

  // Membuat query params untuk API
  const getQueryParams = () => {
    const statusParams = getStatusForApi();
    const sortingParams = getSortingForApi();

    return {
      ...statusParams,
      ...sortingParams,
      kodeOutlet: outlet,
      spg: spg || undefined,
      kasir: kasir || undefined,
      limit: limit === "All" ? "All" : parseInt(limit),
      search: search || undefined,
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
      page: currentPage,
    };
  };

  // Fetch data invoice menggunakan TanStack Query
  const {
    data: invoiceData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["invoice", getQueryParams()],
    queryFn: () => getInvoiceFilterComplex(["", getQueryParams()]),
    keepPreviousData: true,
  });

  // Fetch data SPG
  const { data: spgData } = useQuery({
    queryKey: ["spg"],
    queryFn: getAllSpg,
  });

  // Fetch data Kasir/Accounts
  const { data: accountsData } = useQuery({
    queryKey: ["user"],
    queryFn: getAllAccount,
  });

  // Toggle expanded row
  const toggleExpandRow = (invoiceId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  // Mendapatkan nama SPG dari ID
  const getSpgNameById = (spgId) => {
    if (!spgData?.data) return spgId;
    const spgItem = spgData?.data?.find((item) => item._id == spgId);
    return spgItem ? spgItem?.name : "spg telah dihapus" || "spg tidak ada?";
  };

  // Mendapatkan nama Kasir dari salesPerson
  const getKasirName = (salesPerson) => {
    if (!accountsData?.data) return salesPerson || "-";
    const account = accountsData.data.find(
      (item) => item.email === salesPerson || item.name === salesPerson
    );
    return account ? account.name : salesPerson || "-";
  };

  // Set default outlet berdasarkan user yang login
  useEffect(() => {
    if (myOutlet?.data?.kodeOutlet) {
      setOutlet(myOutlet.data.kodeOutlet);
    }
  }, [myOutlet]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, sorting, outlet, spg, kasir, limit, search, dateRange]);

  // Function to export data to CSV
  const exportToCSV = () => {
    if (!invoiceData?.data) return;

    // 1. Prepare CSV headers
    const headers = [
      "Kode Invoice",
      "EXT CODE",
      "Tanggal",
      "Kasir",
      "SPG",
      "total invoice",
      "nett total invoice",
      "Status",
      "Billing",
      "Bayar",
      "Kwitansi",
      "sku(items)",
      "harga dasar",
      "sku quantity",
      "Diskon",
      "sku total",
      "Voucher",
    ];

    // 2. Flatten rows
    const rows = [];
    invoiceData.data.forEach((invoice) => {
      const baseInfo = [
        invoice.kodeInvoice,
        invoice._id,
        formatDate(invoice.createdAt),
        getKasirName(invoice.salesPerson),
        getSpgNameById(invoice.spg),
        invoice.subTotal?.toLocaleString("id-ID") || "-",
        invoice.total?.toLocaleString("id-ID") || "-",
        invoice.isVoid ? "Dibatalkan" : invoice.done ? "Selesai" : "Tertunda",
        invoice.isPrintedCustomerBilling ? "Sudah" : "Belum",
        invoice.done ? "Lunas" : "Belum",
        invoice.isPrintedKwitansi ? "Sudah" : "Belum",
      ];

      // a) currentBill items
      invoice.currentBill?.forEach((item) => {
        // cari diskon & voucher yang match sku ini
        const diskEntry = invoice.diskon?.find((d) => d.sku === item.sku);
        const voucherEntry = invoice.futureVoucher?.find(
          (v) => v.sku === item.sku
        );

        rows.push([
          ...baseInfo,
          item.sku,
          item.RpHargaDasar?.toLocaleString("id-ID") || "",
          item.quantity,
          diskEntry?.diskonInfo?.RpPotonganHarga?.toLocaleString("id-ID") || "",
          item.totalRp?.toLocaleString("id-ID") || "",
          voucherEntry?.voucherInfo?.judulVoucher || "",
        ]);
      });

      // b) promo bonus items
      invoice.promo?.forEach((p) => {
        const bonusSku = p.promoInfo?.skuBarangBonus || "";
        rows.push([
          ...baseInfo,
          bonusSku,
          "", // harga dasar kosong
          p.promoInfo?.quantityBonus || 0,
          "", // diskon kosong
          "0", // sku total = 0
          "", // voucher kosong
        ]);
      });
    });

    // 3. Generate CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // 4. Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-base-100 min-h-screen">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-0 z-10 mb-4 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 ">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Manajemen Transaksi
              </h1>
              <p className="text-gray-600 max-w-2xl text-sm">
                Pantau dan kelola seluruh transaksi dengan detail penjualan
                lengkap.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="form-control w-full md:w-auto">
                <div className="input-group input-group-sm shadow-sm flex items-center rounded-md overflow-hidden border border-gray-200 focus-within:border-blue-500">
                  <input
                    type="text"
                    placeholder="Cari invoice..."
                    className="input input-bordered focus:outline-none text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <button className="btn bg-blue-700 text-white hover:bg-blue-600 text-sm font-semibold">
                    <span style={{ fontSize: "1em" }}>🔍</span>
                    <span className="max-xl:hidden">Cari</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-blue-700">
            <span style={{ fontSize: "1em" }}>⚙️</span> Filter Transaksi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700">
                  Tanggal Mulai
                </span>
              </label>
              <div className="relative rounded-md shadow-sm border border-gray-200 focus-within:border-blue-700">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                  <span style={{ fontSize: "1em" }}>📅</span>
                </div>
                <input
                  type="date"
                  className="input input-bordered pl-10 w-full focus:outline-none text-sm"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700">
                  Tanggal Akhir
                </span>
              </label>
              <div className="relative rounded-md shadow-sm border border-gray-200 focus-within:border-blue-700">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                  <span style={{ fontSize: "1em" }}>📅</span>
                </div>
                <input
                  type="date"
                  className="input input-bordered pl-10 w-full focus:outline-none text-sm"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Outlet */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700">
                  Outlet
                </span>
              </label>
              <div className="relative rounded-md shadow-sm border border-gray-200 focus-within:border-blue-700">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                  <span style={{ fontSize: "1em" }}>🏢</span>
                </div>
                <select
                  className="select select-bordered pl-10 w-full focus:outline-none text-sm"
                  value={outlet}
                  onChange={(e) => setOutlet(e.target.value)}
                >
                  {outletData?.data?.map((outletItem) => (
                    <option
                      key={outletItem?.kodeOutlet}
                      value={outletItem.kodeOutlet}
                      className={
                        outletItem.kodeOutlet === myOutlet?.data?.kodeOutlet
                          ? "font-bold"
                          : ""
                      }
                    >
                      {outletItem.namaOutlet} | {outletItem.kodeOutlet}
                      {outletItem.kodeOutlet === myOutlet?.data?.kodeOutlet
                        ? " (Outlet Saya)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Limit */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700">
                  Jumlah Data
                </span>
              </label>
              <div className="rounded-md shadow-sm border border-gray-200 focus-within:border-blue-700">
                <select
                  className="select select-bordered w-full focus:outline-none text-sm"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                >
                  {[50, 100, 200, 400, 800, "All"].map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SPG */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700">
                  SPG
                </span>
              </label>
              <div className="relative rounded-md shadow-sm border border-gray-200 focus-within:border-blue-700">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                  <span style={{ fontSize: "1em" }}>👤</span>
                </div>
                <select
                  className="select select-bordered pl-10 w-full focus:outline-none text-sm"
                  value={spg}
                  onChange={(e) => setSpg(e.target.value)}
                >
                  <option value="">Semua SPG</option>
                  {spgData?.data?.map((spgItem) => (
                    <option key={spgItem._id} value={spgItem._id}>
                      {spgItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kasir */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700">
                  Kasir(Semua akun ditampilkan)
                </span>
              </label>
              <div className="relative rounded-md shadow-sm border border-gray-200 focus-within:border-blue-700">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                  <span style={{ fontSize: "1em" }}>🧑‍💼</span>
                </div>
                <select
                  className="select select-bordered pl-10 w-full focus:outline-none text-sm"
                  value={kasir?.username}
                  onChange={(e) => setKasir(e.target.value)}
                >
                  <option value="">Semua Kasir</option>
                  {accountsData?.data?.map((account) => (
                    <option key={account.username} value={account.username}>
                      {account.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="btn w-full mt-2 rounded-lg shadow-md  bg-blue-700 text-white hover:bg-blue-600 flex items-center"
            disabled={!invoiceData?.data?.length}
          >
            <span style={{ fontSize: "1em" }}>📊</span>
            Export CSV
          </button>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          {/* Status Tabs */}
          <div className="tabs tabs-boxed bg-gray-100 p-2 rounded-full mb-4 shadow-sm">
            {[
              { key: "all", label: "Semua" },
              { key: "complete", label: "Selesai" },
              { key: "void", label: "Dibatalkan" },
              { key: "pending", label: "Tertunda" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`tab tab-lg font-semibold flex-1 ${
                  status === tab.key
                    ? "bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } rounded-full`}
                onClick={() => setStatus(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="flex flex-col items-center gap-2">
                <span className="loading loading-spinner loading-lg text-blue-700"></span>
                <p className="text-gray-600 text-sm">
                  Memuat data transaksi...
                </p>
              </div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center p-12 text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <span style={{ fontSize: "2em", color: "#dc2626" }}>❌</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Gagal Memuat Data
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {error?.message ||
                  "Terjadi kesalahan saat memuat data. Silakan coba lagi."}
              </p>
            </div>
          ) : invoiceData?.data?.length === 0 ? (
            <div className="flex flex-col justify-center items-center p-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <span style={{ fontSize: "2em", color: "#718096" }}>💳</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Tidak Ada Data Transaksi
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Tidak ditemukan transaksi dengan filter yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="table table-zebra w-full">
                <thead className="bg-gray-100 text-gray-700 font-semibold text-sm uppercase tracking-wider">
                  <tr>
                    <th style={{ width: "40px" }}></th>
                    <th
                      onClick={() => setSorting("invoice")}
                      className="px-4 py-3 text-center cursor-pointer hover:bg-gray-200 transition-colors duration-150 flex items-center justify-center gap-1"
                    >
                      <SortAscIcon size={18} className="text-gray-500" />
                      <span>Kode Invoice</span>
                    </th>
                    <th className="px-4 py-3 text-center">Ext Doc</th>
                    <th
                      onClick={() => setSorting("time")}
                      className="px-4 py-3 text-center cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <SortAscIcon size={18} className="text-gray-500" />
                        <span>Tanggal</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center">Kasir</th>
                    <th className="px-4 py-3 text-center">SPG</th>
                    <th className="px-4 py-3 text-center">Harga Asli</th>
                    <th
                      onClick={() => setSorting("total")}
                      className="px-4 py-3 text-center cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <SortAscIcon size={18} className="text-gray-500" />
                        <span>Total</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center">Billing</th>
                    <th className="px-4 py-3 text-center">Bayar</th>
                    <th className="px-4 py-3 text-center">Kwitansi</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData?.data?.map((invoice) => (
                    <Fragment key={invoice._id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="text-center">
                          <button
                            className="btn btn-circle btn-sm btn-ghost"
                            onClick={() => toggleExpandRow(invoice._id)}
                          >
                            <span style={{ fontSize: "1em" }}>
                              {expandedRows[invoice._id] ? "⬆️" : "⬇️"}
                            </span>
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                              <span style={{ fontSize: "0.8em" }}>💳</span>
                            </div>
                            <span className="font-medium text-gray-800 text-sm">
                              {invoice.kodeInvoice}
                            </span>
                          </div>
                        </td>{" "}
                        <td className="text-center ">
                          <span className="font-bold text-sm">
                            {invoice._id}
                          </span>
                        </td>
                        <td className="text-gray-700 text-sm">
                          {formatDate(invoice.createdAt)}
                        </td>
                        <td className="font-medium text-gray-800 text-sm">
                          {getKasirName(invoice.salesPerson)}
                        </td>
                        <td className="text-gray-700 text-sm">
                          {getSpgNameById(invoice?.spg)}
                        </td>
                        <td className="font-mono text-sm">
                          {invoice.subTotal ? (
                            <span className="text-green-600 font-semibold">
                              Rp {invoice.subTotal.toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="font-mono text-sm">
                          {invoice.total ? (
                            <span className="text-blue-600 font-semibold">
                              Rp {invoice.total.toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          {invoice.isPrintedCustomerBilling ? (
                            <div
                              className="tooltip"
                              data-tip="Sudah Cetak Billing"
                            >
                              <div className="badge badge-success badge-sm">
                                <span style={{ fontSize: "0.7em" }}>✅</span>{" "}
                                Cetak
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          {invoice.done ? (
                            <div className="tooltip" data-tip="Sudah Bayar">
                              <div className="badge badge-success badge-sm">
                                <span style={{ fontSize: "0.7em" }}>✅</span>{" "}
                                Lunas
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          {invoice.isPrintedKwitansi ? (
                            <div
                              className="tooltip"
                              data-tip="Sudah Cetak Kwitansi"
                            >
                              <div className="badge badge-success badge-sm">
                                <span style={{ fontSize: "0.7em" }}>✅</span>{" "}
                                Cetak
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge rounded-full px-3 py-1 font-medium text-xs ${
                              invoice.isVoid
                                ? "bg-red-500 text-white"
                                : invoice.done
                                ? "bg-green-500 text-white"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            {invoice.isVoid
                              ? "Dibatalkan"
                              : invoice.done
                              ? "Selesai"
                              : "Tertunda"}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              className="btn btn-sm btn-outline btn-primary tooltip"
                              data-tip="Detail"
                              onClick={() => {
                                document
                                  .getElementById("modalDetailInvoice")
                                  .showModal();
                                setShowDetail(invoice);
                              }}
                            >
                              <span style={{ fontSize: "1em" }}>🔍</span>
                            </button>
                            {!invoice.isVoid &&
                              invoice?.done &&
                              invoice.requestingVoid && (
                                <label
                                  htmlFor="void"
                                  className="btn flex flow-col btn-sm btn-error text-white tooltip"
                                  data-tip="Void"
                                  disabled={isLoading}
                                  onClick={() =>
                                    setSelectedInvoice(invoice._id)
                                  }
                                >
                                  <span style={{ fontSize: "1em" }}>🚫</span>
                                </label>
                              )}
                          </div>
                        </td>
                      </tr>

                      {/* Detail Invoice yang Expand */}
                      {expandedRows[invoice._id] && (
                        <tr>
                          <td colSpan="12" className="p-0">
                            <div className="bg-gray-100/50 p-6 border-t border-b border-gray-200">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Items Purchased */}
                                <div className="col-span-2 card bg-white shadow-sm rounded-lg border border-gray-100">
                                  <div className="card-body p-4">
                                    <h3 className="card-title text-sm flex items-center gap-2 text-blue-700 font-semibold">
                                      <span style={{ fontSize: "1em" }}>
                                        🛒
                                      </span>{" "}
                                      Item Pembelian
                                    </h3>
                                    {invoice.currentBill?.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="table table-xs table-zebra w-full">
                                          <thead className="bg-gray-100/50 text-xs uppercase text-gray-600">
                                            <tr>
                                              <th className="text-left">
                                                Item
                                              </th>
                                              <th className="text-left">
                                                Harga
                                              </th>
                                              <th className="text-center">
                                                Qty
                                              </th>
                                              <th className="text-right">
                                                Subtotal
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {invoice.currentBill.map(
                                              (item, idx) => (
                                                <tr
                                                  key={`<span class="math-inline">\{invoice\.\_id\}\-item\-</span>{idx}`}
                                                  className="hover:bg-gray-50"
                                                >
                                                  <td className="font-medium text-sm">
                                                    {item.description}
                                                  </td>
                                                  <td className="font-mono text-sm">
                                                    Rp{" "}
                                                    {item.RpHargaDasar?.toLocaleString(
                                                      "id-ID"
                                                    )}
                                                  </td>
                                                  <td className="text-center text-sm">
                                                    {item.quantity}
                                                  </td>
                                                  <td className="font-mono font-semibold text-right text-sm">
                                                    Rp{" "}
                                                    {item.totalRp?.toLocaleString(
                                                      "id-ID"
                                                    )}
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-gray-500 bg-gray-100/50 rounded-lg text-sm">
                                        Tidak ada item
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {invoice?.diskon?.length > 0 && (
                                  <div className="card bg-white shadow-sm rounded-lg border border-gray-100">
                                    <div className="card-body p-4">
                                      <h3 className="card-title text-sm flex items-center gap-2 text-blue-700 font-semibold">
                                        <span style={{ fontSize: "1em" }}>
                                          🏷️
                                        </span>{" "}
                                        Diskon
                                      </h3>
                                      {invoice.diskon?.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <table className="table table-xs table-zebra w-full">
                                            <thead className="bg-gray-100/50 text-xs uppercase text-gray-600">
                                              <tr>
                                                <th className="text-left">
                                                  Item
                                                </th>
                                                <th className="text-left">
                                                  Judul Diskon
                                                </th>
                                                <th className="text-right">
                                                  Potongan
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {invoice.diskon.map(
                                                (item, idx) => (
                                                  <tr
                                                    key={`<span class="math-inline">\{invoice\.\_id\}\-diskon\-</span>{idx}`}
                                                    className="hover:bg-gray-50"
                                                  >
                                                    <td className="font-medium text-sm">
                                                      {item.description}
                                                    </td>
                                                    <td className="text-sm">
                                                      {item.diskonInfo
                                                        ?.judulDiskon || "-"}
                                                    </td>
                                                    <td className="font-mono text-right text-sm">
                                                      {item.diskonInfo
                                                        ?.RpPotonganHarga
                                                        ? `Rp ${item.diskonInfo.RpPotonganHarga.toLocaleString(
                                                            "id-ID"
                                                          )}`
                                                        : `${item.diskonInfo?.percentPotonganHarga}%`}
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-gray-500 bg-gray-100/50 rounded-lg text-sm">
                                          Tidak ada diskon
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {invoice?.futureVoucher?.length > 0 && (
                                  <div className="card bg-white shadow-sm rounded-lg border border-gray-100">
                                    <div className="card-body p-4">
                                      <h3 className="card-title text-sm flex items-center gap-2 text-blue-700 font-semibold">
                                        <span style={{ fontSize: "1em" }}>
                                          🎁
                                        </span>{" "}
                                        Future Voucher
                                      </h3>
                                      {invoice.futureVoucher?.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <table className="table table-xs table-zebra w-full">
                                            <thead className="bg-gray-100/50 text-xs uppercase text-gray-600">
                                              <tr>
                                                <th className="text-left">
                                                  Item
                                                </th>
                                                <th className="text-left">
                                                  Judul Voucher
                                                </th>
                                                <th className="text-right">
                                                  Potongan
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {invoice.futureVoucher.map(
                                                (item, idx) => (
                                                  <tr
                                                    key={`<span class="math-inline">\{invoice\.\_id\}\-voucher\-</span>{idx}`}
                                                    className="hover:bg-gray-50"
                                                  >
                                                    <td className="font-medium text-sm">
                                                      {item.description}
                                                    </td>
                                                    <td className="text-sm">
                                                      {item.voucherInfo
                                                        ?.judulVoucher || "-"}
                                                    </td>
                                                    <td className="font-mono text-right text-sm">
                                                      {Intl.NumberFormat(
                                                        "id-ID",
                                                        {
                                                          style: "currency",
                                                          currency: "IDR",
                                                          minimumFractionDigits: 0,
                                                        }
                                                      ).format(
                                                        item.voucherInfo
                                                          ?.potongan
                                                          ?.$numberDecimal
                                                      )}
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-gray-500 bg-gray-100/50 rounded-lg text-sm">
                                          Tidak ada Voucher
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {invoice?.promo?.length > 0 && (
                                  <div className="card bg-white shadow-sm rounded-lg border border-gray-100">
                                    <div className="card-body p-4">
                                      <h3 className="card-title text-sm flex items-center gap-2 text-blue-700 font-semibold">
                                        <span style={{ fontSize: "1em" }}>
                                          🎁
                                        </span>{" "}
                                        Promo
                                      </h3>
                                      {invoice.promo?.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <table className="table table-xs table-zebra w-full">
                                            <thead className="bg-gray-100/50 text-xs uppercase text-gray-600">
                                              <tr>
                                                <th className="text-left">
                                                  Item
                                                </th>
                                                <th className="text-left">
                                                  Judul Promo
                                                </th>
                                                <th className="text-left">
                                                  Bonus
                                                </th>
                                                <th className="text-center">
                                                  Qty Bonus
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {invoice.promo.map(
                                                (item, idx) => (
                                                  <tr
                                                    key={`<span class="math-inline">\{invoice\.\_id\}\-voucher\-</span>{idx}`}
                                                    className="hover:bg-gray-50"
                                                  >
                                                    <td className="font-medium text-sm">
                                                      {item.description}
                                                    </td>
                                                    <td className="text-sm">
                                                      {item.promoInfo
                                                        ?.judulPromo || "-"}
                                                    </td>
                                                    <td className="text-sm">
                                                      {
                                                        item.promoInfo
                                                          .skuBarangBonus
                                                      }
                                                    </td>
                                                    <td className="font-mono text-center text-sm">
                                                      {
                                                        item.promoInfo
                                                          ?.quantityBonus
                                                      }
                                                    </td>
                                                  </tr>
                                                )
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-gray-500 bg-gray-100/50 rounded-lg text-sm">
                                          Tidak ada Promo
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {invoiceData?.pagination && (
                <div className="flex justify-between items-center p-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Menampilkan {invoiceData.data.length} dari{" "}
                    {invoiceData.pagination.total} data
                  </div>

                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage <= 1}
                    >
                      «
                    </button>

                    {/* Generate page buttons */}
                    {Array.from(
                      {
                        length: Math.min(5, invoiceData.pagination.totalPages),
                      },
                      (_, i) => {
                        let pageNum;
                        if (invoiceData.pagination.totalPages <= 5) {
                          // If 5 or fewer pages, show all
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // If near start
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          invoiceData.pagination.totalPages - 2
                        ) {
                          // If near end
                          pageNum = invoiceData.pagination.totalPages - 4 + i;
                        } else {
                          // In the middle
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            className={`join-item btn btn-sm ${
                              currentPage === pageNum
                                ? "btn-active bg-blue-700 text-white border-blue-700"
                                : ""
                            }`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      className="join-item btn btn-sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, invoiceData.pagination.totalPages)
                        )
                      }
                      disabled={
                        currentPage >= invoiceData.pagination.totalPages
                      }
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* modal untuk konfirmasi melakukan void */}
      <ModalVoid
        setSelectedInvoice={setSelectedInvoice}
        handleVoidInvoice={handleVoidInvoice}
        selectedInvoice={selectedInvoice}
      />
      <ModalDetailInvoice showDetail={showDetail} />
    </div>
  );
};

export default Invoices;
