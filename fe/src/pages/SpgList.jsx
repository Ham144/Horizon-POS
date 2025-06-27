import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { deleteSpg, editSpg, getAllSpg, registerSpg } from "../api/spgApi";
import toast from "react-hot-toast";

const SpgList = () => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [newSpgForm, setNewSpgForm] = useState({
    name: "",
    telepon: "",
    email: "",
    targetQuantityPenjualan: "",
    targetHargaPenjualan: "",
  });
  const [selectedSpg, setSelectedSpg] = useState(null);

  //tanstack
  const queryClient = useQueryClient();
  const { mutateAsync: handleRegister } = useMutation({
    mutationFn: () => registerSpg(newSpgForm),
    onSuccess: () => {
      queryClient.invalidateQueries(["spg"]);
      setNewSpgForm({});
      document.getElementById("newspg").close();
    },
  });

  const { mutateAsync: handleEditSpg } = useMutation({
    mutationFn: () => editSpg(selectedSpg),
    onSuccess: () => {
      queryClient.invalidateQueries(["spg"]);
      setShowEditForm(false);
      setSelectedSpg();
    },
  });

  const { mutateAsync: handleDeleteSpg } = useMutation({
    mutationFn: (spgId) => deleteSpg(spgId),
    mutationKey: ["spg"],
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
    onSuccess: (res) => {
      toast.success(res?.response?.data?.message);
      queryClient.invalidateQueries(["spg"]);
      setSelectedSpg(null);
      setShowEditForm(false);
    },
  });

  const handleEditClick = (spg) => {
    setSelectedSpg();
    setTimeout(() => {
      setSelectedSpg({
        id: spg._id,
        name: spg.name,
        telepon: spg.telepon,
        email: spg.email,
        targetQuantityPenjualan: spg.targetQuantityPenjualan,
        targetHargaPenjualan: spg.targetHargaPenjualan?.$numberDecimal,
      });
    }, 0);
    setShowEditForm(true); // Show the edit form
  };

  const { data: spgList } = useQuery({
    queryFn: () => getAllSpg(),
    queryKey: ["spg"],
  });

  return (
    <div className="flex p-8 bg-gray-50 min-h-screen">
      {/* Left Column: Promotion List */}
      {/* Left Column: SPG List */}
      <div className="flex-1 w-full h-full bg-white p-6 rounded-lg shadow-lg">
        <div className="flex w-full flex-1  justify-between mb-6">
          <button
            onClick={() => {
              setNewSpgForm({
                name: "",
                telepon: "",
                email: "",
                targetQuantityPenjualan: "",
                targetHargaPenjualan: "",
              });
              document.getElementById("newspg").showModal();
            }}
            className="bg-primary text-white px-6 py-3 rounded-xs "
          >
            Spg Baru
          </button>
          <div className="flex gap-3">
            <button className="bg-primary text-white px-4 py-2 rounded-xs">
              Total Spg: {spgList?.data?.length}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto h-full">
          {/* Table to Display SPGs */}
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4  py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Total Sales</th>
                <th className="px-4 py-2 text-left">Total Quantity</th>
                <th className="px-4 py-2 text-left">Target Sales</th>
                <th className="px-4 py-2 text-left">Target Quantity</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock Data for SPGs */}
              {spgList?.data.map((spg) => (
                <tr
                  key={spg._id}
                  onClick={() => handleEditClick(spg)}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <td className="px-4 py-2">{spg.name}</td>
                  <td className="px-4 py-2">{spg.telepon}</td>
                  <td className="px-4 py-2">{spg.email}</td>
                  <td className="px-4 py-2">
                    {spg.totalHargaPenjualan?.$numberDecimal}
                  </td>
                  <td className="px-4 py-2">{spg.totalQuantityPenjualan}</td>
                  <td className="px-4 py-2">
                    {spg.targetHargaPenjualan?.$numberDecimal}
                  </td>
                  <td className="px-4 py-2">{spg.targetQuantityPenjualan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Edit SPG */}
      {showEditForm && selectedSpg && (
        <div className="w-[400px] ml-8 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Edit Spg
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSpg();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block font-semibold">Name</label>
              <input
                type="text"
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Enter name"
                value={selectedSpg.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setSelectedSpg((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block font-semibold">Phone</label>
              <input
                type="tel"
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Enter phone number"
                value={selectedSpg.telepon}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setSelectedSpg((prev) => ({
                    ...prev,
                    telepon: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block font-semibold">Email</label>
              <input
                type="email"
                className="w-full border px-4 py-2 rounded-lg"
                placeholder="Enter email address"
                value={selectedSpg.email}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setSelectedSpg((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block font-semibold">Target Quantity</label>
              <input
                type="number"
                className="w-full border px-4 py-2 rounded-lg"
                value={selectedSpg.targetQuantityPenjualan}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setSelectedSpg((prev) => ({
                    ...prev,
                    targetQuantityPenjualan: parseInt(e.target.value),
                  }))
                }
                placeholder="Enter target quantity"
              />
            </div>

            <div>
              <label className="block font-semibold">Target Sales</label>
              <input
                type="number"
                className="w-full border px-4 py-2 rounded-lg"
                value={selectedSpg.targetHargaPenjualan}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setSelectedSpg((prev) => ({
                    ...prev,
                    targetHargaPenjualan: parseInt(e.target.value),
                  }))
                }
                placeholder="Enter target sales"
              />
            </div>

            <div className="flex justify-between gap-4">
              <button
                type="button"
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                onClick={() => setShowEditForm(false)} // Close the form
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
                onClick={() => handleDeleteSpg(selectedSpg?.id)}
              >
                Delete
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
      {/* modal untuk new register spg */}
      <dialog id="newspg" className="modal">
        <div className="modal-box">
          <form method="dialog" onSubmit={handleRegister}>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold">Nama SPG</label>
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={newSpgForm?.name}
                  onChange={(e) =>
                    setNewSpgForm({ ...newSpgForm, name: e.target?.value })
                  }
                  placeholder="Enter nama SPG"
                />
              </div>
              <div>
                <label className="block font-semibold">No HP</label>
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={newSpgForm?.telepon}
                  onChange={(e) =>
                    setNewSpgForm({ ...newSpgForm, telepon: e.target.value })
                  }
                  placeholder="Enter no hp"
                />
              </div>

              <div>
                <label className="block font-semibold">Email</label>
                <input
                  type="email"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={newSpgForm?.email}
                  onChange={(e) =>
                    setNewSpgForm({ ...newSpgForm, email: e.target.value })
                  }
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block font-semibold">Target Sales</label>
                <input
                  type="number"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={newSpgForm?.targetHargaPenjualan}
                  onChange={(e) =>
                    setNewSpgForm({
                      ...newSpgForm,
                      targetHargaPenjualan: e.target.value,
                    })
                  }
                  placeholder="Enter Target Sales"
                />
              </div>
              <div>
                <label className="block font-semibold">Target Quantity</label>
                <input
                  type="number"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={newSpgForm?.targetQuantityPenjualan}
                  onChange={(e) =>
                    setNewSpgForm({
                      ...newSpgForm,
                      targetQuantityPenjualan: e.target.value,
                    })
                  }
                  placeholder="Enter Target Quantity"
                />
              </div>

              <div className="flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setNewSpgForm();
                    document.getElementById("newspg").close();
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default SpgList;
