import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPurchaseOrder,
  getPurchaseOrderList,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../api/purchaseOrderApi";
import { toast } from "react-hot-toast";
import { getAllinventories } from "../api/itemLibraryApi";
import PickSingleInventoriesDialog from "../components/singleInventoriesList";
import { useFilter } from "../store";
import ModalOptions from "../components/ModalOptions";
import { useNavigate } from "react-router";
import ModalDetailPurchaseOrder from "@/components/ModalDetailPurchaseOrder";
import { Download, DownloadIcon, PlusCircle, Upload } from "lucide-react";

export default function PurchaseOrdersCreate() {
  const [file, setFile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const navigate = useNavigate();

  //temporary
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tempSeelectedOrder, setTempSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState(null);
  const [tempSkuTerpilih, setTempSkuTerplih] = useState();
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  //tanstack
  const queryClient = useQueryClient();

  //zustand
  const { filter, setFilter } = useFilter();

  const { data: inventoriyList } = useQuery({
    queryKey: ["inventories", filter],
    queryFn: (filter) => getAllinventories(filter),
  });

  const { mutateAsync: handleUpdatePurchaseOrder } = useMutation({
    mutationFn: (order) => updatePurchaseOrder(order),
    onSuccess: (response) => {
      queryClient.invalidateQueries(["purchaseOrder"]);
      toast.success(response.message);
      setIsOpen(false);
      setNewOrder();
      setSelectedOrder();
    },
    onError: (error) => {
      console.log(error);
      toast.error(error?.response?.data?.message);
    },
  });

  const { mutateAsync: handleCreatePurchaseOrder } = useMutation({
    mutationFn: (body) => createPurchaseOrder(body),
    onSuccess: (response) => {
      toast.success(response?.message);
      queryClient.invalidateQueries(["purchaseOrder"]);
      setIsOpen(false);
      setNewOrder();
      setSelectedOrder();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
      toast.error(error?.response?.data?.missingSkus.join(", "));
    },
  });

  const { mutateAsync: handleDeletePurchaseOrder } = useMutation({
    mutationFn: async (orderId) => {
      const response = await deletePurchaseOrder(orderId);
      return response?.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(["purchaseOrder"]);
      toast.success("berhasil menghapus PO");
      setSelectedOrder(null);
      setNewOrder(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error?.response?.data?.message || "Gagal menghapus PO");
    },
  });

  const { data: purchaseOrderList } = useQuery({
    queryKey: ["purchaseOrder", dateRange],
    queryFn: () =>
      getPurchaseOrderList({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleImportPurchaseOrder = () => {
    setFile(null);
    setIsOpen(true);
  };

  const handleSubmitImportPO = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split("\n");

      // Skip header row
      const dataRows = rows.slice(1);

      const purchaseOrders = [];
      let currentPO = null;

      dataRows.forEach((row) => {
        if (!row.trim()) return; // Skip empty rows

        const columns = row.split(",").map((col) => col.trim());
        const [erp, plat, sku, request, barcode, keterangan] = columns;

        // Jika ada Erp, ini adalah PO baru
        if (erp) {
          if (currentPO) {
            purchaseOrders.push(currentPO);
          }
          currentPO = {
            Erp: erp,
            plat: plat || "",
            items: [],
          };
        }

        // Jika ada SKU, tambahkan sebagai item
        if (sku) {
          currentPO.items.push({
            sku: sku,
            request: parseInt(request) || 0,
            barcodeItem: barcode || "",
            keterangan: keterangan || "",
            received: 0,
          });
        }
      });

      // Jangan lupa untuk push PO terakhir
      if (currentPO) {
        purchaseOrders.push(currentPO);
      }

      try {
        for (const order of purchaseOrders) {
          await handleCreatePurchaseOrder(order);
        }
        setIsOpen(false);
        setFile(null);
        toast.success(
          `Successfully created ${purchaseOrders.length} purchase orders`
        );
      } catch (error) {
        console.error("Error creating purchase orders:", error);
        toast.error(
          error?.response?.data?.message || "Failed to create purchase orders"
        );
      }
    };
    reader.readAsText(file);
  };

  const statusPercentage = (order) => {
    // Pastikan order dan items ada
    if (
      !order ||
      !order.items ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return 0; // Kembalikan 0% jika tidak ada item
    }

    // Hitung total request dan total received
    const totalRequest = order.items.reduce(
      (sum, item) => sum + (item.request || 0),
      0
    );
    const totalReceived = order.items.reduce(
      (sum, item) => sum + (item.received || 0),
      0
    );

    // Jika totalRequest adalah 0, kembalikan 0% untuk menghindari pembagian dengan 0
    if (totalRequest === 0) {
      return 0;
    }

    // Hitung persentase
    const percentage = (totalReceived / totalRequest) * 100;

    // Bulatkan ke 2 desimal dan pastikan tidak melebihi 100%
    return Math.min(Math.round(percentage * 100) / 100, 100);
  };

  const handleExportPurchaseOrder = () => {
    // Template headers dengan format baru
    const headers = [
      "Purchase Code (Erp)",
      "Plat",
      "SKU",
      "Request",
      "Barcode",
      "Keterangan",
    ];

    // Contoh template dengan 2 baris untuk memperlihatkan format
    const templateRows = [
      ["PO-001", "B1234CD", "14FSK", "5", "BARC123", "keterangan"],
      ["", "", "12DARTW", "2", "BARC789", "adawd"], // Baris kedua untuk item yang sama
      ["PO-002", "B5678EF", "12DSETWI", "5", "BARC123", "keqw3rwq"], // PO baru
    ];

    const rows = [headers, ...templateRows];
    const csvContent = rows.map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    link.download = "purchase_order_template.csv";
    link.click();
  };

  const handleKonfirmasiSkuPurchaseCode = () => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...(selectedOrder?.items || newOrder?.items)];

      // Simpan nilai barcode yang sudah ada sebelumnya
      const existingBarcodeItem = updatedItems[selectedItemIndex].barcodeItem;

      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        sku: tempSkuTerpilih,
        // Pertahankan nilai barcode yang sudah ada, jangan otomatis ambil dari inventori
        barcodeItem: existingBarcodeItem || "",
      };

      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          items: updatedItems,
        });
      } else {
        setNewOrder({
          ...newOrder,
          items: updatedItems,
        });
      }
    }
    setTempSkuTerplih(null);
    setShowSkuModal(false);
    setSelectedItemIndex(null);
    document.getElementById("picksingleinventoriesdialog").close();
  };

  const handleClickRow = (order) => {
    setSelectedOrder(null);
    const statusAllCompleted = order.items.every((item) => {
      // Pastikan mengembalikan nilai boolean di semua kondisi
      return item.received >= item.request;
    });

    // Set order yang dipilih
    setTempSelectedOrder(order);
    setSelectedOrder(order);

    if (statusAllCompleted) {
      document.getElementById("modalDetailPurchaseOrder").showModal();
    } else {
      document.getElementById("clickrow").showModal();
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder?._id) {
      toast.error("No purchase order selected");
      return;
    }

    if (
      selectedOrder.status === "terpenuhi" ||
      selectedOrder.status === "dibatalkan"
    ) {
      toast.error("Cannot delete completed or cancelled orders");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase order? This action cannot be undone."
    );

    if (confirmed) {
      try {
        await handleDeletePurchaseOrder(selectedOrder._id);
      } catch (error) {
        console.error("Error deleting purchase order:", error);
      }
    }
  };

  function downloadPurchaseOrderCsv() {
    if (!purchaseOrderList?.data?.length) {
      return toast("tidak ada yang bisa didownload");
    }
    const rows = [];

    // Header CSV
    rows.push([
      "Erp",
      "Plat",
      "Dibuat Oleh",
      "Dipenuhi Oleh",
      "SKU",
      "Request",
      "Received",
      "Keterangan",
      "Tanggal Terpenuhi",
      "Time",
    ]);

    // Isi data dari setiap PO dan item-nya
    purchaseOrderList?.data.forEach((po) => {
      po.items.forEach((item) => {
        rows.push([
          po.Erp,
          po.plat,
          po.dibuatOleh,
          po.dipenuhiOleh,
          item.sku,
          item.request,
          item.received,
          item.keterangan,
          new Date(item.tanggalTerpenuhi).toLocaleString("id-ID"), // Format tanggal
        ]);
      });
    });

    // Konversi ke CSV string
    const csvContent = rows.map((e) => e.join(",")).join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "purchase_order.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-white p-3">
      {/* Top Buttons */}
      <div className="flex mb-4 justify-between items-center space-x-2">
        <div className="self-start flex justify-start"></div>

        <div className="flex flex-wrap justify-end items-center gap-3 md:gap-x-4 mb-6">
          <button className="btn btn-info btn-outline px-6 py-2 rounded-md font-semibold text-sm">
            Total Data:{" "}
            <span className="font-bold ml-1">
              {purchaseOrderList?.data?.length || 0}
            </span>
          </button>
          <button
            onClick={downloadPurchaseOrderCsv}
            className="btn btn-primary rounded-md "
          >
            Download Semua: <DownloadIcon />
          </button>
          <button
            className="btn bg-blue-500 px-6 py-2 rounded-md font-semibold text-sm transition-colors duration-200"
            onClick={() => {
              setSelectedOrder(null); // Set ke null daripada undefined untuk konsistensi
              setNewOrder({
                Erp: "",
                plat: "",
              });
            }}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Buat PO Baru</span>
          </button>
          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="btn btn-neutral px-6 py-2 rounded-md m-1 font-semibold text-sm"
            >
              <Download className="w-5 h-5" />
              <span>Import/Export</span>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-3 shadow-lg bg-base-100 rounded-box w-52 gap-y-2 border border-gray-200" // Padding dan border lebih baik
            >
              <li>
                <button
                  className="btn btn-outline btn-success w-full"
                  onClick={handleImportPurchaseOrder}
                >
                  <Upload className="w-5 h-5" />
                  <span>Import</span>
                </button>
              </li>
              <li>
                <button
                  className="btn btn-outline btn-info w-full" // Warna info untuk export
                  onClick={() => {
                    const confirmed = window.confirm(
                      "Anda akan meng-export template. Pastikan Anda membaca instruksi: " +
                        "Ganti 'Purchase Code (Erp)' untuk membuat PO baru yang unik. " +
                        "Jika 'Purchase Code (Erp)' sama dengan yang sudah ada, akan terjadi error. " +
                        "Konsep template: Pengisian item ke samping; setiap baris baru adalah Purchase Order yang berbeda."
                    );
                    if (confirmed) {
                      handleExportPurchaseOrder();
                    }
                  }}
                >
                  <Download className="w-5 h-5" />
                  <span>Export Template</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 min-h-screen">
        {/* Table Layout */}
        <div
          className={`transition-all ${
            selectedOrder ? "lg:w-2/3" : "w-full"
          } bg-white shadow rounded p-4`}
        >
          <div className="flex justify-between mb-4">
            <div className="flex flex-col gap-y-2">
              <div className="badge badge-accent">
                <span
                  className="text-xs text-black cursor-pointer"
                  onClick={() => {
                    navigate("/artikel_documentation");
                  }}
                >
                  (Anda bisa kunjungi artikel documentation untuk melihat
                  melihat tutorial import/export)
                </span>
              </div>
            </div>
          </div>

          <table className="table w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                {" "}
                {/* Gradasi biru langit ke biru laut */}
                <th className="p-4 text-left font-semibold text-base">
                  Purchase Code (Erp)
                </th>
                <th className="p-4 text-left font-semibold text-base">Plat</th>
                <th className="p-4 text-left font-semibold text-base">
                  Jumlah Item
                </th>
                <th className="p-4 text-center font-semibold text-base">
                  Status
                </th>{" "}
                {/* Text-center untuk kolom status */}
              </tr>
            </thead>
            <tbody>
              {purchaseOrderList?.data?.length > 0 ? (
                purchaseOrderList.data.map((order, index) => (
                  <tr
                    key={order._id || index} // Sangat disarankan menggunakan ID unik dari data (order._id)
                    className={`
              ${
                index % 2 === 0 ? "bg-white" : "bg-blue-50"
              } {/* Zebra stripe */}
              hover:bg-blue-100 transition-colors duration-200
              cursor-pointer
            `}
                    onClick={() => handleClickRow(order)}
                  >
                    <td className="p-4 text-sm text-gray-800 font-medium">
                      {order.Erp}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {order.plat || "-"}
                    </td>
                    <td className="p-4 text-sm text-gray-700 text-center">
                      {order.items?.length || 0}
                    </td>
                    <td className="p-4 text-center">
                      <div className="w-full bg-blue-100 rounded-full h-3 relative overflow-hidden">
                        {" "}
                        {/* Background progress bar */}
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${statusPercentage(order)}%`,
                          }}
                        ></div>
                        <p className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                          {" "}
                          {/* Teks persentase di tengah */}
                          {statusPercentage(order)}%
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    Tidak ada data Purchase Order ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Form Layout */}
        {(selectedOrder || newOrder) && (
          <div className="lg:w-1/3 shadow rounded p-4 bg-white">
            <h2 className="font-light text-lg mb-2">
              {selectedOrder ? "Edit Purchase Order" : "Buat Purchase Order"}
            </h2>
            <div className="flex p-3 w-full">
              <div className="flex flex-col gap-2 justify-center w-full md:flex-row md:gap-4 md:justify-between">
                <button
                  type="button"
                  className="flex flex-col items-center px-4 py-2 border rounded text-red-600 hover:text-red-900 hover:border-red-900 focus:outline-none transition-colors"
                  onClick={handleDelete}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mb-2"
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
                  Hapus
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center px-4 py-2 border rounded text-gray-600 hover:text-gray-900 hover:border-gray-900 focus:outline-none transition-colors"
                  onClick={() => {
                    setSelectedOrder(null);
                    setNewOrder(null);
                    setIsOpen(false);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mb-2"
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
                  Batal
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center px-4 py-2 border rounded text-green-600 hover:text-green-900 hover:border-green-900 focus:outline-none transition-colors flex-1"
                  onClick={() => {
                    selectedOrder
                      ? handleUpdatePurchaseOrder(selectedOrder)
                      : handleCreatePurchaseOrder(newOrder);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {selectedOrder ? "Konfirmasi" : "Buat Baru"}
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Purchase Code (Erp)
                </label>
                <input
                  type="text"
                  value={selectedOrder?.Erp || newOrder?.Erp || ""}
                  className="w-full border rounded px-2 py-1"
                  onChange={(e) =>
                    selectedOrder
                      ? setSelectedOrder({
                          ...selectedOrder,
                          Erp: e.target.value,
                        })
                      : setNewOrder({ ...newOrder, Erp: e.target.value })
                  }
                  placeholder="Masukkan kode ERP"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Plat(opsional)
                </label>
                <input
                  type="text"
                  value={selectedOrder?.plat || newOrder?.plat || ""}
                  className="w-full border rounded px-2 py-1"
                  onChange={(e) =>
                    selectedOrder
                      ? setSelectedOrder({
                          ...selectedOrder,
                          plat: e.target.value,
                        })
                      : setNewOrder({ ...newOrder, plat: e.target.value })
                  }
                  placeholder="Masukkan nomor plat (opsional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Items</label>
                {(selectedOrder?.items || newOrder?.items || []).map(
                  (item, index) => (
                    <div
                      key={index}
                      className="border p-2 mb-2 rounded space-y-2"
                    >
                      <div
                        onClick={() => {
                          setSelectedItemIndex(index);
                          setTempSkuTerplih(item?.sku);
                          document
                            .getElementById("picksingleinventoriesdialog")
                            .showModal();
                        }}
                      >
                        <label className="block text-sm">Sku</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.sku ?? ""}
                            className="w-full border rounded px-2 py-1"
                            readOnly
                            placeholder="Klik untuk memilih SKU"
                          />
                          <button type="button" className="btn btn-sm">
                            Pilih
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm">Request</label>
                        <input
                          type="text"
                          value={item.request ?? ""}
                          className="w-full border rounded px-2 py-1"
                          onChange={(e) => {
                            const updatedItems = [
                              ...(selectedOrder?.items || newOrder?.items),
                            ];
                            updatedItems[index].request = e.target.value
                              ? Number(e.target.value)
                              : null;
                            selectedOrder
                              ? setSelectedOrder({
                                  ...selectedOrder,
                                  items: updatedItems,
                                })
                              : setNewOrder({
                                  ...newOrder,
                                  items: updatedItems,
                                });
                          }}
                          placeholder="Masukkan Jumlah yang Diperlukan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm">Barcode</label>
                        <input
                          type="text"
                          value={item.barcodeItem || ""}
                          className="w-full border rounded px-2 py-1"
                          onChange={(e) => {
                            const updatedItems = [
                              ...(selectedOrder?.items || newOrder?.items),
                            ];
                            updatedItems[index].barcodeItem = e.target.value;
                            selectedOrder
                              ? setSelectedOrder({
                                  ...selectedOrder,
                                  items: updatedItems,
                                })
                              : setNewOrder({
                                  ...newOrder,
                                  items: updatedItems,
                                });
                          }}
                          placeholder="Masukkan barcode"
                        />
                      </div>

                      <div>
                        <label className="block text-sm">Keterangan</label>
                        <textarea
                          value={item.keterangan || ""}
                          className="w-full border rounded px-2 py-1"
                          onChange={(e) => {
                            const updatedItems = [
                              ...(selectedOrder?.items || newOrder?.items),
                            ];
                            updatedItems[index].keterangan = e.target.value;
                            selectedOrder
                              ? setSelectedOrder({
                                  ...selectedOrder,
                                  items: updatedItems,
                                })
                              : setNewOrder({
                                  ...newOrder,
                                  items: updatedItems,
                                });
                          }}
                          rows={2}
                          placeholder="Masukkan keterangan (opsional)"
                        />
                      </div>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {
                          const updatedItems = [
                            ...(selectedOrder?.items || newOrder?.items),
                          ];
                          updatedItems.splice(index, 1);
                          selectedOrder
                            ? setSelectedOrder({
                                ...selectedOrder,
                                items: updatedItems,
                              })
                            : setNewOrder({ ...newOrder, items: updatedItems });
                        }}
                      >
                        Hapus Item
                      </button>
                    </div>
                  )
                )}
                <button
                  type="button"
                  className="mt-2 text-blue-600 hover:text-blue-900"
                  onClick={() => {
                    const newItem = {
                      received: null,
                      barcodeItem: "",
                      keterangan: "",
                      tanggalTerpenuhi: null,
                    };
                    selectedOrder
                      ? setSelectedOrder({
                          ...selectedOrder,
                          items: [...(selectedOrder.items || []), newItem],
                        })
                      : setNewOrder({
                          ...newOrder,
                          items: [...(newOrder?.items || []), newItem],
                        });
                  }}
                >
                  + Tambah Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* upload csv  */}
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-20 top-0 left-0 right-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
              Upload CSV
            </h2>
            <form onSubmit={handleSubmitImportPO} className="space-y-4">
              <div>
                <label
                  htmlFor="csvFile"
                  className="block text-sm font-medium text-gray-600 mb-2"
                >
                  Select a CSV file:
                </label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  name="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 
                    hover:file:bg-indigo-100"
                />
              </div>
              <button
                onSubmit={handleSubmitImportPO}
                type="submit"
                className="w-full text-white py-2 px-4text-white rounded-lg font-medium  focus:outline-none focus:ring-2 bg-primary focus:ring-offset-2"
              >
                Upload
              </button>
            </form>
            {file && (
              <div className="mt-4 text-sm text-gray-600">
                Selected file: <span className="font-medium">{file.name}</span>
              </div>
            )}
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full py-2 px-4 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* modal untuk menampilkan detail PO */}
      <ModalDetailPurchaseOrder
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
      />
      <ModalOptions
        options={[
          {
            label: "Edit PO",
            onClick: () => {
              setSelectedOrder(tempSeelectedOrder);
              document.getElementById("clickrow").close();
            },
          },
          {
            label: "Show Detail",
            onClick: () => {
              setSelectedOrder(tempSeelectedOrder);
              document.getElementById("modalDetailPurchaseOrder")?.showModal();
              document.getElementById("clickrow").close();
            },
          },
        ]}
        onClose={() => {
          setTempSelectedOrder(null);
        }}
        modalId={"clickrow"}
        title={"Actions "}
      />
      <PickSingleInventoriesDialog
        inventoryList={inventoriyList?.data}
        tempSkuTerpilih={tempSkuTerpilih}
        setDescription={(value) => {
          selectedOrder
            ? setSelectedOrder({ ...selectedOrder, description: value })
            : setNewOrder({ ...newOrder, description: value });
        }}
        setTempSkuTerpilh={setTempSkuTerplih}
        title="Pilih Sku untuk Purchase Order"
        handleKonfirmasi={handleKonfirmasiSkuPurchaseCode}
        searchKey=""
        key={"picksingleinventoriesdialog"}
      />
    </div>
  );
}
