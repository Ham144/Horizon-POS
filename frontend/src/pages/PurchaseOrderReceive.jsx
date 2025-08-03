import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StepBack, StepForward, RefreshCcw } from "lucide-react";
import React, { useState } from "react";
import {
  completeAllPurchaseOrder,
  manualEditPurchaseOrder,
  scanBarcode,
  scanErp,
} from "../api/purchaseOrderApi";
import toast from "react-hot-toast";
import { ModalItemEdit } from "../components/ModalItemEdit";
import ModalConfirmation from "@/components/ModalConfirmation";

const PurchaseOrderReceive = () => {
  const [currentForm, setCurrentForm] = useState("Erp"); //Erp, barcode

  //states input
  const [Erp, setErp] = useState("");
  const [plat, setPlat] = useState("");
  const [barcode, setBarcode] = useState("");

  //states modif
  const [searchResult, setSearchResult] = useState();
  const [selectedItem, setSelectedItem] = useState();

  //tanstack
  const { mutateAsync: handleScanErp } = useMutation({
    mutationFn: () =>
      scanErp({ Erp: Erp?.toUpperCase(), plat: plat?.toUpperCase() }),
    mutationKey: ["purchaseOrder"],
    onSuccess: (res) => {
      setCurrentForm("barcode");
      setSearchResult(res.data);
    },
    onError: (res) => {
      setCurrentForm("Erp");
      toast.error(res?.response?.data?.message || res?.message);
    },
  });

  const queryClient = useQueryClient();
  const { mutateAsync: handleScanBarcode } = useMutation({
    mutationFn: () =>
      scanBarcode({ Erp: Erp?.toUpperCase(), barcode: barcode?.toUpperCase() }),
    mutationKey: ["purchaseOrder", "inventories"],
    onSuccess: (res) => {
      queryClient.invalidateQueries(["purchaseOrder", "inventories"]);
    },
    onError: (res) => {
      toast.error(res?.response?.data?.message || "Kegagalan tidak diketahui");
    },
  });

  const { mutateAsync: handleCompleteAllPurchaseOrder } = useMutation({
    mutationFn: async () => {
      const body = { Erp, currentTime: new Date() };
      const response = await completeAllPurchaseOrder(body);
      return response.data;
    },
    mutationKey: ["purchaseOrder"],
    onSuccess: (res) => {
      queryClient.invalidateQueries(["purchaseOrder", "inventories"]);
      handleScanErp();
      return setSearchResult(res?.data || searchResult);
    },
    onError: (res) => res?.response?.data?.message,
  });
  // Mutasi untuk mengedit item
  const { mutateAsync: handleManualEditPurchaseOrder } = useMutation({
    mutationFn: async () => {
      const body = {
        Erp: Erp?.toUpperCase(),
        sku: selectedItem?.sku,
        request: selectedItem?.request,
        received: selectedItem?.received,
        currentTime: new Date(),
      };
      const data = await manualEditPurchaseOrder(body);
      return data; //jangan lupa Kembalikan data ke onSuccess
    },
    mutationKey: ["purchaseOrder", "inventories"],
    onSuccess: (res) => {
      queryClient.invalidateQueries(["purchaseOrder", "inventories"]);
      document.getElementById("editItemModal").close();
      setSearchResult(res?.data || searchResult);
    },
    onError: (error) => {
      console.log("Error dari onError:", error); // Debugging
      toast.error(error.message || "Gagal mengupdate item");
    },
  });
  const handlePickItem = (item) => {
    document.getElementById("editItemModal").showModal();
    setSelectedItem(item);
  };

  console.log(searchResult);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-base-200 p-4">
      <div className="card bg-base-100 p-8 w-full max-w-2xl shadow-xl rounded-lg">
        <div className="flex flex-col items-center justify-center">
          <h1 className="font-bold text-2xl mb-6 text-center text-base-content">
            Terima Purchase Order
          </h1>
          <div className="flex gap-x-3 justify-between items-center w-full mb-6">
            <button
              disabled={currentForm === "Erp"}
              onClick={() => setCurrentForm("Erp")}
              className={`btn btn-outline btn-primary flex-1 ${
                currentForm === "Erp" ? "btn-disabled" : ""
              }`}
            >
              <StepBack className="w-5 h-5 mr-1" /> ERP
            </button>
            <button
              disabled={!searchResult?.items?.length && !barcode && !Erp}
              className="btn btn-outline btn-error"
              onClick={() => {
                setCurrentForm("Erp");
                setSearchResult(null);
                setErp("");
                setBarcode("");
                setPlat("");
              }}
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              disabled={
                (currentForm === "Erp" && !Erp) ||
                (currentForm === "barcode" && !barcode)
              }
              onClick={() =>
                currentForm === "Erp" ? handleScanErp() : handleScanBarcode()
              }
              className="btn btn-primary flex-1"
            >
              {currentForm === "Erp" ? "Cari PO" : "Scan Barcode"}{" "}
              <StepForward className="w-5 h-5 ml-1" />
            </button>
          </div>
          {currentForm === "Erp" && (
            <form
              className="w-full space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleScanErp();
              }}
            >
              <div className="form-control">
                <label className="label" htmlFor="Erp">
                  <span className="label-text font-semibold">
                    Purchase Code (ERP)
                  </span>
                </label>
                <input
                  id="Erp"
                  type="text"
                  value={Erp}
                  onChange={(e) => setErp(e.target.value)}
                  placeholder="Masukkan kode Purchase Order"
                  className="input input-bordered w-full"
                  autoFocus
                />
              </div>
              <div className="form-control">
                <label className="label" htmlFor="plat">
                  <span className="label-text font-semibold">
                    Plat Kendaraan (Opsional)
                  </span>
                </label>
                <input
                  id="plat"
                  type="text"
                  value={plat}
                  onChange={(e) => setPlat(e.target.value)}
                  placeholder="Contoh: B 1234 XYZ"
                  className="input input-bordered w-full"
                />
              </div>
              <button type="submit" className="hidden">
                Submit
              </button>
            </form>
          )}
          {currentForm === "barcode" && (
            <div className="w-full space-y-4 mt-4">
              <form
                className="form-control"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScanBarcode();
                }}
              >
                <label className="label" htmlFor="barcodeScanner">
                  <span className="label-text font-semibold">
                    Scan Barcode Item{" "}
                    <div className="badge badge-accent">
                      BUG UMUM: hapus inventory yang memiliki barcode yang sama
                    </div>
                  </span>
                </label>
                <input
                  id="barcodeScanner"
                  onChange={(e) => setBarcode(e.target.value)}
                  value={barcode}
                  type="text"
                  placeholder="Arahkan scanner barcode ke sini"
                  className="input input-bordered w-full"
                  autoFocus
                />
              </form>
              {searchResult?.items?.length > 0 && (
                <div className="flex justify-between items-center bg-base-200 p-3 rounded-md">
                  <span className="font-medium text-base-content">
                    PO: {searchResult.Erp} ({searchResult.items.length} item)
                  </span>
                  <button
                    disabled
                    className="btn btn-success btn-sm text-success-content"
                    onClick={() =>
                      document.getElementById("modal_confirmation").showModal()
                    }
                  >
                    Selesaikan Semua
                  </button>
                </div>
              )}
              <div className="overflow-x-auto border border-base-300 rounded-md max-h-72">
                <table className="table table-zebra table-sm w-full">
                  <thead className="sticky top-0 bg-base-300 text-base-content z-10">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">Request</th>
                      <th className="p-3 text-center">Barcode</th>
                      <th className="p-3 text-center">Received</th>
                      <th className="p-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResult?.items?.length > 0 ? (
                      searchResult.items.map((item, index) => (
                        <tr
                          key={item.sku || index}
                          onClick={() => handlePickItem(item)}
                          className={`text-center hover:bg-base-200 cursor-pointer ${
                            item.request === item.received
                              ? "opacity-50 bg-green-100"
                              : ""
                          }`}
                        >
                          <td className="p-3 text-left font-mono">
                            {item.sku}
                          </td>
                          <td className="p-3 font-semibold">{item.request}</td>
                          <td className="p-3 font-semibold">
                            {item.barcodeItem}
                          </td>
                          <td className="p-3 font-semibold">{item.received}</td>
                          <td className="p-3 text-left text-xs italic">
                            {item.keterangan || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center p-4 text-base-content text-opacity-60"
                        >
                          {Erp
                            ? "Tidak ada item ditemukan untuk PO ini atau PO sudah selesai."
                            : "Scan barcode untuk melihat item."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <ModalItemEdit
        key={"editItemModal"}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        onConfirm={handleManualEditPurchaseOrder}
      />
      <ModalConfirmation
        onConfirm={handleCompleteAllPurchaseOrder}
        title={`Selesaikan Semua Item untuk PO ${searchResult?.Erp}?`}
        message="Tindakan ini akan menandai semua item dalam Purchase Order ini sebagai telah diterima (received) sesuai jumlah request."
        key={"confirmation-complete-all"}
        onCancel={() => {
          const modal = document.getElementById("modal_confirmation");
          if (modal) modal.close();
        }}
      />
    </div>
  );
};

export default PurchaseOrderReceive;
