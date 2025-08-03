import { getInvoicesByPaymentMethod } from "@/api/invoiceApi";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import React, { Fragment, useState } from "react";
import { MailWarning } from "lucide-react";
import { formatDate } from "@/pages/Invoices";
import { getAllAccount } from "@/api/authApi";
import { getAllSpg } from "@/api/spgApi";
import ModalDetailInvoice from "./ModalDetailInvoice";

export default function ModalDetailInvoicesByPaymentMethod({
  onClose,
  paymentMethodToGetDetailInvoices,
  startDate,
  endDate,
  transactionStatus,
  outlet,
}) {
  const {
    data: invoiceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "invoicesByPaymentMethod",
      paymentMethodToGetDetailInvoices,
      startDate,
      endDate,
      transactionStatus,
      outlet,
    ],
    queryFn: () =>
      getInvoicesByPaymentMethod({
        paymentMethod: paymentMethodToGetDetailInvoices,
        startDate,
        endDate,
        transactionStatus,
        outlet,
      }),
    enabled: !!paymentMethodToGetDetailInvoices,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [showDetail, setShowDetail] = useState(null);
  const [invoice, setInvoice] = useState(null);

  const toggleExpandRow = (invoiceId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  // Fetch data Kasir/Accounts
  const { data: accountsData } = useQuery({
    queryKey: ["user"],
    queryFn: getAllAccount,
  });

  // Fetch data SPG
  const { data: spgData } = useQuery({
    queryKey: ["spg"],
    queryFn: getAllSpg,
  });

  // Mendapatkan nama Kasir dari salesPerson
  const getKasirName = (salesPerson) => {
    if (!accountsData?.data) return salesPerson || "-";
    const account = accountsData.data.find(
      (item) => item.email === salesPerson || item.name === salesPerson
    );
    return account ? account.name : salesPerson || "-";
  };

  // Mendapatkan nama SPG dari ID
  const getSpgNameById = (spgId) => {
    if (!spgData?.data) return spgId;
    const spgItem = spgData?.data?.find((item) => item._id == spgId);
    return spgItem ? spgItem?.name : "spg telah dihapus" || "spg tidak ada?";
  };

  return (
    <dialog id="ModalDetailInvoicesByPaymentMethod" className="modal ">
      <Toaster />
      <div className="modal-box lg:max-w-[80vw] md:max-w-[90vw] max-md:w-full">
        <div className="space-y-4">
          {/* Header section */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">
              Detil Invoice dengan Metode Pembayaran{" "}
              {paymentMethodToGetDetailInvoices}
            </h3>

            <div className="badge badge-warning text-xs gap-2">
              <MailWarning className="w-4 h-4" />
              Click to see detail
            </div>
          </div>

          {/* Button section */}
          <button
            className="btn w-full rounded-md bg-blue-400 hover:bg-blue-500 text-white transition-colors"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
        {isLoading && (
          <div className="text-center py-4">
            <span className="loading loading-bars loading-lg"></span>
            <p>Memuat data...</p>
          </div>
        )}
        {error && (
          <div className="alert alert-error shadow-lg mb-4">
            <div>
              <span>Error: {error.message}</span>
            </div>
          </div>
        )}
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
          ) : error ? (
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
                    <th className="text-left">Kode Invoice</th>
                    <th className="text-left">Tanggal</th>
                    <th className="text-left">Kasir</th>
                    <th className="text-left">SPG</th>
                    <th className="text-left">Harga Asli</th>
                    <th className="text-left">Total</th>
                    <th className="text-center">Billing</th>
                    <th className="text-center">Bayar</th>
                    <th className="text-center">Kwitansi</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Aksi</th>
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
                                                    <td className="font-medium text-sm">
                                                      {
                                                        item.promoInfo
                                                          ?.judulPromo
                                                      }
                                                    </td>
                                                    <td className="text-sm">
                                                      {item.promoInfo
                                                        ?.skuBarangBonus || "-"}
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
      <ModalDetailInvoice
        showDetail={showDetail}
        onClose={() => setShowDetail(null)}
        invoice={invoice}
      />
    </dialog>
  );
}
