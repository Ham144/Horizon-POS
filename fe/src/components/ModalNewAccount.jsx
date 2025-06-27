import { createNewUser } from "@/api/authApi";
import { getOuletList } from "@/api/outletApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { mockBackend, mockPages } from "@/api/constant";

const ModalNewAccount = () => {
  const [newAccount, setNewAccount] = useState({
    username: "",
    password: "",
    email: "",
    telepon: "",
    targetHargaPenjualan: 0,
    targetQuantityPenjualan: 0,
    outlet: "",
    roleName: "",
    blockedAccess: [],
    kodeKasir: "",
    outletId: "",
  });
  const [errorMessage, setErrorMessage] = useState(null);

  const queryClient = useQueryClient();
  const { data: outletList } = useQuery({
    queryKey: ["outlet"],
    queryFn: getOuletList,
  });

  const { mutateAsync: handleCreateNewUser } = useMutation({
    mutationFn: async () => {
      // Jika outlet dipilih, lakukan assignUserToOutlet setelah user dibuat
      const response = await createNewUser(newAccount);

      // Jika outlet dipilih dan createNewUser berhasil, assign user ke outlet
      if (newAccount.outletId && response.kodeKasir) {
        try {
          const outletAssignResponse = await fetch(
            "/api/v1/outlet/assignUserToOutlet",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                userId: response.userId, // ID user yang baru dibuat
                outletId: newAccount.outletId, // ID outlet yang dipilih
              }),
            }
          );

          if (!outletAssignResponse.ok) {
            console.error("Gagal mengassign user ke outlet");
          }
        } catch (error) {
          console.error("Error saat assign user ke outlet:", error);
        }
      }

      return response;
    },
    mutationKey: ["user"],
    onSuccess: () => {
      queryClient.invalidateQueries(["user", "kasir", "spg", "admin"]);
      document.getElementById("newAccount").close();
      setNewAccount({
        username: "",
        password: "",
        email: "",
        telepon: "",
        targetHargaPenjualan: "",
        targetQuantityPenjualan: "",
        roleName: "",
        blockedAccess: [],
        kodeKasir: "",
        outletId: "",
      });
      setErrorMessage(null);
      toast.success("Account created successfully!");
    },
    onError: (err) => {
      setErrorMessage(err?.response?.data?.message || err.message);
      toast.error(err?.response?.data?.message || err.message);
      setTimeout(() => {
        setErrorMessage(null);
      }, 6000);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({
      ...prev,
      [name]: name === "roleName" ? value.toUpperCase() : value,
    }));
  };

  console.log("newAccount", newAccount);

  const toggleBlockedAccess = (page) => {
    setNewAccount((prev) => {
      const blockedAccess = prev.blockedAccess || [];
      if (blockedAccess.includes(page)) {
        return {
          ...prev,
          blockedAccess: blockedAccess.filter((item) => item !== page),
        };
      } else {
        return {
          ...prev,
          blockedAccess: [...blockedAccess, page],
        };
      }
    });
  };

  return (
    <dialog id="newAccount" className="modal">
      <div className="modal-box w-full max-w-7xl p-8 rounded-xl shadow-2xl bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-2xl text-gray-800">
            Create New Account
          </h3>
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </form>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateNewUser();
          }}
          className="space-y-6"
        >
          {/* Submit Button */}
          <button
            type="submit"
            className="btn w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md py-3 transition-all"
          >
            Create Account
          </button>
          {/* Grid untuk Input */}
          {errorMessage && (
            <div className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={newAccount.username}
                onChange={handleChange}
                required
                className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={newAccount.password}
                onChange={handleChange}
                required
                className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Masukkan password"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={newAccount.email}
                onChange={handleChange}
                required
                className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Masukkan email"
              />
            </div>

            <div>
              <label
                htmlFor="telepon"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telepon{" "}
                <span className="badge badge-neutral text-xs">Opsional</span>
              </label>
              <input
                type="tel"
                id="telepon"
                name="telepon"
                value={newAccount.telepon}
                onChange={handleChange}
                className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div>
              <label
                htmlFor="targetHargaPenjualan"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Target Harga Penjualan{" "}
                <span className="badge badge-neutral text-xs">Opsional</span>
                <span className="badge badge-neutral text-xs ml-2">
                  Untuk Statistik
                </span>
              </label>
              <input
                type="number"
                id="targetHargaPenjualan"
                name="targetHargaPenjualan"
                value={newAccount.targetHargaPenjualan}
                onChange={handleChange}
                min={0}
                className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Masukkan target harga"
              />
            </div>

            <div>
              <label
                htmlFor="targetQuantityPenjualan"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Target Quantity Penjualan{" "}
                <span className="badge badge-neutral text-xs">Opsional</span>
                <span className="badge badge-neutral text-xs ml-2">
                  Untuk Statistik
                </span>
              </label>
              <input
                type="number"
                id="targetQuantityPenjualan"
                name="targetQuantityPenjualan"
                value={newAccount.targetQuantityPenjualan}
                onChange={handleChange}
                min={0}
                className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Masukkan target quantity"
              />
            </div>

            <div>
              <label
                htmlFor="outlet"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Outlet{" "}
                <span className="badge badge-neutral text-xs">Opsional</span>
                <span className="badge badge-neutral text-xs ml-2">
                  Untuk Statistik
                </span>
              </label>
              <select
                id="outlet"
                name="outlet"
                value={newAccount.outletId}
                onChange={(e) =>
                  setNewAccount((prev) => ({
                    ...prev,
                    outletId: e.target.value,
                  }))
                }
                className="select select-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Pilih Outlet</option>
                {outletList?.data?.map((outlet) => (
                  <option key={outlet._id} value={outlet._id}>
                    {outlet.namaOutlet}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="roleName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role Name <span className="text-red-500">*</span>
                <span className="badge badge-neutral text-xs ml-2">
                  Untuk Pembatasan Routing
                </span>
              </label>
              <input
                type="text"
                id="roleName"
                name="roleName"
                value={newAccount.roleName}
                onChange={handleChange}
                required
                className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Masukkan nama role"
              />
            </div>

            <div>
              <label
                htmlFor="kodeKasir"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Kode Kasir{" "}
                <span className="badge badge-info text-xs">Max 3 karakter</span>
                <span className="badge badge-neutral text-xs ml-2">
                  Untuk Mobile
                </span>
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="kodeKasir"
                  name="kodeKasir"
                  value={newAccount.kodeKasir}
                  onChange={handleChange}
                  maxLength={3}
                  className="input input-bordered w-full rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Masukkan 3 karakter unik (opsional)"
                />
                <div className="ml-2 text-xs text-gray-500">
                  Kode 3 karakter akan dibuat otomatis jika tidak diisi
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Access Frontend */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
              Blocked Access By Page
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockPages.map((page) => (
                <div
                  key={page.originalPath}
                  className="bg-gray-50 rounded-lg shadow-sm p-4 flex items-start gap-3 hover:bg-gray-100 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={newAccount.blockedAccess.includes(
                      page.originalPath
                    )}
                    onChange={() => toggleBlockedAccess(page.originalPath)}
                    className="checkbox checkbox-primary mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 truncate">
                      {page.originalPath}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {page.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="divider divider-neutral">Atau Lebih Spesifik</div>

          {/* Blocked Access Backend */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
              Blocked Access By API Specific
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockBackend.map((api) => (
                <div
                  key={api.originalPath}
                  className="bg-gray-50 rounded-lg shadow-sm p-4 flex items-start gap-3 hover:bg-gray-100 transition-all"
                >
                  <input
                    type="checkbox"
                    checked={newAccount.blockedAccess.includes(
                      api.originalPath
                    )}
                    onChange={() => toggleBlockedAccess(api.originalPath)}
                    className="checkbox checkbox-primary mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 truncate">
                      {api.originalPath}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {api.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default ModalNewAccount;
