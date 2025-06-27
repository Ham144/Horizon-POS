import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import {
  FileWarningIcon,
  TrendingUp,
  Users,
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  Store,
  CreditCard,
  SignalHigh,
  User2,
  MailWarning,
} from "lucide-react";
import { getAllPaymentMethod } from "@/api/paymentMethodApi";
import {
  getSalesReportData,
  getSpgSalesData,
  getRankingSpgKasir,
  getPaymentMethodRanking,
  downloadRangkingPaymentMethodDetail,
} from "@/api/dashboardApi";
import toast from "react-hot-toast";
import { getOuletByUserId, getOuletList } from "@/api/outletApi";
import { useUserInfo } from "@/store";
import ModalDetailInvoicesByPaymentMethod from "@/components/ModalDetailInvoicesByPaymentMethod";
import { getInvoicesByPaymentMethod } from "@/api/invoiceApi";
import { getAllSpg } from "@/api/spgApi";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const SalesReport = () => {
  // ============= FILTER STATE =============
  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6))
      .toISOString()
      .split("T")[0],
    endDate: today,
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("success");

  const [countMethod, setCountMethod] = useState("settlement");

  // ============= QUERIES REQUIRED VARIABLES =============
  const { userInfo } = useUserInfo();

  const { data: myOutlet } = useQuery({
    queryKey: ["myOutlet", userInfo?._id],
    queryFn: () => getOuletByUserId(userInfo?._id),
    enabled: !!userInfo?._id,
  });

  const [selectedOutlet, setSelectedOutlet] = useState();
  const [
    paymentMethodToGetDetailInvoices,
    setPaymentMethodToGetDetailInvoices,
  ] = useState();

  const { data: outletList } = useQuery({
    queryKey: ["outlet"],
    queryFn: getOuletList,
    enabled: !!myOutlet,
  });

  //field tidak ikut filter
  //note: activeTemplate tidak ikut filter ini hanya template waktu  dateRange
  const [activeTemplate, setActiveTemplate] = useState("7days");
  const selectedOutletObj = useMemo(
    () => outletList?.data?.find((item) => item.kodeOutlet === selectedOutlet),
    [outletList, selectedOutlet]
  );

  const { data: paymentMethodList } = useQuery({
    queryKey: ["paymentMethod"],
    queryFn: getAllPaymentMethod,
    enabled: !!selectedOutlet,
  });

  const { data: spgList } = useQuery({
    queryKey: ["spg"],
    queryFn: getAllSpg,
  });

  // ============= QUERIES LAPORAN PENJUALAN =============
  const { data: salesData } = useQuery({
    queryKey: [
      "salesReport",
      dateRange,
      selectedOutlet,
      paymentMethod,
      transactionStatus,
      countMethod,
    ],
    queryFn: () =>
      getSalesReportData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        outlet: selectedOutlet,
        paymentMethod,
        transactionStatus,
        countMethod,
      }),
    enabled: !!selectedOutlet && !!paymentMethod,
  });

  const { data: rankingData } = useQuery({
    queryKey: ["rankingSpgKasir", dateRange, selectedOutlet],
    queryFn: () =>
      getRankingSpgKasir({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        transactionStatus,
      }),
    enabled: !!selectedOutlet,
  });

  async function handleDownloadRangkingPaymentMethodDetail() {
    const loadingToastId = toast.loading(
      "Waiting for all data to be loaded..."
    );
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    await delay(4000);
    toast.dismiss(loadingToastId);
    console.log(
      "tunggu 4 detik untuk jaga jaga ada query tanstack yang berat masih belum dimuat"
    );
    toast.success("All data loaded successfully");

    const responses = await Promise.all(
      paymentMethodRanking?.data?.paymentMethodRank?.map(async (item) => {
        return await getInvoicesByPaymentMethod({
          paymentMethod: item._id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          transactionStatus,
          outlet: selectedOutlet,
        });
      })
    );
    // Menggabungkan semua detail invoice dalam satu array
    const allInvoices = responses.flatMap((response) => response.data || []);
    if (allInvoices.length === 0) {
      toast("Tidak ada detail invoice untuk didownload");
      return;
    }

    // Menentukan jumlah maksimum item currentBill untuk header dinamis
    let maxCurrentBillItems = 0;
    allInvoices.forEach((invoice) => {
      const billItems = invoice.currentBill || [];
      if (billItems.length > maxCurrentBillItems) {
        maxCurrentBillItems = billItems.length;
      }
    });

    // Properti dari currentBill yang akan di-pivot, sesuai urutan di gambar
    const currentBillPropertyKeys_const = [
      "sku",
      "RpHargaDasar",
      "description",
      "quantity",
      "totalRp",
      "catatan",
    ];

    // Mempersiapkan header untuk CSV
    const baseObjectKeys_const =
      allInvoices.length > 0 ? Object.keys(allInvoices[0]) : [];

    // Hanya field ini yang benar-benar dihilangkan dari output CSV
    const trulyExcludedKeys_const = [
      "_id",
      "__v",
      "sync",
      "updatedAt",
      "currentBill",
    ];

    // Field yang akan ditempatkan secara manual (kodeInvoice, spg) atau tidak termasuk dalam otherInvoiceHeaders
    const manuallyPlacedOrInternalKeys_const = [
      ...trulyExcludedKeys_const,
      "kodeInvoice",
      "spg",
    ]; // spg akan diisi baik oleh SPG utama atau nilai item currentBill

    // Ambil semua header lain dari invoice, kecuali yang di-exclude atau ditempatkan manual
    const otherInvoiceHeaders_const = baseObjectKeys_const.filter(
      (key) => !manuallyPlacedOrInternalKeys_const.includes(key)
    );

    // Header: kodeInvoice, currentBill (key item/count), spg (value item/spg asli), ...sisanya
    const finalHeaders_const = [
      "kodeInvoice",
      "currentBill",
      "salesPerson",
      "spg",
      ...otherInvoiceHeaders_const.filter(
        (h) => h !== "salesPerson" && h !== "spg"
      ),
    ];

    const csvOutputRows = [];
    csvOutputRows.push(
      finalHeaders_const
        .map((h) => `"${String(h).replace(/"/g, '""')}"`)
        .join(";")
    );

    const escapeCell = (val) => {
      const valueString = val === null || val === undefined ? "" : String(val);
      if (typeof val === "object" && val !== null) {
        try {
          if (
            Array.isArray(val) &&
            val.length > 0 &&
            typeof val[0] === "object"
          ) {
            const itemStrings = val.map((objItem) =>
              Object.entries(objItem)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")
            );
            return `"${itemStrings.join(" | ").replace(/"/g, '""')}"`;
          }
          return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        } catch (e) {
          return `"[Object]"`;
        }
      }
      return `"${valueString.replace(/"/g, '""')}"`;
    };

    allInvoices.forEach((invoice) => {
      const mainInvoiceRow = new Array(finalHeaders_const.length).fill("");
      const billItems = invoice.currentBill || [];

      finalHeaders_const.forEach((header, idx) => {
        if (header === "kodeInvoice") {
          mainInvoiceRow[idx] = invoice.kodeInvoice;
        } else if (header === "currentBill") {
          mainInvoiceRow[idx] = billItems.length;
        } else if (header === "tanggalBayar") {
          mainInvoiceRow[idx] = new Date(
            invoice.tanggalBayar
          ).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } else if (header === "salesPerson") {
          mainInvoiceRow[idx] = invoice.salesPerson || "";
        } else if (header === "spg") {
          const spgObj = spgList?.data?.find((s) => s._id === invoice.spg);
          mainInvoiceRow[idx] = spgObj?.name || invoice.spg || "";
        } else if (invoice.hasOwnProperty(header)) {
          if (header === "createdAt" && invoice.createdAt) {
            try {
              const date = new Date(invoice.createdAt);
              const day = String(date.getDate()).padStart(2, "0");
              const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
              const year = date.getFullYear();
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              const seconds = String(date.getSeconds()).padStart(2, "0");
              mainInvoiceRow[
                idx
              ] = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            } catch (e) {
              mainInvoiceRow[idx] = invoice.createdAt; // Fallback
            }
          } else {
            mainInvoiceRow[idx] = invoice[header];
          }
        }
      });
      csvOutputRows.push(
        mainInvoiceRow.map((val) => escapeCell(val)).join(";")
      );

      billItems.forEach((item) => {
        currentBillPropertyKeys_const.forEach((propKey) => {
          const detailRow = new Array(finalHeaders_const.length).fill("");
          const currentBillHeaderIndex =
            finalHeaders_const.indexOf("currentBill");
          const spgHeaderIndex = finalHeaders_const.indexOf("spg");

          if (currentBillHeaderIndex !== -1) {
            detailRow[currentBillHeaderIndex] = propKey; // Nama properti di kolom 'currentBill'
          }
          if (spgHeaderIndex !== -1) {
            detailRow[spgHeaderIndex] = item[propKey]; // Nilai properti di kolom 'spg'
          }
          csvOutputRows.push(detailRow.map((val) => escapeCell(val)).join(";"));
        });
      });
    });

    const csvString = csvOutputRows.join("\n");
    // Membuat blob untuk file CSV dan mendownloadnya
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    link.download = `Statement catur POS - filter:: ${selectedOutletObj?.namaOutlet} : ${date} - ${dateRange.startDate}: ${dateRange.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  useEffect(() => {
    function variableInit() {
      if (myOutlet?.data) {
        setSelectedOutlet(myOutlet?.data?.kodeOutlet);
        setPaymentMethod("all");
      }
    }
    variableInit();
  }, [myOutlet]);

  // ============= FILTER HANDLERS =============
  const timeTemplates = [
    { label: "Periode Settlement Saat ini", value: "settlement", icon: "📅" },
    { label: "7 Hari Terakhir", value: "7days", icon: "📆" },
    { label: "1 Bulan Terakhir", value: "1month", icon: "📆" },
    { label: "2 Bulan Terakhir", value: "2months", icon: "📆" },
    { label: "3 Bulan Terakhir", value: "3months", icon: "📆" },
    { label: "1 Tahun Terakhir", value: "1year", icon: "📆" },
  ];

  const setDateFromTemplate = (template) => {
    const end = new Date();
    let start = new Date();

    const index = outletList?.data?.findIndex(
      (item) => item.kodeOutlet === selectedOutlet
    );
    const selectedOutletObj = outletList?.data[index];

    switch (template) {
      case "settlement":
        start = new Date(
          new Date().setDate(
            new Date().getDate() - selectedOutletObj?.periodeSettlement
          )
        );
        break;
      case "3days":
        start.setDate(end.getDate() - 2);
        break;
      case "7days":
        start.setDate(end.getDate() - 6);
        break;
      case "1month":
        start.setMonth(end.getMonth() - 1);
        break;
      case "2months":
        start.setMonth(end.getMonth() - 2);
        break;
      case "3months":
        start.setMonth(end.getMonth() - 3);
        break;
      default:
        break;
    }

    const newDateRange = {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };

    setDateRange(newDateRange);
    setActiveTemplate(template); // set string template aktif
  };

  const handleDateChange = (e, field) => {
    const newDateRange = {
      ...dateRange,
      [field]: e.target.value,
    };
    setDateRange(newDateRange);
  };

  const handleFilterChange = (e, setter) => {
    setter(e.target.value);
  };

  const handlePrintLaporanLengkap = () => {
    toast("Sedang dalam pengembangan");
  };

  // ============= PENGOLAHAN DATA CHART =============
  const salesChartData = useMemo(() => {
    if (!salesData?.data?.length)
      return {
        labels: [],
        datasets: [
          {
            label: "Total Penjualan",
            data: [],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      };

    return {
      labels: salesData.data.map((item) => item.date),
      datasets: [
        {
          label: "Total Penjualan",
          data: salesData.data.map((item) => item.totalSales),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [salesData]);

  //rangking-payment-method
  const { data: paymentMethodRanking } = useQuery({
    queryKey: [
      "paymentMethodRanking",
      dateRange,
      selectedOutlet,
      transactionStatus,
    ],
    queryFn: () =>
      getPaymentMethodRanking({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        transactionStatus,
        outlet: selectedOutlet,
      }),
    enabled: !!selectedOutlet,
  });

  return (
    <div className="container mx-auto px-4 py-8 gap-y-6 flex flex-col">
      <div role="alert" className="alert alert-warning shadow-lg">
        <FileWarningIcon className="w-6 h-6" />
        <span>Masih dalam pengembangan.</span>
        <span>Data Belum lengkap dan belum tentu benar.</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
      </div>
      {/* ============= FILTER SECTION ============= */}
      <div className="flex gap-2 flex-col md:flex-row  ">
        {selectedOutlet !== "all" && (
          <div className="bg-base-100 p-6 rounded-xl shadow-md border border-base-200 md:flex flex-col w-full max-w-[30%]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 pb-2 border-b border-base-200">
              <Store className="w-5 h-5 text-primary" />
              Informasi Outlet
            </h2>
            <div className="grid grid-cols-1 gap-3 mt-2">
              {/* Identitas Outlet */}
              <div className="space-y-2">
                {/* logo outlet */}
                <div className="flex justify-center">
                  <img
                    src={selectedOutletObj?.logo}
                    alt="Logo Outlet belum diatur"
                    width={300}
                    height={100}
                    className="rounded-full"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">
                    Nama Outlet
                  </span>
                  <span className="font-medium">
                    {selectedOutletObj?.namaOutlet || "PRJ"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">
                    Kode Outlet
                  </span>
                  <span className="font-medium">
                    {selectedOutletObj?.kodeOutlet || "01"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">
                    Nama Perusahaan
                  </span>
                  <span className="font-medium">PT Catur Sukses Indo</span>
                </div>
              </div>

              {/* Divider */}
              <div className="divider my-0"></div>

              {/* Informasi Legalitas dan Lokasi */}
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">NPWP</span>
                  <span className="font-medium">
                    {selectedOutletObj?.npwp || "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">Alamat</span>
                  <span className="font-medium line-clamp-2">
                    {selectedOutletObj?.alamat || "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">
                    Deskripsi
                  </span>
                  <span className="font-medium line-clamp-2">
                    {selectedOutletObj?.description || "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">
                    Jumlah kasir terhubung
                  </span>
                  <span className="font-medium line-clamp-2">
                    {selectedOutletObj?.kasirList?.length || "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-base-content/70">
                    Jumlah Brand terhubung
                  </span>
                  <span className="font-medium line-clamp-2">
                    {selectedOutletObj?.brandIds?.length || "semuanya"}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="divider my-0"></div>

              {/* Informasi Keuangan */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/70">
                    Pendapatan Recorded (Selamanya)
                  </span>
                  <span className="font-medium text-success">
                    {Intl.NumberFormat("id-ID", {
                      currency: "IDR",
                      style: "currency",
                      minimumFractionDigits: 0,
                    }).format(selectedOutletObj?.pendapatan || 0)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/70">
                    Jumlah Invoice
                  </span>
                  <span className="font-medium">
                    {selectedOutletObj?.jumlahInvoice || 0}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="divider my-0"></div>

              {/* Informasi Settlement */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/70">
                    Periode Settlement
                  </span>
                  <span className="font-medium">
                    {selectedOutletObj?.periodeSettlement} Hari
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/70">
                    Jam Settlement
                  </span>
                  <span className="font-medium">
                    {selectedOutletObj?.jamSettlement}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-lg mb-6 border border-gray-100 transition-all duration-300 hover:shadow-xl flex-1 justify-between flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Filter className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">Filter Laporan</h2>
          </div>

          {/* Time Template Buttons */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {timeTemplates?.length > 0 &&
                timeTemplates?.map((template) => (
                  <button
                    key={template.value}
                    className={`btn btn-sm gap-2 transition-all duration-200 ${
                      activeTemplate === template.value
                        ? "btn-primary text-white shadow-md"
                        : "btn-ghost bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setDateFromTemplate(template.value)}
                  >
                    <span className="text-lg">{template.icon}</span>
                    {template.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Download Button */}
          <div className="mb-8">
            <button
              onClick={handlePrintLaporanLengkap}
              className="btn w-full btn-primary btn-sm gap-2 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Download className="w-5 h-5" />
              Download Laporan (CSV)
            </button>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Date Range */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>Tanggal Mulai</span>
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange(e, "startDate")}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>Tanggal Akhir</span>
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange(e, "endDate")}
              />
            </div>

            {/* Payment Method */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>Metode Pembayaran</span>
                </span>
              </label>
              <select
                className="select select-bordered border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white rounded-lg"
                value={paymentMethod || "all"}
                onChange={(e) => handleFilterChange(e, setPaymentMethod)}
              >
                <option value="all">Semua Metode</option>
                {paymentMethodList?.map((paymentMethod) => (
                  <option
                    key={paymentMethod?.method}
                    value={paymentMethod?.method}
                  >
                    {paymentMethod?.method}
                  </option>
                ))}
              </select>
            </div>

            {/* Outlet */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  <span>Outlet</span>
                </span>
              </label>
              <select
                className="select select-bordered border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white rounded-lg"
                value={selectedOutlet}
                onChange={(e) => handleFilterChange(e, setSelectedOutlet)}
              >
                <option value="all">Gabungkan Semua Outlet</option>
                {outletList?.data?.map((outlet) => (
                  <option key={outlet?.kodeOutlet} value={outlet?.kodeOutlet}>
                    {outlet?.namaOutlet} - {outlet?.kodeOutlet}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Status */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                  <SignalHigh className="w-5 h-5 text-primary" />
                  <span>Status Transaksi</span>
                </span>
              </label>
              <select
                className="select select-bordered border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white rounded-lg"
                value={transactionStatus}
                onChange={(e) => handleFilterChange(e, setTransactionStatus)}
              >
                <option value="all">Semua Status</option>
                <option value="success" className="text-green-600">
                  Sukses
                </option>
                <option value="void" className="text-red-600">
                  Dibatalkan (void)
                </option>
                <option value="pending" className="text-yellow-600">
                  Belum Dibayar
                </option>
              </select>
            </div>

            {/* Report Calculation Method */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-700 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <span>Metode Perhitungan</span>
                </span>
              </label>
              <select
                className="select select-bordered border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white rounded-lg"
                value={countMethod}
                onChange={(e) => handleFilterChange(e, setCountMethod)}
              >
                <option value="settlement">
                  Default: waktu settlement outlet
                </option>
                <option value="perhari">Perhari</option>
                <option value="perminggu">Perminggu</option>
                <option value="perbulan">Perbulan</option>
                <option value="pertahun">Pertahun</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                className="btn btn-outline btn-error text-error hover:bg-error/10 hover:border-error/80 transition-all"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>
          <div className="flex gap-x-2 mt-12">
            <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300 md:flex flex-col w-full">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Ringkasan Statistik
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="stat bg-secondary text-secondary-content rounded-xl shadow-md">
                  <div className="stat-title">Total Penjualan</div>
                  <div className="stat-value text-lg">
                    {Intl.NumberFormat("id-ID", {
                      currency: "IDR",
                      style: "currency",
                      minimumFractionDigits: 0,
                    }).format(
                      salesData?.data?.reduce(
                        (sum, item) => sum + item.totalSales,
                        0
                      ) || 0
                    )}
                  </div>
                </div>
                <div className="stat bg-secondary text-secondary-content rounded-xl shadow-md">
                  <div className="stat-figure">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Transaksi</div>
                  <div className="stat-value text-lg">
                    {salesData?.summary?.totalTransactions || 0}
                  </div>
                </div>
                <div className="stat bg-accent text-accent-content rounded-xl shadow-md">
                  <div className="stat-figure">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Rata-rata per Transaksi</div>
                  <div className="stat-value text-lg">
                    {salesData?.summary?.totalSales
                      ? Intl.NumberFormat("id-ID", {
                          currency: "IDR",
                          style: "currency",
                          minimumFractionDigits: 0,
                        }).format(
                          salesData?.summary?.totalSales /
                            salesData?.summary?.totalTransactions
                        )
                      : 0}
                  </div>
                </div>

                <div className="stat bg-info text-info-content rounded-xl shadow-md">
                  <div className="stat-figure">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Item Terjual</div>
                  <div className="stat-value text-lg">
                    {salesData?.summary?.totalItems || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ============= STATISTICS SECTION ============= */}
        </div>
      </div>

      {/* ============= CHARTS SECTION ============= */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Settlement grouping berdasar kan payment method */}
        <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300 col-span-2 justify-between ">
          <div className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary flex-end" />
            Penjualan berdasarkan metode pembayaran{" "}
            <div className="badge badge-warning text-xs gap-2">
              <MailWarning className="w-4 h-4" />
              Klik 2x untuk melihat detail
            </div>
            <div className="badge badge-secondary text-xs gap-2">
              <MailWarning className="w-4 h-4" />
              Filter applied
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-compact">
              {/* head */}
              <thead>
                <tr className="text-center">
                  <th>Rank</th>
                  <th>Metode Pembayaran</th>
                  <th>Total Penjualan</th>
                  <th>Jumlah Invoice</th>
                  <th>Total Harga</th>
                  <th>Total Item Terjual</th>
                  <th>Persentase</th>
                </tr>
              </thead>
              <tbody className="text-center cursor-pointer">
                {paymentMethodRanking?.data?.paymentMethodRank?.map(
                  (paymentMethod, index) => (
                    <tr
                      key={paymentMethod._id}
                      className="text-center hover:bg-base-200"
                      onClick={() => {
                        console.log(paymentMethod._id);
                        setPaymentMethodToGetDetailInvoices(paymentMethod._id);
                        document
                          .getElementById("ModalDetailInvoicesByPaymentMethod")
                          .showModal();
                      }}
                    >
                      <td>{index + 1}</td>
                      <td>{paymentMethod._id}</td>
                      <td>
                        {Intl.NumberFormat("id-ID", {
                          currency: "IDR",
                          style: "currency",
                          minimumFractionDigits: 0,
                        }).format(paymentMethod.totalSales)}
                      </td>
                      <td>{paymentMethod.jumlahInvoice}</td>
                      <td>
                        {Intl.NumberFormat("id-ID", {
                          currency: "IDR",
                          style: "currency",
                          minimumFractionDigits: 0,
                        }).format(paymentMethod.totalSales)}
                      </td>
                      <td>{paymentMethod.totalItems}</td>
                      <td>{paymentMethod.percentage?.toFixed(2)}%</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          <div className="justify-end flex w-full mt-4">
            <button
              className="btn"
              onClick={handleDownloadRangkingPaymentMethodDetail}
            >
              <Download className="w-4 h-4 " />
              Download Detail Sebagai CSV
            </button>
          </div>
        </div>

        {/* Distribusi Pie Chart payment Method */}
        <div className=" bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300 flex-col h-full w-full mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold  flex items-center gap-2">
              Distribusi Penjualan berdasarkan metode pembayaran
            </h2>
          </div>

          {paymentMethodRanking?.data?.paymentMethodRank?.length > 0 ? (
            <div className="flex justify-center items-center h-full">
              <Pie
                data={{
                  labels: paymentMethodRanking.data.paymentMethodRank.map(
                    (paymentMethod) => paymentMethod._id
                  ),
                  datasets: [
                    {
                      label: "Total Penjualan",
                      data: paymentMethodRanking.data.paymentMethodRank.map(
                        (paymentMethod) => paymentMethod.totalSales
                      ),
                      backgroundColor: [
                        "rgba(255, 99, 132, 0.5)",
                        "rgba(54, 162, 235, 0.5)",
                        "rgba(255, 206, 86, 0.5)",
                        "rgba(75, 192, 192, 0.5)",
                        "rgba(153, 102, 255, 0.5)",
                      ],
                      borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)",
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || "";
                          const value = context.raw || 0;
                          const percentage = context.dataset.data.reduce(
                            (acc, curr) => acc + curr,
                            0
                          );
                          const percentageValue =
                            ((value / percentage) * 100).toFixed(2) + "%";
                          return `${label}: ${Intl.NumberFormat("id-ID", {
                            currency: "IDR",
                            style: "currency",
                            minimumFractionDigits: 0,
                          }).format(value)} (${percentageValue})`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              Tidak ada data SPG
            </div>
          )}
        </div>
      </div>

      <div className=" grid-cols-2 grid gap-6">
        {/* Grafik Penjualan grouping pakai filter */}
        <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
          <div className="flex justify-end gap-x-2">
            <div className="badge badge-warning text-xs gap-2">
              <MailWarning className="w-4 h-4" />
              Click to see detail
            </div>
            <div className="badge badge-secondary text-xs gap-2">
              <MailWarning className="w-4 h-4" />
              Filter applied
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Penjualan grouping outlet{" "}
            {countMethod == "settlement"
              ? (selectedOutletObj?.periodeSettlement || 1) +
                " hari (waktu settlement outlet terkait)"
              : countMethod == "perhari"
              ? "Harian"
              : countMethod == "perminggu"
              ? "Mingguan"
              : countMethod == "perbulan"
              ? "Bulanan"
              : "Tahunan"}
          </h2>

          {salesChartData && (
            <Bar
              data={salesChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
              }}
            />
          )}
        </div>
        <div className=" lg:grid-cols-2 gap-6 h-full">
          <div className="bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300 flex gap-2 flex-col h-full">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 ">
              <TrendingUp className="w-5 h-5 text-primary" />
              Volume Transaksi Kasir, SPG, Inventories dan Purchase Order
            </h2>
            <div className="badge badge-warning gap-2">
              <MailWarning className="w-4 h-4" />
              Coming soon
            </div>
          </div>
        </div>
      </div>

      {/* ============= Distribusi SECTION ============= */}
      {/* Distribusi kasir */}
      <div className="max-h-screen flex gap-6 mb-6 ">
        <div className="lg:w-4/5 bg-base-100 rounded-2xl shadow-lg border border-base-300">
          <h2 className="text-xl p-3 font-semibold mb-6 flex items-center gap-2">
            <User2 className="w-5 h-5 text-primary" />
            Distribusi Kasir Dalam Tabel
          </h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="text-center">
                  <th>Rank</th>
                  <th>Nama Kasir</th>
                  <th>Role</th>
                  <th>Kode Kasir</th>
                  <th>Total Penjualan</th>
                  <th>Jumlah Invoice</th>
                  <th>
                    Total Harga Penjualan
                    <div
                      className="tooltip tooltip-bottom z-[9999]"
                      data-tip="Total penjualan kumulatif sepanjang waktu (tidak terpengaruh filter periode)"
                    >
                      ❓
                    </div>
                  </th>
                  <th>Total Quantity Penjualan</th>
                  <th>Persentase</th>
                </tr>
              </thead>
              <tbody>
                {rankingData?.data?.kasirRank?.map((kasir, index) => (
                  <tr key={kasir._id} className="text-center hover:bg-base-200">
                    <td>{index + 1}</td>
                    <td>{kasir.kasir.username}</td>
                    <td>{kasir.kasir.roleName}</td>
                    <td>{kasir.kasir.kodeKasir}</td>
                    <td>
                      {Intl.NumberFormat("id-ID", {
                        currency: "IDR",
                        style: "currency",
                        minimumFractionDigits: 0,
                      }).format(kasir.totalSales)}
                    </td>
                    <td>{kasir.jumlahInvoice}</td>
                    <td>
                      {Intl.NumberFormat("id-ID", {
                        currency: "IDR",
                        style: "currency",
                        minimumFractionDigits: 0,
                      }).format(kasir.kasir.totalHargaPenjualan)}
                    </td>
                    <td>{kasir.kasir.totalQuantityPenjualan}</td>
                    <td>{kasir.percentage?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart untuk Kasir */}
        <div className="lg:w-1/4 bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <User2 className="w-5 h-5 text-primary" />
            Distribusi Kasir Dalam Grafik
          </h2>
          {rankingData?.data?.kasirRank?.length > 0 ? (
            <div className="flex justify-center items-center h-full">
              <Pie
                data={{
                  labels: rankingData.data.kasirRank.map(
                    (kasir) => kasir.kasir.username
                  ),
                  datasets: [
                    {
                      label: "Total Penjualan",
                      data: rankingData.data.kasirRank.map(
                        (kasir) => kasir.totalSales
                      ),
                      backgroundColor: [
                        "rgba(255, 99, 132, 0.5)",
                        "rgba(54, 162, 235, 0.5)",
                        "rgba(255, 206, 86, 0.5)",
                        "rgba(75, 192, 192, 0.5)",
                        "rgba(153, 102, 255, 0.5)",
                      ],
                      borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)",
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || "";
                          const value = context.raw || 0;
                          const percentage = context.dataset.data.reduce(
                            (acc, curr) => acc + curr,
                            0
                          );
                          const percentageValue =
                            ((value / percentage) * 100).toFixed(2) + "%";
                          return `${label}: ${Intl.NumberFormat("id-ID", {
                            currency: "IDR",
                            style: "currency",
                            minimumFractionDigits: 0,
                          }).format(value)} (${percentageValue})`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              Tidak ada data kasir
            </div>
          )}
        </div>
      </div>

      {/* Distribusi SPG */}
      <div className="max-h-screen flex gap-6 mb-6">
        <div className="lg:w-4/5 bg-base-100 rounded-2xl shadow-lg border border-base-300">
          <h2 className="text-xl p-3 font-semibold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Distribusi SPG Dalam Tabel
          </h2>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="text-center">
                  <th>Rank</th>
                  <th>Nama SPG</th>
                  <th>Total Penjualan (Invoice)</th>
                  <th>Jumlah Invoice</th>
                  <th>
                    Total Harga Penjualan
                    <div
                      className="tooltip tooltip-bottom z-[9999]"
                      data-tip="Total penjualan kumulatif sepanjang waktu (tidak terpengaruh filter periode)"
                    >
                      ❓
                    </div>
                  </th>
                  <th>Total Quantity Penjualan</th>
                  <th>Persentase</th>
                </tr>
              </thead>
              <tbody>
                {rankingData?.data?.spgRank?.map((spg, index) => (
                  <tr key={spg._id} className="text-center hover:bg-base-200">
                    <td>{index + 1}</td>
                    <td>{spg.spg.name}</td>
                    <td>
                      {Intl.NumberFormat("id-ID", {
                        currency: "IDR",
                        style: "currency",
                        minimumFractionDigits: 0,
                      }).format(spg.totalSales)}
                    </td>
                    <td>{spg.jumlahInvoice}</td>
                    <td>
                      {Intl.NumberFormat("id-ID", {
                        currency: "IDR",
                        style: "currency",
                        minimumFractionDigits: 0,
                      }).format(spg.spg.totalHargaPenjualan)}
                    </td>
                    <td>{spg.spg.totalQuantityPenjualan}</td>
                    <td>{spg.percentage?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart untuk SPG */}
        <div className="lg:w-1/4 bg-base-100 p-6 rounded-2xl shadow-lg border border-base-300">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Distribusi SPG Dalam Grafik
          </h2>
          {rankingData?.data?.spgRank?.length > 0 ? (
            <div className="flex justify-center items-center h-full">
              <Pie
                data={{
                  labels: rankingData.data.spgRank.map((spg) => spg.spg.name),
                  datasets: [
                    {
                      label: "Total Penjualan",
                      data: rankingData.data.spgRank.map(
                        (spg) => spg.totalSales
                      ),
                      backgroundColor: [
                        "rgba(255, 99, 132, 0.5)",
                        "rgba(54, 162, 235, 0.5)",
                        "rgba(255, 206, 86, 0.5)",
                        "rgba(75, 192, 192, 0.5)",
                        "rgba(153, 102, 255, 0.5)",
                      ],
                      borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)",
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || "";
                          const value = context.raw || 0;
                          const percentage = context.dataset.data.reduce(
                            (acc, curr) => acc + curr,
                            0
                          );
                          const percentageValue =
                            ((value / percentage) * 100).toFixed(2) + "%";
                          return `${label}: ${Intl.NumberFormat("id-ID", {
                            currency: "IDR",
                            style: "currency",
                            minimumFractionDigits: 0,
                          }).format(value)} (${percentageValue})`;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              Tidak ada data SPG
            </div>
          )}
        </div>
      </div>

      {paymentMethodToGetDetailInvoices && (
        <ModalDetailInvoicesByPaymentMethod
          paymentMethodToGetDetailInvoices={paymentMethodToGetDetailInvoices}
          onClose={() => {
            setPaymentMethodToGetDetailInvoices(null);
            document
              .getElementById("ModalDetailInvoicesByPaymentMethod")
              .close();
          }}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          transactionStatus={transactionStatus}
          key={"ModalDetailInvoicesByPaymentMethod"}
          outlet={selectedOutlet} //kode outlet sj
        />
      )}
    </div>
  );
};

export default SalesReport;
