import { getUserById } from "@/api/authApi";
import { useQuery } from "@tanstack/react-query";

export default function ModalDetailInvoice({ showDetail }) {
  //tanstack
  const { data: getConfirmBy } = useQuery({
    queryKey: ["getConfirmBy", showDetail?.confirmVoidById],
    queryFn: () => getUserById(showDetail?.confirmVoidById),
    enabled: !!showDetail?.confirmVoidById,
  });

  return (
    <dialog id="modalDetailInvoice" className="modal">
      <div className="modal-box w-11/12 max-w-5xl bg-white rounded-lg shadow-xl">
        <h3 className="font-semibold text-xl text-blue-700 mb-4 border-b pb-2">
          Detail Invoice:{" "}
          <span className="font-bold">{showDetail?.invoiceNumber}</span>
        </h3>

        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between mb-2 text-sm text-gray-700">
              <span className="font-semibold">Dibuat Pada:</span>
              <span>{new Date(showDetail?.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm text-gray-700">
              <span className="font-semibold">Pelanggan:</span>
              <span>{showDetail?.customer || "-"}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm text-gray-700">
              <span className="font-semibold">Kasir:</span>
              <span>{showDetail?.salesPerson || "-"}</span>
            </div>{" "}
            {showDetail?.paymentMethod && (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Metode Pembayaran:</span>
                <span>{showDetail?.paymentMethod}</span>
              </div>
            )}
            {showDetail?.nomorTransaksi && (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Nomor Transaksi:</span>
                <span>{showDetail?.nomorTransaksi}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-700 items-center">
              <span className="font-semibold">Status:</span>
              <span
                className={`badge rounded-full px-3 py-1 font-medium text-xs ${
                  showDetail?.done && showDetail?.isVoid
                    ? "bg-red-500 text-white"
                    : showDetail?.requestingVoid
                    ? "bg-yellow-500 text-white"
                    : showDetail?.done
                    ? "bg-green-500 text-white"
                    : "bg-gray-400 text-white"
                }`}
              >
                {showDetail?.done && showDetail?.isVoid
                  ? "Dibatalkan"
                  : showDetail?.requestingVoid
                  ? "Request Void"
                  : showDetail?.done
                  ? "Lunas"
                  : "Belum Bayar"}
              </span>
            </div>
            {showDetail?.isVoid && (
              <div className="flex justify-between text-sm text-gray-700">
                <span className="font-semibold">Dikonfirmasi Void oleh:</span>
                <span>{getConfirmBy?.data?.username || "-"}</span>
              </div>
            )}
          </div>

          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between mb-2 text-sm text-gray-700">
              <span className="font-semibold">Subtotal:</span>
              <span>Rp {showDetail?.subTotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm text-gray-700">
              <span className="font-semibold">Total:</span>
              <span className="text-blue-700 font-bold">
                Rp {showDetail?.total?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 items-center">
              <span className="font-semibold">Dicetak:</span>
              <div className="flex gap-2">
                <span
                  className={`badge badge-sm ${
                    showDetail?.isPrintedCustomerBilling
                      ? "badge-success"
                      : "badge-warning"
                  }`}
                >
                  Bill Pelanggan:{" "}
                  {showDetail?.isPrintedCustomerBilling ? "Sudah" : "Belum"}
                </span>
                <span
                  className={`badge badge-sm ${
                    showDetail?.isPrintedKwitansi
                      ? "badge-success"
                      : "badge-warning"
                  }`}
                >
                  Kwitansi: {showDetail?.isPrintedKwitansi ? "Sudah" : "Belum"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-3 text-gray-800">
            Item Pembelian
          </h4>
          <div className="overflow-x-auto">
            <table className="table table-zebra text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase">
                  <th className="text-left">No</th>
                  <th className="text-left">SKU</th>
                  <th className="text-left">Deskripsi</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {showDetail?.currentBill?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="text-left">{index + 1}</td>
                    <td className="text-left">{item.sku}</td>
                    <td className="text-left">{item.description}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">
                      Rp {item.RpHargaDasar?.toLocaleString()}
                    </td>
                    <td className="text-right">
                      Rp {item.totalRp?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Promo and Discount Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Promo Section */}
          {showDetail?.promo?.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-semibold mb-3 text-gray-800">
                Promo Terpakai
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                {showDetail?.promo?.map((promo, index) => (
                  <div
                    key={`promo-${index}`}
                    className="flex justify-between items-center"
                  >
                    <span>{promo?.promoInfo?.judulPromo || "-"}</span>
                    <span className="badge badge-info badge-sm">
                      Bonus: {promo?.promoInfo?.quantityBonus}
                    </span>
                  </div>
                ))}
                {showDetail?.promo?.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Tidak ada promo yang diterapkan.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discount Section */}
          {showDetail?.diskon?.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-semibold mb-3 text-gray-800">
                Diskon Terpakai
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                {showDetail?.diskon?.map((diskon, index) => (
                  <div
                    key={`diskon-${index}`}
                    className="flex justify-between items-center"
                  >
                    <span>{diskon?.diskonInfo?.judulDiskon || "-"}</span>
                    <span className="badge badge-warning badge-sm">
                      {diskon?.diskonInfo?.RpPotonganHarga
                        ? `Rp ${diskon?.diskonInfo?.RpPotonganHarga?.toLocaleString()}`
                        : `${diskon?.diskonInfo?.percentPotonganHarga}%`}
                    </span>
                  </div>
                ))}
                {showDetail?.diskon?.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Tidak ada diskon yang diterapkan.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voucher Section */}
          {showDetail?.implementedVoucher?.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-semibold mb-3 text-gray-800">
                Voucher Terpakai
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                {showDetail?.implementedVoucher?.map((voucher, index) => (
                  <div
                    key={`voucher-${index}`}
                    className="flex justify-between items-center"
                  >
                    <span>{voucher?.judulVoucher || "-"}</span>
                    <span className="badge badge-success badge-sm">
                      Rp {voucher.potongan?.toLocaleString("ID-id")}
                    </span>
                  </div>
                ))}
                {showDetail?.futureVoucher?.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Tidak ada voucher yang diterapkan.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200">
          <h4 className="text-lg font-semibold mb-3 text-gray-800">
            Ringkasan Pembayaran
          </h4>
          <div className="flex justify-between mb-2 text-sm text-gray-700">
            <span>Subtotal:</span>
            <span>Rp {showDetail?.subTotal?.toLocaleString()}</span>
          </div>
          <div className="divider my-2 border-gray-200"></div>
          <div className="flex justify-between text-lg font-bold text-blue-700">
            <span>Total:</span>
            <span>Rp {showDetail?.total?.toLocaleString()}</span>
          </div>
        </div>

        <div className="modal-action flex justify-end">
          <form method="dialog">
            <button className="btn btn-sm">Tutup</button>
          </form>
        </div>
      </div>

      {/* Click outside to close */}
      <form method="dialog" className="modal-backdrop">
        <button>tutup</button>
      </form>
    </dialog>
  );
}
