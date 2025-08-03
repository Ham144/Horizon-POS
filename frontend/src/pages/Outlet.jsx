import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useRef, useEffect } from "react";
import {
  assignSpgToOutlet,
  assignUserToOutlet,
  deleteOutlet,
  editOutlet,
  getOuletList,
  registerOutlet,
} from "../api/outletApi";
import { BadgeHelp, LucideShieldQuestion, Package } from "lucide-react";
import toast from "react-hot-toast";
import ModalPickKasir from "../components/ModalPickKasir";
import { getAllAccount } from "@/api/authApi";
import ModalConfirmation from "../components/ModalConfirmation";
import ModalBrandPick from "@/components/ModalBrandPick";
import { getAllBrands } from "@/api/brandApi";
import ModalRegisterOutlet from "@/components/ModalRegisterOutlet";
import ModalConfirmation2 from "@/components/ModalConfirmation2";
import ModalSpgMultiPick from "@/components/modalSpgMultiPick";
import { getAllSpg } from "@/api/spgApi";

const Outlet = () => {
  const [showEditForm, setShowEditForm] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState();
  const initialNewOutletForm = {
    namaOutlet: "",
    description: "",
    kasirList: [], //kasir list di state yang beda karena dikirim ke api yg beda
  };
  const [newOutletForm, setNewOutletForm] = useState(initialNewOutletForm);
  const modalPickKasirRef = useRef();
  const [outletToDelete, setOutletToDelete] = useState(null);
  const [selectedSpgIds, setSelectedSpgIds] = useState([]);

  //tanstack
  const queryClient = useQueryClient();
  const { data: outletList, refetch: refetchOutlets } = useQuery({
    queryFn: getOuletList,
    queryKey: ["outlet"],
  });
  const { data: userList } = useQuery({
    queryFn: getAllAccount,
    queryKey: ["user", "kasir"],
  });
  const { data: brandList } = useQuery({
    queryKey: ["brand"],
    queryFn: getAllBrands,
  });
  const { data: spgList } = useQuery({
    queryKey: ["spg"],
    queryFn: getAllSpg,
  });

  useEffect(() => {
    // Refetch outlet list ketika selectedOutlet berubah
    if (selectedOutlet) {
      refetchOutlets();
    }
  }, [selectedOutlet, refetchOutlets]);

  const { mutateAsync: handleEditOutlet } = useMutation({
    mutationFn: async (body) => {
      // Simpan daftar kasir sebelum edit
      const kasirList = [...(body.kasirList || [])];

      // Hapus kasirList dari body yang dikirim ke API
      const { kasirList: _, ...outletData } = body;

      // Edit outlet tanpa kasirList
      await editOutlet(outletData);

      // Assign kasir ke outlet satu per satu
      if (kasirList?.length > 0) {
        const assignPromises = kasirList?.map(async (kasirId) => {
          return await assignUserToOutlet(kasirId, body._id);
        });
        await Promise.all(assignPromises);
      }

      setSelectedOutlet(null);
      setNewOutletForm(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet"]);
      setSelectedOutlet(null);
      setShowEditForm(false);
      toast.success("Berhasil mengedit outlet");
    },
    onError: (err) => {
      toast(err.message);
    },
  });

  const { mutateAsync: handleAssignSpgToOutlet } = useMutation({
    mutationFn: async () => {
      return await assignSpgToOutlet(
        selectedOutlet.spgList,
        selectedOutlet._id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet", "spg"]);
      toast.success("Berhasil menambahkan spg ke outlet");
      document.getElementById("modalSpgPick").close();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const { mutateAsync: handleRegisterOutlet } = useMutation({
    mutationFn: async (body) => {
      // Simpan daftar kasir sebelum create
      const kasirList = [...(body.kasirList || [])];

      // Hapus kasirList dari body yang dikirim ke API
      const { kasirList: _, ...outletData } = body;

      // Create outlet tanpa kasirList
      const response = await registerOutlet(outletData);

      // Assign kasir ke outlet baru
      if (kasirList?.length > 0 && response?.data?._id) {
        const assignPromises = kasirList?.map(async (kasirId) => {
          return await assignUserToOutlet(kasirId, response.data._id);
        });
        await Promise.all(assignPromises);
      }

      return response;
    },
    mutationKey: ["outlet"],
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet"]);
      toast.success("Berhasil membuat outlet");
      setNewOutletForm(initialNewOutletForm);
      document.getElementById("newoutlet").close();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
    },
  });

  const { mutateAsync: handleDeleteOutlet } = useMutation({
    mutationFn: (_id) => deleteOutlet(_id),
    mutationKey: ["outlet"],
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet"]);
      toast.success("Berhasil menghapus outlet");
      setSelectedOutlet();
      setShowEditForm(false);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Mungkin anda tidak memiliki akses"
      );
    },
  });

  const [ambiguKasir, setAmbiguKasir] = useState([]);
  const [selectedKasirIds, setSelectedKasirIds] = useState([]);

  const beforeHandleSelectKasir = (kasirIds) => {
    // Simpan kasir IDs dari modal ke state
    setSelectedKasirIds(kasirIds);

    // Cek apakah ada kasir yang sudah berada di outlet lain
    const usersInOtherOutlets = [];

    // Loop untuk mencari kasir yang sudah terdaftar di outlet lain
    kasirIds.forEach((kasirId) => {
      const isUserInOtherOutlet = outletList?.data.some(
        (outlet) =>
          (selectedOutlet ? outlet._id !== selectedOutlet._id : true) &&
          outlet.kasirList &&
          outlet.kasirList.includes(kasirId)
      );

      if (isUserInOtherOutlet) {
        // Tambahkan username ke list untuk ditampilkan di konfirmasi
        const user = userList?.data?.find((u) => u._id === kasirId);
        if (user?.username) {
          usersInOtherOutlets.push(user.username);
        }
      }
    });

    if (usersInOtherOutlets?.length > 0) {
      // Tampilkan modal konfirmasi jika ada konflik
      setAmbiguKasir(usersInOtherOutlets);
      document.getElementById("modal_confirmation2").showModal();
    } else {
      // Jika tidak ada konflik, langsung update state
      handleKasirSelection();
    }
  };

  // Fungsi untuk menerapkan pilihan kasir (tanpa API call)
  const handleKasirSelection = () => {
    if (!selectedKasirIds?.length) return;

    if (selectedOutlet) {
      // Update state untuk outlet yang sudah ada
      setSelectedOutlet((prev) => ({
        ...prev,
        kasirList: selectedKasirIds,
      }));
    } else {
      // Update state untuk outlet baru
      setNewOutletForm((prev) => ({
        ...prev,
        kasirList: selectedKasirIds,
      }));
    }

    // Bersihkan state setelah selesai
    setSelectedKasirIds([]);
    setAmbiguKasir([]);
  };

  const handleEditClick = (outlet) => {
    setSelectedOutlet(outlet);
    setShowEditForm(true);
  };

  // Function to reset the new outlet form
  const resetNewOutletForm = () => {
    setNewOutletForm({
      namaOutlet: "",
      description: "",
      kasirList: [],
      spgList: [],
      logo: null,
      brandIds: [],
    });

    setSelectedOutlet();
    // Also reset the kasir selection modal
    if (modalPickKasirRef.current) {
      modalPickKasirRef.current.resetModal();
    }
  };

  //untuk new outlet
  const tambahkanTerpilih = (brandIds) => {
    setNewOutletForm((prev) => ({
      ...prev,
      brandIds: brandIds,
    }));
    // Invalidate dan refetch data
    queryClient.invalidateQueries({ queryKey: ["outlet"] });
    queryClient.invalidateQueries({ queryKey: ["brand"] });
  };

  // Update handleSpgSelection function
  const handleSpgSelection = (spgIds) => {
    if (selectedOutlet) {
      setSelectedOutlet((prev) => ({
        ...prev,
        spgList: spgIds,
      }));
      handleAssignSpgToOutlet();
    } else {
      setNewOutletForm((prev) => ({
        ...prev,
        spgList: spgIds,
      }));
    }
  };

  return (
    <div className="flex p-4 bg-gray-50 min-h-screen">
      {/* Left Column: Outlet List (75% width) */}
      <div className="flex flex-col  pr-4">
        <div className="flex w-full justify-between mb-6 items-center">
          <button
            onClick={() => {
              resetNewOutletForm();
              document.getElementById("newoutlet").showModal();
            }}
            className="bg-secondary-content text-white px-6 py-3 rounded-md shadow-md hover:bg-secondary-focus transition-colors" // Added shadow and hover effects
          >
            Outlet Baru
          </button>
          <div className="flex gap-3">
            <button className="bg-primary text-white px-4 py-2 rounded-md shadow-md">
              Total Outlet: {outletList?.data?.length || 0}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto flex-1 rounded-lg shadow-md bg-white">
          {" "}
          {/* Added flex-1, rounded-lg, shadow-md, and bg-white */}
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200 text-base-content">
                <th className="px-4 py-3 text-center font-medium">
                  Kode Outlet{" "}
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="untuk format kodeInvoice"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Nama Outlet{" "}
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="untuk display dan struk"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">Deskripsi</th>
                <th className="px-4 py-3 text-center font-medium">
                  Pendapatan{" "}
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="Pendapatan total outlet terkait terlepas dari kasir"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Kasir List{" "}
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="Kasir yang di assign/set untuk outlet ini"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Spg List{" "}
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="spg yang di assing/set ke outlet ini, spg yang sama bisa di assign ke outlet lain juga tidak seperti kasir yang harus berpindah outlet"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Nama Perusahaan{" "}
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="Nama perusahaan yang terkait dengan outlet ini"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Alamat{" "}
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="Alamat outlet"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">NPWP</th>
                <th className="px-4 py-3 text-center font-medium">Brand</th>
              </tr>
            </thead>
            <tbody>
              {outletList?.data?.map((outlet) => (
                <tr
                  key={outlet._id}
                  onClick={() => handleEditClick(outlet)}
                  className="hover:bg-base-200/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-center">{outlet.kodeOutlet}</td>
                  <td className="px-4 py-3 text-center font-medium">
                    {outlet.namaOutlet}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {outlet.description}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {outlet.pendapatan
                      ? Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(Number(outlet.pendapatan))
                      : "0"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {userList?.data
                      ?.filter((user) => outlet?.kasirList?.includes(user._id))
                      ?.map((user) => (
                        <span
                          key={user._id}
                          className="badge badge-ghost mr-1 mb-1"
                        >
                          {user.username}
                        </span>
                      ))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {spgList?.data
                      ?.filter((spg) => outlet?.spgList?.includes(spg._id))
                      .map((spg) => (
                        <span
                          key={spg._id}
                          className="badge badge-ghost mr-1 mb-1"
                        >
                          {spg.name}
                        </span>
                      ))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {outlet.namaPerusahaan || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {outlet.alamat || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {outlet.npwp || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {outlet.brandIds?.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {brandList?.data?.data
                          ?.filter((brand) =>
                            outlet.brandIds.includes(brand._id)
                          )
                          ?.map((brand) => (
                            <span
                              key={brand._id}
                              className="badge badge-primary badge-sm truncate text-white"
                            >
                              {brand.name}
                            </span>
                          ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Edit Outlet (flex-1) */}
      {showEditForm && selectedOutlet && (
        <div className="bg-white p-6 flex flex-col flex-1 rounded-lg shadow-md sticky top-4 self-start">
          {" "}
          {/* Added p-6, sticky, top-4, and self-start */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {" "}
            {/* Increased mb to mb-6 */}
            Edit Outlet
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              () => handleEditOutlet(selectedOutlet);
            }}
            className="space-y-4 flex-1 flex flex-col "
          >
            <div className="flex justify-between gap-4 mb-4 sticky top-0 bg-white rounded-md shadow-md p-5">
              {" "}
              {/* Added mb-4 */}
              <button
                type="button"
                className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors shadow-sm" // Consistent rounded-md, added shadow-sm
                onClick={() => setShowEditForm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOutletToDelete(selectedOutlet?._id);
                  document.getElementById("modal_confirmation").showModal();
                }}
                className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors shadow-sm" // Consistent rounded-md, added hover and shadow-sm
              >
                Hapus
              </button>
              <button
                type="submit"
                onClick={() => handleEditOutlet(selectedOutlet)}
                className="bg-primary-content text-white px-6 py-2 rounded-md hover:bg-primary-focus transition-colors shadow-sm" // Consistent rounded-md, added hover and shadow-sm
              >
                Update
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2">
              {" "}
              {/* Added overflow-y-auto and pr-2 for scrollable content */}
              <div>
                <label className="block font-semibold mb-1">Nama Outlet</label>{" "}
                {/* Added mb-1 */}
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" // Added border-gray-300, focus styles
                  placeholder="Masukkan nama outlet"
                  value={selectedOutlet.namaOutlet}
                  onChange={(e) =>
                    setSelectedOutlet((prev) => ({
                      ...prev,
                      namaOutlet: e.target.value,
                    }))
                  }
                />
              </div>
              {/* Deskripsi edit */}
              <div>
                <label className="block font-semibold mb-1">Deskripsi</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Masukkan deskripsi outlet"
                  value={selectedOutlet.description}
                  onChange={(e) =>
                    setSelectedOutlet((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              {/* Nama Perusahaan edit */}
              <div>
                <label className="block font-semibold mb-1">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Masukkan nama perusahaan"
                  value={selectedOutlet.namaPerusahaan}
                  onChange={(e) =>
                    setSelectedOutlet((prev) => ({
                      ...prev,
                      namaPerusahaan: e.target.value,
                    }))
                  }
                />
              </div>
              {/* Alamat edit */}
              <div>
                <label className="block font-semibold mb-1">Alamat</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Masukkan alamat"
                  value={selectedOutlet.alamat}
                  onChange={(e) =>
                    setSelectedOutlet((prev) => ({
                      ...prev,
                      alamat: e.target.value,
                    }))
                  }
                />
              </div>
              {/* NPWP edit */}
              <div>
                <label className="block font-semibold mb-1">NPWP</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Masukkan NPWP"
                  value={selectedOutlet.npwp}
                  onChange={(e) =>
                    setSelectedOutlet((prev) => ({
                      ...prev,
                      npwp: e.target.value,
                    }))
                  }
                />
              </div>
              {/* Periode Settlement edit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                  Periode Settlement (hari)
                  <div
                    className="tooltip tooltip-left"
                    data-tip="Untuk statistik sales_report filter dan settlement, berfungsi sebagai auto berganti shift spg, kasir, settlement outlet, dan lainnya jika 3 hari maka penjualan 3 hari akan digrupkan menjadi 1 periode settlement yang sama, note: bisa diganti kapanpun"
                  >
                    <LucideShieldQuestion className="w-4 h-4" />
                  </div>
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Masukkan periode settlement dalam hari"
                  value={selectedOutlet.periodeSettlement}
                  onChange={(e) =>
                    setSelectedOutlet((prev) => ({
                      ...prev,
                      periodeSettlement: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
              {/* Jam Settlement edit */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                  Jam Settlement
                  <div
                    className="tooltip tooltip-left"
                    data-tip="Jam spesifik untuk field periode settlement, default jam 12 malam"
                  >
                    <LucideShieldQuestion className="w-4 h-4" />
                  </div>
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={selectedOutlet.jamSettlement || "00:00"}
                  onChange={(e) =>
                    setSelectedOutlet((prev) => ({
                      ...prev,
                      jamSettlement: e.target.value,
                    }))
                  }
                />
              </div>
              {/* Brand Terpilih edit */}
              <div>
                <label className="block font-semibold mb-1">
                  Brand terhubung dengan outlet ini
                  <span
                    className="tooltip tooltip-bottom"
                    data-tip="hanya Brand terpilih akan ditampilkan di mobile app, namun jika tidak ada brand terpilih maka akan ditampilkna semuanya sku dari brand manapun"
                  >
                    <LucideShieldQuestion className="w-4 h-4 inline-block ml-1 opacity-70" />
                  </span>
                </label>
                <div className="form-control w-full">
                  <button
                    type="button"
                    className="btn text-primary hover:bg-primary/10 rounded-md px-2 flex items-center gap-1 border border-gray-300 bg-white shadow-sm" // Styled the button
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("modalBrandPick").showModal();
                    }}
                  >
                    <Package className="w-4 h-4" />
                    Tambah Brand
                  </button>
                </div>
              </div>
              {/* Kasir List edit */}
              <div>
                <label className="block font-semibold mb-1">Kasir List</label>
                <div
                  onClick={() =>
                    document.getElementById("pickKasir").showModal()
                  }
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50 cursor-pointer flex items-center min-h-[42px] hover:border-primary transition-colors" // Added border-gray-300 and hover effect
                >
                  {selectedOutlet?.kasirList?.length === 0 && (
                    <span className="text-gray-400">
                      Pilih kasir untuk outlet ini
                    </span>
                  )}
                  {selectedOutlet?.kasirList?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {userList?.data
                        ?.filter((user) =>
                          selectedOutlet?.kasirList?.includes(user._id)
                        )
                        ?.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center bg-primary/10 text-primary rounded px-2 py-1 text-sm" // Smaller text
                          >
                            <span>{user.username}</span>
                            <button
                              type="button"
                              className="ml-2 text-primary hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOutlet((prev) => ({
                                  ...prev,
                                  kasirList: prev.kasirList.filter(
                                    (id) => id !== user._id
                                  ),
                                }));
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      <button
                        type="button"
                        className="text-primary hover:bg-primary/10 rounded px-2 text-sm" // Smaller text
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById("pickKasir").showModal();
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* SPG List edit */}
              <div>
                <label className="block font-semibold mb-1">SPG List</label>
                <div
                  onClick={() => {
                    setSelectedSpgIds(selectedOutlet?.spgList || []);
                    document.getElementById("modalSpgPick").showModal();
                  }}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50 cursor-pointer flex items-center min-h-[42px] hover:border-primary transition-colors" // Added border-gray-300 and hover effect
                >
                  {(!selectedOutlet?.spgList ||
                    selectedOutlet?.spgList?.length === 0) && (
                    <span className="text-gray-400">
                      Pilih SPG untuk outlet ini
                    </span>
                  )}
                  {selectedOutlet?.spgList?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {spgList?.data
                        ?.filter((spg) =>
                          selectedOutlet?.spgList?.includes(spg?._id)
                        )
                        .map((spg) => (
                          <div
                            key={spg?._id}
                            className="flex items-center bg-primary/10 text-primary rounded px-2 py-1 text-sm" // Smaller text
                          >
                            <span>{spg?.name}</span>
                            <button
                              type="button"
                              className="ml-2 text-primary hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOutlet((prev) => ({
                                  ...prev,
                                  spgList: prev.spgList.filter(
                                    (id) => id !== spg._id
                                  ),
                                }));
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      <button
                        type="button"
                        className="text-primary hover:bg-primary/10 rounded px-2 text-sm" // Smaller text
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpgIds(selectedOutlet?.spgList || []);
                          document.getElementById("modalSpgPick").showModal();
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Logo */}
              <div>
                <div className="text-lg font-bold mb-2 gap-x-3 flex items-center">
                  Logo Outlet{" "}
                  <div className="dropdown dropdown-hover">
                    <BadgeHelp />
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 font-mono font-light"
                    >
                      Logo ini akan ditampillkan di struk/invoice bill, dan
                      personalisasi lain yang terkait, mohon pilih ukuran logo
                      yang kecil
                    </ul>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered file-input-primary w-full max-w-xs" // DaisyUI file input
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSelectedOutlet({
                          ...selectedOutlet,
                          logo: reader.result,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {/* Preview Logo */}
                {selectedOutlet?.logo && (
                  <div className="mt-3 flex-col flex">
                    <p className="text-sm font-semibold text-gray-600"></p>
                    <img
                      src={selectedOutlet.logo}
                      alt="Preview Logo"
                      className="mt-2 w-32 h-32 object-contain rounded-lg border shadow-sm p-1 bg-white" // object-contain and p-1
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      <ModalRegisterOutlet
        newOutletForm={newOutletForm}
        setNewOutletForm={setNewOutletForm}
        handleRegisterOutlet={handleRegisterOutlet}
        resetNewOutletForm={resetNewOutletForm}
        brandList={brandList}
        spgList={spgList}
      />
      <ModalPickKasir
        ref={modalPickKasirRef}
        key="kasir"
        callback={beforeHandleSelectKasir}
        currentSelected={
          selectedOutlet
            ? selectedOutlet.kasirList
            : newOutletForm?.kasirList || []
        }
      />
      <ModalConfirmation
        onConfirm={() => handleDeleteOutlet(outletToDelete)}
        onCancel={() => {
          setOutletToDelete(null);
          document.getElementById("modal_confirmation").close();
        }}
        title="Konfirmasi Hapus Outlet"
        message={`Apakah Anda yakin ingin menghapus outlet "${selectedOutlet?.namaOutlet}"? Tindakan ini tidak dapat dibatalkan.`}
      />
      <ModalBrandPick
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
        TambahkanTerpilih={tambahkanTerpilih}
        newOutletForm={newOutletForm}
      />
      <ModalConfirmation2
        onConfirm={() => {
          handleKasirSelection();
          document.getElementById("modal_confirmation2").close();
        }}
        onCancel={() => {
          document.getElementById("modal_confirmation2").close();
          setAmbiguKasir([]);
          setSelectedKasirIds([]);
        }}
        title={"Konfirmasi Pemindahan Kasir"}
        message={`${ambiguKasir.join(
          ", "
        )} sudah terdaftar di outlet lain. Satu kasir hanya dapat ditugaskan ke satu outlet, Apakah anda yakin ingin memindahkan kasir, dan nanti setelah update akan memindahkan kasir ke outlet ini.`}
      />
      <ModalSpgMultiPick
        selectedOutletObj={selectedOutlet}
        selectedSpgIds={
          selectedOutlet ? selectedOutlet.spgList : newOutletForm?.spgList || []
        }
        setSelectedSpgIds={handleSpgSelection}
        key={"modalSpgMultiPick"}
      />
    </div>
  );
};

export default Outlet;
