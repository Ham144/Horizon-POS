import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  editKasir,
  getAllKasir,
  registerKasir,
  deleteKasir,
} from "../api/kasirApi";
import { toast } from "react-hot-toast";
import { ShieldQuestion } from "lucide-react";

const KasirList = () => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [newKasirForm, setNewKasirForm] = useState({
    username: "",
    email: "",
    telepon: "",
    password: "",
    targetHargaPenjualan: "",
    targetQuantityPenjualan: "",
  });
  const [selectedKasir, setSelectedKasir] = useState(null);

  // TanStack Query Client
  const queryClient = useQueryClient();
  const { data: kasirList } = useQuery({
    queryFn: getAllKasir,
    queryKey: ["kasir"],
  });

  const { mutateAsync: handleDeleteKasir } = useMutation({
    mutationFn: (userId) => deleteKasir(userId),
    mutationKey: ["kasir"],
    onSuccess: () => queryClient.invalidateQueries("kasir"),
    onError: (err) => toast(err?.response?.data?.message),
  });

  // Mutation untuk registrasi kasir baru
  const { mutateAsync: handleRegister } = useMutation({
    mutationFn: () => registerKasir(newKasirForm),
    onSuccess: () => {
      queryClient.invalidateQueries(["kasir"]);
      setNewKasirForm({
        username: "",
        email: "",
        telepon: "",
        password: "",
        targetHargaPenjualan: "",
        targetQuantityPenjualan: "",
      });
      document.getElementById("newkasir").close();
      toast.success("berhasil register kasir");
    },
    onError: (err) => toast(err?.response?.data?.message),
  });

  // Mutation untuk mengedit kasir
  const { mutateAsync: handleEditKasir } = useMutation({
    mutationFn: () => editKasir(selectedKasir),
    onSuccess: () => {
      queryClient.invalidateQueries(["kasir"]);
      setShowEditForm(false);
      setSelectedKasir(null);
      toast.success("berhasil edit kasir");
    },
    onError: (err) => {
      toast(err?.response?.data?.message);
    },
  });

  // Handler untuk klik tombol edit
  const handleEditClick = (kasir) => {
    setSelectedKasir(null);
    setTimeout(() => {
      setSelectedKasir({
        _id: kasir._id,
        username: kasir.username,
        email: kasir.email,
        telepon: kasir.telepon,
        password: kasir.password,
        targetHargaPenjualan: kasir.targetHargaPenjualan,
        targetQuantityPenjualan: kasir.targetQuantityPenjualan,
      });
    }, 0);
    setShowEditForm(true); // Tampilkan form edit
  };

  return (
    <div className="flex flex-1  flex-col items-start p-4">
      <div className="flex flex-1 w-full ">
        {/* Left Column: Kasir List */}
        <div className="flex-1 w-full h-full  p-6 rounded-lg shadow-lg bg-white ">
          <div className="flex w-full justify-between px-3">
            <button
              onClick={() => {
                setNewKasirForm({
                  username: "",
                  email: "",
                  telepon: "",
                  targetHargaPenjualan: "",
                  targetQuantityPenjualan: "",
                });
                document.getElementById("newkasir").showModal();
              }}
              className="bg-primary text-white px-6 py-3 "
            >
              Kasir Baru
            </button>
            <h2 className="btn">Total Kasir: {kasirList?.data.length || 0}</h2>
          </div>
          <div className="flex flex-1 w-full overflow-auto">
            <div className="mb-4 w-full">
              {/* Table to Display Kasirs */}
              <table className="w-full mt-4 border-collapse ">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 text-left ">Username</th>
                    <th className="p-2 text-left ">Email</th>
                    <th className="p-2 text-left ">Kode Kasir</th>
                    <th className="p-2 text-left ">Telepon</th>
                    <th className="p-2 text-center ">SKU Terjual</th>
                    <th className="p-2 text-right ">Total Penjualan</th>
                    <th className="p-2 text-center ">Total Quantity</th>
                    <th className="p-2 text-right ">Target Penjualan</th>
                    <th className="p-2 text-center ">Target Quantity</th>
                  </tr>
                </thead>
                <tbody className="border">
                  {kasirList?.data.map((kasir) => (
                    <tr
                      key={kasir._id}
                      onClick={() => handleEditClick(kasir)}
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      <td className="p-2 ">{kasir.username}</td>
                      <td className="p-2 ">{kasir.email}</td>
                      <td className="p-2 ">{kasir?.kodeKasir}</td>
                      <td className="p-2 ">{kasir.telepon}</td>
                      <td className="p-2 text-center ">
                        {kasir.skuTerjual?.length}
                      </td>
                      <td className="p-2 text-right ">
                        {kasir.totalHargaPenjualan || 0}
                      </td>
                      <td className="p-2 text-center ">
                        {kasir.totalQuantityPenjualan || 0}
                      </td>
                      <td className="p-2 text-right ">
                        {kasir.targetHargaPenjualan || 0}
                      </td>
                      <td className="p-2 text-center ">
                        {kasir.targetQuantityPenjualan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Right Column: Edit Kasir */}
        {showEditForm && selectedKasir && (
          <div className="w-[400px] ml-8 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Edit Kasir
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditKasir();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block font-semibold ">
                  Username/nama kasir (tidak bisa diubah)
                  <div
                    className="tooltip"
                    data-tip="Tidak bisa diubah, sudah terlanjur penghubung (FK) antar Invoice"
                  >
                    <ShieldQuestion className="w-4 h-4" />
                  </div>
                </label>
                <input
                  type="text"
                  disabled={true}
                  className="w-full bg-gray-100 border px-4 py-2 rounded-lg"
                  placeholder="Enter username"
                  value={selectedKasir.username}
                  onChange={(e) =>
                    setSelectedKasir((prev) => ({
                      ...prev,
                      username: e.target.value,
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
                  value={selectedKasir.email}
                  onChange={(e) =>
                    setSelectedKasir((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block font-semibold">Telepon</label>
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded-lg"
                  placeholder="Enter phone number"
                  value={selectedKasir.telepon}
                  onChange={(e) =>
                    setSelectedKasir((prev) => ({
                      ...prev,
                      telepon: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block font-semibold">
                  Target Harga Penjualan
                </label>
                <input
                  type="number"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={selectedKasir.targetHargaPenjualan}
                  onChange={(e) =>
                    setSelectedKasir((prev) => ({
                      ...prev,
                      targetHargaPenjualan: parseInt(e.target.value),
                    }))
                  }
                  placeholder="Enter target sales"
                />
              </div>
              <div>
                <label className="block font-semibold">
                  Target Quantity Penjualan
                </label>
                <input
                  type="number"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={selectedKasir.targetQuantityPenjualan}
                  onChange={(e) =>
                    setSelectedKasir((prev) => ({
                      ...prev,
                      targetQuantityPenjualan: parseInt(e.target.value),
                    }))
                  }
                  placeholder="Enter target quantity"
                />
              </div>
              <div>
                <label className="block font-semibold">
                  New Password (kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  className="w-full border px-4 py-2 rounded-lg"
                  value={selectedKasir?.password}
                  onChange={(e) =>
                    setSelectedKasir((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter new Password"
                />
              </div>
              <div className="flex justify-between gap-4">
                <button
                  type="button"
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                  onClick={() => setShowEditForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-red-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                  onClick={() => {
                    const confirmDelete = window.confirm(
                      `Apakah Anda yakin ingin menghapus kasir ${selectedKasir.username}?`
                    );
                    if (confirmDelete) {
                      handleDeleteKasir(selectedKasir._id);
                    }
                  }}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className="bg-secondary-content text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal untuk registrasi kasir baru */}
      <dialog id="newkasir" className="modal h-full ">
        <div className="modal-box ">
          <h3 className="font-bold text-lg">Tambah Kasir Baru</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
          >
            <div className="mb-2">
              <label>Nama Kasir</label>
              <input
                type="text"
                value={newKasirForm.username}
                onChange={(e) =>
                  setNewKasirForm({ ...newKasirForm, username: e.target.value })
                }
                placeholder="Enter nama kasir"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label>Email</label>
              <input
                type="email"
                value={newKasirForm.email}
                onChange={(e) =>
                  setNewKasirForm({ ...newKasirForm, email: e.target.value })
                }
                placeholder="Enter email"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label>No HP</label>
              <input
                type="text"
                value={newKasirForm.telepon}
                onChange={(e) =>
                  setNewKasirForm({ ...newKasirForm, telepon: e.target.value })
                }
                placeholder="Enter no hp"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label>Target Harga Penjualan</label>
              <input
                type="number"
                value={newKasirForm.targetHargaPenjualan}
                onChange={(e) =>
                  setNewKasirForm({
                    ...newKasirForm,
                    targetHargaPenjualan: parseFloat(e.target.value),
                  })
                }
                placeholder="Enter target harga penjualan"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label>Target Quantity Penjualan</label>
              <input
                type="number"
                value={newKasirForm.targetQuantityPenjualan}
                onChange={(e) =>
                  setNewKasirForm({
                    ...newKasirForm,
                    targetQuantityPenjualan: parseInt(e.target.value),
                  })
                }
                placeholder="Enter target quantity penjualan"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label>Password</label>
              <input
                type="password"
                value={newKasirForm.password}
                required={true}
                onChange={(e) =>
                  setNewKasirForm({
                    ...newKasirForm,
                    password: e.target.value,
                  })
                }
                placeholder="Masukkan password"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => document.getElementById("newkasir").close()}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default KasirList;
