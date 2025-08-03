import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { resetParyly } from "../api/databaseFeatureApi";
import toast from "react-hot-toast";
export default function DatabaseFeature() {
  const [selected, setSelected] = useState({
    user: false,
    spg: false,
    outlet: false,
    invoice: false,
    customer: false,
  });
  const [action, setAction] = useState(""); //reset, export

  const handleToggling = (name) => {
    setSelected((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  //tanstack query
  const {
    mutate: handleReset,
    isLoading,
    error,
  } = useMutation({
    mutationKey: ["resetPartly"],
    mutationFn: () => resetParyly(selected, action),
    onSuccess: () => {
      toast("Success");
    },
    onError: () => {
      toast("Error");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-ring loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 gap-y-6 flex flex-col">
      <h1 className="text-2xl font-bold">
        Database Feature <div className="badge badge-primary">Experimental</div>
      </h1>
      <div className="flex  gap-4 w-full justify-between">
        <div className="badge badge-primary">
          Action: {action || "Belum dipilih"}
        </div>
        <select
          className="select select-bordered w-full max-w-xs"
          onChange={(e) => setAction(e.target.value)}
        >
          <option disabled selected>
            Pilih Action
          </option>
          <option>Reset</option>
          <option>Export</option>
        </select>
      </div>

      <div className="w-full flex flex-col gap-4">
        {/* User Toggle */}
        <div className="flex flex-col w-full p-3 bg-gray-50 rounded-lg">
          <div className="flex w-full justify-between">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="resetUser"
            >
              User
            </label>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              id="resetUser"
              checked={selected.user}
              onChange={() => handleToggling("user")}
            />
          </div>

          <input
            type="text"
            placeholder="Cari user"
            className="input input-bordered w-full max-w-xs"
          />
        </div>

        {/* Spg Toggle */}
        <div className="flex flex-col w-full p-3 bg-gray-50 rounded-lg">
          <div className="flex w-full justify-between">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="resetSpg"
            >
              Spg
            </label>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              id="resetSpg"
              checked={selected.spg}
              onChange={() => handleToggling("spg")}
            />
          </div>
          <input
            type="text"
            placeholder="Cari spg"
            className="input input-bordered w-full max-w-xs"
          />
        </div>

        {/* Outlet Toggle */}
        <div className="flex flex-col w-full p-3 bg-gray-50 rounded-lg">
          <div className="flex w-full justify-between">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="resetOutlet"
            >
              Outlet
            </label>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              id="resetOutlet"
              checked={selected.outlet}
              onChange={() => handleToggling("outlet")}
            />
          </div>
          <input
            type="text"
            placeholder="Cari outlet"
            className="input input-bordered w-full max-w-xs"
          />
        </div>

        {/* Invoice Toggle */}
        <div className="flex flex-col w-full p-3 bg-gray-50 rounded-lg">
          <div className="flex w-full justify-between">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="resetInvoice"
            >
              Invoice
            </label>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              id="resetInvoice"
              checked={selected.invoice}
              onChange={() => handleToggling("invoice")}
            />
          </div>
          <input
            type="text"
            placeholder="Cari invoice"
            className="input input-bordered w-full max-w-xs"
          />
        </div>
        <div className="flex flex-col w-full p-3 bg-gray-50 rounded-lg">
          <div className="flex w-full justify-between">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="resetCustomer"
            >
              Pelanggan
            </label>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              id="resetCustomer"
              checked={selected.customer}
              onChange={() => handleToggling("customer")}
            />
          </div>
          <input
            type="text"
            placeholder="Cari pelanggan"
            className="input input-bordered w-full max-w-xs"
          />
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          if (action === "reset") {
            handleReset();
          }
          if (action === "export") {
            handleExport();
          } else {
            toast("Pilih dulu actionnya");
          }
        }}
      >
        RUN
      </button>
    </div>
  );
}
