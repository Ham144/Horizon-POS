import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllinventories,
  updateSingleInventory,
  createSingleInventory,
  updateBulkPrices,
  toggleDisableInventory,
} from "../api/itemLibraryApi";
import toast from "react-hot-toast";
import { getAllBarangPromo, getAllPromoByProduct } from "../api/promoApi";
import { getAllDiskon, getAllDiskonByProduct } from "../api/diskonApi";
import { getAllBrands } from "../api/brandApi";
import { getAllVouchers } from "../api/voucherApi";
import PickPromoDialog from "../components/pickPromoDialog";
import PickDiskonDialog from "../components/pickDiskonDialog";
import PickVoucherDialog from "../components/pickVoucherDialog";
import { useNavigate, useLocation } from "react-router-dom";
import FilterInventories from "../components/filterInventories";
import { useFilter, useUserInfo } from "../store";
import {
  ArrowDown,
  ArrowDownIcon,
  ArrowUp,
  ArrowUpDownIcon,
  ArrowUpIcon,
  BadgeHelp,
  BellRingIcon,
  Binoculars,
  FileWarningIcon,
  InfoIcon,
  LucideShieldCheck,
  Trash2Icon,
} from "lucide-react";
import { getImage, uploadThumbail } from "../api/thumbnailApi";
import StackTraceBySku from "@/components/StackTraceBySku";

const ItemLibrary = () => {
  //router and query hooks
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get searchKey from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const searchFromUrl = searchParams.get("searchKey");

  //inventory states
  const [selectedInventory, setselectedInventory] = useState(null);
  const [newSingleInventory, setNewSingleInventory] = useState(null);
  const [selectedImage, setSelectedImage] = useState();
  const [skuToTrace, setSkuToTrace] = useState(null);

  //promo states
  const [tempPromoTerhubung, setTempPromoTerhubung] = useState([]);
  const [tempPromoTerputus, setTempPromoTerputus] = useState([]);

  //diskon states
  const [tempDiskonTerhubung, setTempDiskonTerhubung] = useState([]);
  const [tempDiskonTerputus, setTempDiskonTerputus] = useState([]);

  //voucher states
  const [tempVoucherTerhubung, setTempVoucherTerhubung] = useState([]);
  const [tempVoucherTerputus, setTempVoucherTerputus] = useState([]);

  const { userInfo } = useUserInfo();

  //zustand
  const { filter, setFilter } = useFilter();

  const { data: myOutlet } = useQuery({
    queryKey: ["outlet", userInfo?._id],
    queryFn: () => getOutletByUserId(userInfo?._id),
    enabled: !!userInfo?._id,
  });

  // Initialize filter with brandIds from outlet
  useEffect(() => {
    if (myOutlet?.data?.brandIds) {
      setFilter({
        ...filter,
        brandIds: myOutlet.data.brandIds,
        page: 1,
        skip: 0,
        limit: 100,
        asc: true,
        searchKey: "",
        startDate: "",
        endDate: "",
      });
    }
  }, [myOutlet?.data?.brandIds]);

  // Menambahkan state untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = filter.limit || 100;
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: "asc",
  });

  // Set initial filter with searchKey from URL if it exists
  useEffect(() => {
    if (searchFromUrl) {
      setFilter({ ...filter, searchKey: searchFromUrl });
    }
  }, [searchFromUrl]);

  // Reset currentPage ketika filter berubah (kecuali perubahan skip)
  useEffect(() => {
    // Jika filter berubah (selain skip dan page, yang berubah karena pagination)
    if (!filter.skip || filter.skip === 0) {
      console.log("Resetting page to 1");
      setCurrentPage(1);
      // Ensure skip is also reset while preserving other filter properties
      setFilter({
        ...filter,
        page: 1,
        skip: 0,
      });
    }
  }, [
    filter.searchKey,
    filter.startDate,
    filter.endDate,
    filter.limit,
    filter.asc,
    filter.brandIds,
  ]);

  const { mutateAsync: handleToggleDisableInventory } = useMutation({
    mutationFn: (id) => toggleDisableInventory(id),
    onSuccess: () => {
      toast.success("berhasil mengubah status inventory");
      queryClient.invalidateQueries(["inventories"]);
      setselectedInventory(null);
    },
    onError: (error) => {
      toast.error("gagal mengubah status inventory");
      console.log("ini error dari tanstack: ", error);
    },
  });

  // When inventory data is loaded and we have a searchKey, select the matching inventory
  const {
    data: inventoryData,
    refetch: refetchInventories,
    isLoading: inventoryLoading,
  } = useQuery({
    queryKey: [
      "inventories",
      {
        ...filter,
        page: currentPage,
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      },
    ],
    queryFn: (filter) => getAllinventories(filter),
  });

  // Extract inventories and pagination info from response
  const inventories = inventoryData?.data || [];

  useEffect(() => {
    function initilizePagination() {
      setTotalItems(inventoryData?.totalItems);
      setTotalPages(inventoryData?.totalPages);
    }

    initilizePagination();
  }, [inventoryData, inventories, itemsPerPage, totalPages]);

  // Handle page change
  const handlePageChange = (newPage) => {
    // Update current page state
    setCurrentPage(newPage);

    // Calculate skip value based on page and itemsPerPage
    const skipValue = (newPage - 1) * itemsPerPage;

    // Update filter dengan skip yang benar dan page
    setFilter({
      ...filter,
      page: newPage,
      skip: skipValue,
    });
  };

  useEffect(() => {
    if (searchFromUrl && inventories) {
      const matchingInventory = inventories.find(
        (inv) => inv.sku === searchFromUrl
      );
      if (matchingInventory) {
        setselectedInventory(matchingInventory);
      }
    }
  }, [inventories, searchFromUrl]);

  //------thumbnail api start---
  const { mutateAsync: handleUploadImage } = useMutation({
    mutationFn: () =>
      uploadThumbail({
        file: selectedImage,
        sku: selectedInventory.sku,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["thumbnail"]);
      setSelectedImage(null);
    },
  });
  const { data: thumbnail } = useQuery({
    queryFn: () => getImage(selectedInventory?._id),
    queryKey: ["thumbnail", selectedInventory?._id],
  });
  //------thumbnail api end---

  const handleItemClick = (item) => {
    setSelectedImage(null);
    setselectedInventory(item);
  };

  const { data: promoList } = useQuery({
    queryFn: getAllBarangPromo,
    queryKey: ["promo"],
  });
  const { data: diskonList } = useQuery({
    queryFn: getAllDiskon,
    queryKey: ["diskon"],
  });
  const { data: brandList } = useQuery({
    queryFn: getAllBrands,
    queryKey: ["brand"],
  });

  const { data: voucherList } = useQuery({
    queryFn: getAllVouchers,
    queryKey: ["voucher"],
  });

  const { data: selectedInventoryPromoList } = useQuery({
    queryFn: () => getAllPromoByProduct(selectedInventory?.sku),
    queryKey: ["promoList", selectedInventory?.sku],
  });

  const { data: selectedInventoryDiskonList } = useQuery({
    queryFn: () => getAllDiskonByProduct(selectedInventory?.sku),
    queryKey: ["diskonList", selectedInventory?.sku],
  });

  const { mutateAsync: handleUpdateInventory } = useMutation({
    mutationFn: async (body) => {
      // Tunggu response dari updateSingleInventory
      const response = await updateSingleInventory(body);
      return response;
    },
    mutationKey: ["inventories"],
    onSuccess: async (response) => {
      // Pastikan response sukses
      if (response) {
        setSelectedImage(null);
        setselectedInventory(null);
        toast.success("berhasil Update");
        // Invalidate dan refetch dengan await
        await queryClient.invalidateQueries(["inventories"]);
        await refetchInventories();
      } else {
        toast.error("Gagal mengupdate: Tidak ada response dari server");
      }
    },
    onError: (error) => {
      toast.error("gagal mengupdate");
      console.log("ini error dari tanstack: ", error);
    },
  });

  const { mutateAsync: handleCreateSingleInventory } = useMutation({
    mutationFn: async (body) => {
      // Tunggu response dari createSingleInventory
      const response = await createSingleInventory(body);
      return response;
    },
    onSuccess: async (response) => {
      // Pastikan response sukses
      if (response) {
        // Invalidate dan refetch dengan await
        await queryClient.invalidateQueries(["inventories"]);
        await refetchInventories();
        toast.success("berhasil register new single inventory");
      } else {
        toast.error("Gagal membuat inventory: Tidak ada response dari server");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const exportCSV = () => {
    const csvRows = [];
    const headers = ["Sku", "Harga Dasar", "Deskripsi", "Brand", "Barcode"];
    csvRows.push(headers.join(";"));

    // Contoh data template (bisa disesuaikan atau dikosongkan)
    const templateData = [
      {
        sku: "SKU001",
        RpHargaDasar: 15000,
        description: "Contoh Deskripsi Produk 1",
        brand: "Contoh Brand A",
        barcodeItem: "CB001",
      },
      {
        sku: "SKU002",
        RpHargaDasar: 30000,
        description: "Contoh Deskripsi Produk 2",
        brand: "Contoh Brand B",
        barcodeItem: "CB002",
      },
      {
        sku: "",
        RpHargaDasar: "",
        description: "",
        brand: "",
        barcodeItem: "",
      },
      // Anda bisa menambahkan lebih banyak baris contoh di sini
    ];

    templateData.forEach((item) => {
      const row = [
        item.sku,
        item.RpHargaDasar,
        item.description,
        item.brand,
        item.barcodeItem,
      ];
      csvRows.push(row.join(";"));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      "contoh_csv_untuk_create_or_update_inventory_tak_menerima_quantity.csv"
    ); // Nama file template yang lebih sesuai
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split("\n");
      const headers = rows[0].split(";");
      const skuIndex = headers.findIndex(
        (h) => h.trim().toLowerCase() === "sku"
      );
      const priceIndex = headers.findIndex(
        (h) => h.trim().toLowerCase() === "harga dasar"
      );

      if (skuIndex === -1 || priceIndex === -1) {
        toast.error("Invalid CSV format. Please use the template.");
        return;
      }

      const updates = rows
        .slice(1)
        .filter((row) => row.trim())
        .map((row) => {
          const columns = row.split(";");
          const priceStr = columns[priceIndex].trim();
          // Remove any existing commas and convert dots to actual decimal points
          const normalizedPrice = priceStr.replace(/,/g, "");
          return {
            sku: columns[skuIndex]?.trim(),
            RpHargaDasar: parseFloat(normalizedPrice || 0),
            description: columns[2]?.trim(),
            brand: columns[3]?.trim(),
            barcodeItem: columns[4]?.trim(),
          };
        })
        .filter((update) => {
          if (!update.sku || isNaN(update.RpHargaDasar)) {
            console.warn(
              `Invalid row skipped: SKU=${update.sku}, Price=${update.RpHargaDasar}`
            );
            return false;
          }
          return true;
        });

      if (updates.length === 0) {
        toast.error("No valid data found in CSV");
        return;
      }

      try {
        const response = await updateBulkPrices(updates);
        if (response.success) {
          toast.success(response?.message);
          queryClient.invalidateQueries(["inventories"]);
        } else {
          toast.error(response.message || "Failed to update prices");
        }
      } catch (error) {
        console.error("Error updating prices:", error);
        toast.error(error.response?.data?.message || "Failed to update prices");
      }
    };
    reader.readAsText(file);
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    if (newSingleInventory) {
      setNewSingleInventory({ ...newSingleInventory, [name]: value });
    } else {
      setselectedInventory({ ...selectedInventory, [name]: value });
    }
  };

  const handleShowValue = () => {
    if (newSingleInventory) {
      return newSingleInventory;
    } else {
      return selectedInventory;
    }
  };

  const handleDirectPromoTerputus = (id) => {
    // Tambahkan ke daftar promo yang akan dihapus
    setselectedInventory((prev) => ({
      ...prev,
      promosToDelete: [...(prev.promosToDelete || []), id],
      // Hapus dari daftar promo yang akan ditambahkan jika ada
      promosToAdd: (prev.promosToAdd || []).filter((promoId) => promoId !== id),
    }));

    // Update UI langsung
    const promoListFound = promoList.data.find((promo) => promo._id === id);
    if (promoListFound) {
      promoListFound.skuList = promoListFound.skuList.filter(
        (sku) => sku !== selectedInventory.sku
      );
    }
  };

  const handleDirectDiskonTerputus = (id) => {
    // Tambahkan ke daftar diskon yang akan dihapus
    setselectedInventory((prev) => ({
      ...prev,
      diskonsToDelete: [...(prev.diskonsToDelete || []), id],
      // Hapus dari daftar diskon yang akan ditambahkan jika ada
      diskonsToAdd: (prev.diskonsToAdd || []).filter(
        (diskonId) => diskonId !== id
      ),
    }));

    // Update UI langsung
    const diskonListFound = diskonList?.data?.data?.find(
      (diskon) => diskon._id === id
    );
    if (diskonListFound) {
      diskonListFound.skuTanpaSyarat = diskonListFound.skuTanpaSyarat.filter(
        (sku) => sku !== selectedInventory.sku
      );
    }
  };

  const handleDirectVoucherTerputus = (id) => {
    // Tambahkan ke daftar voucher yang akan dihapus
    setselectedInventory((prev) => ({
      ...prev,
      vouchersToDelete: [...(prev.vouchersToDelete || []), id],
      // Hapus dari daftar voucher yang akan ditambahkan jika ada
      vouchersToAdd: (prev.vouchersToAdd || []).filter(
        (voucherId) => voucherId !== id
      ),
    }));

    // Update UI langsung
    const voucherListFound = voucherList?.data?.find(
      (voucher) => voucher._id === id
    );
    if (voucherListFound) {
      voucherListFound.skuList = voucherListFound.skuList.filter(
        (sku) => sku !== selectedInventory.sku
      );
    }
  };

  const handleKonfirmasiPromoTerhubung = async () => {
    // Update selectedInventory dengan promo baru
    setselectedInventory((prev) => ({
      ...prev,
      promosToAdd: tempPromoTerhubung,
      promosToDelete: tempPromoTerputus,
    }));

    // Update promoList untuk refleksi UI langsung
    if (promoList?.data) {
      promoList.data = promoList.data.map((promo) => {
        // Jika promo ada di tempPromoTerhubung, tambahkan ke skuList
        if (tempPromoTerhubung?.includes(promo._id)) {
          return {
            ...promo,
            skuList: [...(promo.skuList || []), selectedInventory?.sku],
          };
        }
        // Jika promo ada di tempPromoTerputus, hapus dari skuList
        if (tempPromoTerputus?.includes(promo._id)) {
          return {
            ...promo,
            skuList: (promo.skuList || []).filter(
              (sku) => sku !== selectedInventory?.sku
            ),
          };
        }
        return promo;
      });
    }

    document.getElementById("pickpromo").close();
    setTempPromoTerhubung([]);
    setTempPromoTerputus([]);
  };

  const handleKonfirmasiDiskonTerhubung = async () => {
    // Update selectedInventory dengan diskon baru
    setselectedInventory((prev) => ({
      ...prev,
      diskonsToAdd: tempDiskonTerhubung,
      diskonsToDelete: tempDiskonTerputus,
    }));

    // Update diskonList untuk refleksi UI langsung
    if (diskonList?.data?.data) {
      diskonList.data.data = diskonList.data.data.map((diskon) => {
        // Jika diskon ada di tempDiskonTerhubung, tambahkan ke skuTanpaSyarat
        if (tempDiskonTerhubung?.includes(diskon._id)) {
          return {
            ...diskon,
            skuTanpaSyarat: [
              ...(diskon.skuTanpaSyarat || []),
              selectedInventory?.sku,
            ],
          };
        }
        // Jika diskon ada di tempDiskonTerputus, hapus dari skuTanpaSyarat
        if (tempDiskonTerputus?.includes(diskon._id)) {
          return {
            ...diskon,
            skuTanpaSyarat: (diskon.skuTanpaSyarat || []).filter(
              (sku) => sku !== selectedInventory?.sku
            ),
          };
        }
        return diskon;
      });
    }

    document.getElementById("pickdiskon").close();
    setTempDiskonTerhubung([]);
    setTempDiskonTerputus([]);
  };

  const handleKonfirmasiVoucherTerhubung = async () => {
    // Update selectedInventory dengan voucher baru
    setselectedInventory((prev) => ({
      ...prev,
      vouchersToAdd: tempVoucherTerhubung,
      vouchersToDelete: tempVoucherTerputus,
    }));

    // Update voucherList untuk refleksi UI langsung
    if (voucherList?.data) {
      voucherList.data = voucherList.data.map((voucher) => {
        // Jika voucher ada di tempVoucherTerhubung, tambahkan ke skuList
        if (tempVoucherTerhubung?.includes(voucher._id)) {
          return {
            ...voucher,
            skuList: [...(voucher.skuList || []), selectedInventory?.sku],
          };
        }
        // Jika voucher ada di tempVoucherTerputus, hapus dari skuList
        if (tempVoucherTerputus?.includes(voucher._id)) {
          return {
            ...voucher,
            skuList: (voucher.skuList || []).filter(
              (sku) => sku !== selectedInventory?.sku
            ),
          };
        }
        return voucher;
      });
    }

    // Update UI di form selectedInventory
    const updatedVouchers = voucherList?.data?.filter(
      (voucher) =>
        tempVoucherTerhubung?.includes(voucher._id) ||
        (voucher.skuList?.includes(selectedInventory?.sku) &&
          !tempVoucherTerputus?.includes(voucher._id))
    );

    setselectedInventory((prev) => ({
      ...prev,
      connectedVouchers: updatedVouchers,
    }));

    document.getElementById("pickvoucher").close();
    setTempVoucherTerhubung([]);
    setTempVoucherTerputus([]);
  };

  const generatePaginationNumbers = (
    currentPage,
    totalPages,
    maxVisiblePages = 5
  ) => {
    const pages = [];
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Add first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("..."); // Ellipsis for pages before the current block
      }
    }

    // Add pages around the current page
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("..."); // Ellipsis for pages after the current block
      }
      pages.push(totalPages);
    }

    if (
      pages.length > maxVisiblePages + (pages.includes("...") ? 1 : 0) &&
      totalPages > maxVisiblePages
    ) {
    }

    const uniquePages = [];
    let prevPage = null;
    for (const page of pages) {
      if (page === "..." && prevPage === "...") {
        continue; // Skip consecutive ellipses
      }
      uniquePages.push(page);
      prevPage = page;
    }

    return uniquePages;
  };

  const paginationItems = generatePaginationNumbers(currentPage, totalPages, 5); // Mengatur 5 halaman terlihat

  const sortedInventories = useMemo(() => {
    const sorted = [...inventories];
    if (sortConfig.field !== null) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.field];
        let bValue = b[sortConfig.field];

        // convert decimal string to number for RpHargaDasar
        if (sortConfig.field === "RpHargaDasar") {
          aValue = parseFloat(aValue?.["$numberDecimal"] || 0);
          bValue = parseFloat(bValue?.["$numberDecimal"] || 0);
        }

        // normalize string
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [inventories, sortConfig]);

  const requestSort = (field) => {
    let direction = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ field, direction });
  };

  return (
    <div
      className={`${
        selectedInventory || newSingleInventory
          ? "grid grid-cols-4 gap-3"
          : "flex"
      } min-h-screen bg-gray-100`}
    >
      <div
        className={`${
          selectedInventory || newSingleInventory ? "col-span-3" : "w-full"
        }`}
      >
        <div className="dropdown dropdown-end w-full">
          <label
            tabIndex={0}
            className="btn m-1 btn-ghost btn-circle hover:bg-gray-100 transition-colors duration-200"
            aria-label="Notifications"
          >
            <div className="relative">
              <BellRingIcon className="w-6 h-6 text-gray-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </div>
          </label>
          <ul className="dropdown-content z-40 menu p-4 shadow-lg bg-white rounded-xl w-full mt-2 border border-gray-100 transform transition-all duration-300 ease-in-out">
            <li>
              <div
                role="alert"
                className="alert alert-warning flex items-start gap-3 p-3 rounded-lg mb-3 hover:bg-amber-50 transition-colors"
              >
                <FileWarningIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">
                  Jika terdapat Brand maka sku yang terkait brand tersebut saja
                  yang ditampilkan disini, hilang kan filter brand untuk melihat
                  semua
                </span>
              </div>
            </li>
            <li>
              <div
                role="alert"
                className="alert alert-info flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <span className="text-sm text-gray-700">
                  Di mobile, barang tidak memiliki harga pun sekarang akan tetap
                  muncul, karena user biasanya membuat barang bonus RP.0
                  sehingga, untuk tetap memunculkannya dalam pencarian maka
                  barang barang Rp.0 pun akan didownload juga ke mobile
                </span>
              </div>
            </li>
          </ul>
        </div>
        <div className="px-4 py-3 flex lg:justify-between justify-center items-center flex-wrap gap-y-2 ">
          <div className="flex lg:w-full max-lg:w-full z-20">
            <FilterInventories
              onChange={(value) => {
                setFilter({ ...filter, searchKey: value.searchKey });
              }}
            />
          </div>
          <div className="flex flex-1  gap-x-2 flex-wrap gap-3 justify-end">
            <button className="btn btn-sm text-sm">Total: {totalItems}</button>
            <button
              className="btn btn-sm btn-primary text-white"
              onClick={() => {
                setselectedInventory(null);
                setNewSingleInventory(null);
                setTimeout(() => {
                  setNewSingleInventory({});
                }, 400);
              }}
            >
              <span style={{ fontSize: "1em" }}>➕</span> Tambah Item
            </button>
            <div className="dropdown dropdown-hover">
              <label tabIndex={0} className="btn btn-sm">
                <span style={{ fontSize: "1em" }}>📤</span> Import / Export
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-white rounded-box w-52 border border-gray-200"
              >
                <li>
                  <label className="cursor-pointer text-sm text-gray-700 hover:bg-gray-100 rounded-md p-2">
                    Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVUpload}
                      onClick={(e) => (e.target.value = null)}
                    />
                  </label>
                </li>
                <li>
                  <a
                    onClick={() => exportCSV(inventories)}
                    className="text-sm text-gray-700 hover:bg-gray-100 rounded-md p-2"
                  >
                    Export CSV Template
                  </a>
                </li>
              </ul>
            </div>
            <button className="btn btn-sm" onClick={refetchInventories}>
              <span style={{ fontSize: "1em" }}>🔄</span> Refresh
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1">
          <div className="badge badge-primary text-white rounded-md mb-2">
            Klik 2 klik untuk mengedit
          </div>
          <table className="table ">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="border-b border-gray-200">
                {/* SKU Column */}
                <th
                  onClick={() => requestSort("sku")}
                  className="py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>SKU</span>
                    <div>
                      {sortConfig.field === "sku" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUp className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </th>

                {/* Description Column */}
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                  Deskripsi
                </th>

                {/* Barcode Column */}
                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                  Barcode
                </th>

                {/* Quantity Column */}
                <th
                  onClick={() => requestSort("quantity")}
                  className="py-3 px-4 text-sm font-semibold text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Qty</span>
                    <div>
                      {sortConfig.field === "quantity" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </th>

                {/* Sold Column */}
                <th
                  onClick={() => requestSort("terjual")}
                  className="py-3 px-4 text-sm font-semibold text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Terjual</span>
                    <div>
                      {sortConfig.field === "terjual" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </th>

                {/* Status Column */}
                <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-center">
                  Status
                </th>

                {/* Base Price Column */}
                <th
                  onClick={() => requestSort("RpHargaDasar")}
                  className="py-3 px-4 text-sm font-semibold text-gray-700 text-right cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Harga Dasar</span>
                    <div>
                      {sortConfig.field === "RpHargaDasar" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </th>

                {/* Brand Column */}
                <th
                  onClick={() => requestSort("brand")}
                  className="py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>Brand</span>
                    <div>
                      {sortConfig.field === "brand" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="w-4 h-4 text-blue-500" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 text-blue-500" />
                        )
                      ) : (
                        <ArrowUpDownIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </th>

                {/* Promo Column */}
                <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-center">
                  Promo
                </th>

                {/* Discount Column */}
                <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-center">
                  Diskon
                </th>
              </tr>
            </thead>

            {sortedInventories?.length ? (
              <tbody className="overflow-x-auto ">
                {sortedInventories?.map((item, index) => (
                  <tr
                    key={index}
                    className="cursor-pointer hover:bg-gray-100 transition-colors text-sm text-gray-700"
                    onDoubleClick={() => {
                      handleItemClick(item);
                      setSkuToTrace(null);
                    }}
                  >
                    <td className="py-3 px-4">
                      <div
                        onClick={() => {
                          setSkuToTrace(item.sku);
                          document
                            .getElementById("stack-trace-single-sku")
                            .showModal();
                        }}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="tooltip tooltip-right"
                          data-tip="Stack trace item ini"
                        >
                          <Binoculars
                            size={20}
                            className="text-gray-500 hover:text-blue-500 transition-colors"
                          />
                        </div>
                        <span className="font-medium text-gray-800">
                          {item.sku}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">{item.description}</td>
                    <td className="py-2 px-3">{item.barcodeItem}</td>
                    <td className="py-2 px-3 text-center">{item?.quantity}</td>
                    <td className="py-2 px-3 text-center">
                      {item.terjual || 0}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.isDisabled ? (
                        <span className="text-red-500">🔴</span>
                      ) : (
                        <span className="text-green-500">🟢</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(item.RpHargaDasar?.$numberDecimal)}
                    </td>
                    <td className="py-2 px-3">{item.brand}</td>

                    <td className="py-2 px-3 text-center">
                      {promoList?.data.find((pro) =>
                        pro.skuList?.includes(item.sku)
                      ) ? (
                        <span className="text-green-500">🟢</span>
                      ) : (
                        <span className="text-red-500">🔴</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {diskonList?.data?.data.find((dis) =>
                        dis.skuTanpaSyarat?.includes(item?.sku)
                      ) ? (
                        <span className="text-green-500">🟢</span>
                      ) : (
                        <span className="text-red-500">🔴</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={9} className="text-center py-6">
                    <div className="alert alert-warning">
                      <span style={{ fontSize: "1em" }}>⚠️</span>
                      <span>Peringatan: Tidak ada data.</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>

          {/* Loading indicator */}
          {inventoryLoading && (
            <div className="flex justify-center my-4">
              <span className="loading loading-spinner loading-lg text-blue-700"></span>
            </div>
          )}
        </div>

        {totalPages >= 1 && (
          <div className="flex justify-center py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
            <div className="join">
              <div className="join">
                {/* Tombol Previous */}
                <button
                  className="join-item btn btn-sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  «
                </button>

                {/* Pagination numbers */}
                {paginationItems.map((item, index) => {
                  if (item === "...") {
                    return (
                      <button
                        key={`ellipsis-${index}`} // Key unik untuk ellipsis
                        className="join-item btn btn-sm btn-disabled"
                      >
                        ...
                      </button>
                    );
                  }
                  return (
                    <button
                      key={item} // Page number is unique, use it as key
                      className={`join-item btn btn-sm ${
                        item === currentPage
                          ? "btn-active bg-blue-700 text-white" // Gunakan btn-active DaisyUI
                          : "btn-ghost"
                      }`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  );
                })}

                {/* Tombol Next */}
                <button
                  className="join-item btn btn-sm"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: General Information */}
      {(selectedInventory || newSingleInventory) && (
        <div className="col-span-1">
          <div className="sticky top-0 z-10 bg-white p-4 text-xl font-bold border-b border-gray-300 h-[900px] ">
            <h2 className="  font-light">General Information</h2>{" "}
            <div className="flex  justify-between items-center ">
              <div className="flex max-lg:flex-col flex-wrap gap-2 justify-center w-full pb-3">
                <button
                  type="button"
                  className="flex items-center px-4 py-2 border rounded text-red-600 hover:text-red-900 hover:border-red-900 focus:outline-none transition-colors flex-1 duration-300 ease-in-out"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Disabled Produk ini? Produk tidak akan bisa dijual dan tidak tampil di mobile"
                      )
                    ) {
                      handleToggleDisableInventory(selectedInventory._id);
                    }
                  }}
                >
                  {selectedInventory?.isDisabled ? (
                    <LucideShieldCheck className="w-5 h-5 mr-2" />
                  ) : (
                    <Trash2Icon className="w-5 h-5 mr-2" />
                  )}
                  {selectedInventory?.isDisabled ? "Enable" : "Disable"}
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center px-4 py-2 border rounded text-gray-600 hover:text-gray-900 hover:border-gray-900 focus:outline-none transition-colors duration-300 ease-in-out"
                  onClick={() => {
                    setselectedInventory(null);
                    setNewSingleInventory(null);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
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
                  className="flex flex-1 items-center px-4 py-2 border rounded text-green-600 hover:text-green-900 hover:border-green-900 focus:outline-none transition-colors duration-300 ease-in-out"
                  onClick={async () => {
                    if (newSingleInventory) {
                      handleCreateSingleInventory(newSingleInventory);
                    } else {
                      if (selectedImage) {
                        try {
                          await handleUploadImage();
                          await handleUpdateInventory(selectedInventory);
                          toast.success("");
                        } catch (err) {
                          toast.error("gagal");
                        }
                      } else {
                        handleUpdateInventory(selectedInventory);
                      }
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
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
                  {newSingleInventory ? "Register" : "Update"}{" "}
                </button>
              </div>
            </div>
            <div className=" overflow-y-auto h-[90%] flex flex-col gap-y-3">
              {newSingleInventory && (
                <div className="">
                  <label className="block text-sm font-bold mb-2">sku</label>
                  <input
                    type="text"
                    value={handleShowValue().sku}
                    className="w-full p-2 border rounded"
                    name="sku"
                    onChange={(e) => handleOnChange(e)}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-2">
                  Description (Nama produk)
                </label>
                <input
                  type="text"
                  value={handleShowValue().description}
                  className="w-full p-2 border rounded"
                  name="description"
                  onChange={(e) => handleOnChange(e)}
                />
              </div>
              <div className="">
                <label className="block text-sm font-bold mb-2">Quantity</label>
                <input
                  type="text"
                  name="quantity"
                  value={handleShowValue().quantity}
                  onChange={(e) => handleOnChange(e)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="">
                <label className="block text-sm font-bold mb-2">
                  Barcode Item
                </label>
                <input
                  type="text"
                  name="barcodeItem"
                  value={handleShowValue().barcodeItem}
                  onChange={(e) => handleOnChange(e)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="">
                <label className="block text-sm font-bold mb-2">Brand</label>
                <select
                  className="w-full p-2 border rounded"
                  name="brand"
                  onChange={(e) => {
                    handleOnChange(e);
                  }}
                >
                  <option selected>{handleShowValue().brand}</option>
                  {brandList?.data?.data?.map((b) => (
                    <option key={b._id} value={b.name}>
                      {b?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="">
                <label className="block text-sm font-bold mb-2">
                  Harga Dasar
                </label>
                <input
                  type="text"
                  name="RpHargaDasar"
                  value={handleShowValue()?.RpHargaDasar?.$numberDecimal}
                  onChange={(e) => handleOnChange(e)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Promo */}
              <div className="flex flex-col p-3 gap-y-2 border rounded">
                <div className="text-lg font-bold mb-2 gap-x-3 flex items-center justify-between">
                  Implementasi Promo{" "}
                  <div className="dropdown dropdown-hover">
                    <BadgeHelp />
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 font-mono font-light"
                    >
                      Jika beberapa aturan (logic) PROMO terpenuhi maka akan
                      diterapkan yang paling menguntungkan untuk customer
                    </ul>
                  </div>
                  <span className={`text-sm  font-light`}>
                    <span
                      className="text-blue-600 cursor-pointer"
                      onClick={() => navigate("/promo")}
                    >
                      {" "}
                      atau ke promo page{" "}
                    </span>{" "}
                  </span>
                </div>
                <div className="form-control px-2">
                  {!promoList?.data?.length ? (
                    <p className="text-sm">
                      Belum Ada Promo Tersedia{" "}
                      <span className={`font-semibold`}>Buat Promo</span>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {promoList?.data.map(
                        (promo) =>
                          (promo.skuList.includes(handleShowValue().sku) ||
                            tempPromoTerhubung?.includes(promo._id)) && (
                            <span
                              key={promo._id}
                              className="bg-blue-200 text-blue-800 px-3 py-1 rounded flex items-center gap-2"
                            >
                              {promo?.judulPromo}
                              <button
                                onClick={() => {
                                  handleDirectPromoTerputus(promo._id);
                                }}
                                className="bg-red-500 text-white rounded-full px-2 text-sm"
                              >
                                x
                              </button>
                            </span>
                          )
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 ">
                    <button
                      onClick={() => {
                        document.getElementById("pickpromo").showModal();
                        setTempPromoTerhubung(
                          selectedInventoryPromoList?.data?.data.map(
                            (item) => item._id
                          )
                        );
                      }}
                      className="px-4 py-2 bg-blue-500 flex-1 text-white rounded"
                    >
                      Atur Ulang Promo Terhubung
                    </button>
                  </div>
                </div>
              </div>

              {/* Diskon */}
              <div className="flex flex-col p-3 gap-y-2 border rounded">
                <div className="text-lg font-bold mb-2 flex items-center justify-between gap-x-3">
                  Implementasi Diskon{" "}
                  <div className="dropdown dropdown-hover">
                    <BadgeHelp />
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 font-mono font-light"
                    >
                      Jika beberapa aturan (logic) diskon terpenuhi maka akan
                      diterapkan yang paling menguntungkan untuk customer
                    </ul>
                  </div>
                  <span className={`text-sm font-light`}>
                    <span
                      className="text-blue-600 cursor-pointer"
                      onClick={() => navigate("/diskon")}
                    >
                      {" "}
                      atau ke diskon page{" "}
                    </span>{" "}
                  </span>
                </div>
                <div className="form-control px-2">
                  {!diskonList?.data?.data?.length ? (
                    <p className="text-sm">
                      Belum Ada Diskon Tersedia{" "}
                      <span className={`font-semibold`}>Buat Diskon</span>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {diskonList?.data?.data?.map(
                        (diskon) =>
                          (diskon.skuTanpaSyarat.includes(
                            handleShowValue().sku
                          ) ||
                            tempDiskonTerhubung?.includes(diskon._id)) && (
                            <span
                              key={diskon._id}
                              className="bg-blue-200 text-blue-800 px-3 py-1 rounded flex items-center gap-2"
                            >
                              {diskon?.judulDiskon}
                              <button
                                onClick={() => {
                                  handleDirectDiskonTerputus(diskon._id);
                                }}
                                className="bg-red-500 text-white rounded-full px-2 text-sm"
                              >
                                x
                              </button>
                            </span>
                          )
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        document.getElementById("pickdiskon").showModal();
                        setTempDiskonTerhubung(
                          selectedInventoryDiskonList?.data?.data.map(
                            (item) => item._id
                          )
                        );
                      }}
                      className="px-4 py-2 bg-blue-500 flex-1 text-white rounded"
                    >
                      Atur Ulang Diskon Terhubung
                    </button>
                  </div>
                </div>
              </div>

              {/* Voucher */}
              {/* <div className="flex flex-col p-3 gap-y-2 border rounded">
                <div className="text-lg flex-col font-bold mb-2">
                  <div className="text-lg font-bold mb-2 flex items-center justify-between gap-x-3">
                    Implementasi Voucher{" "}
                    <div className="dropdown dropdown-hover">
                      <BadgeHelp />
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 font-mono font-light"
                      >
                        <li>
                          Jika beberapa aturan (logic) voucher terpenuhi maka
                          akan diterapkan yang paling menguntungkan untuk
                          customer
                        </li>
                      </ul>
                    </div>
                    <span className={`text-sm  font-light`}>
                      <span
                        className="text-blue-600 cursor-pointer"
                        onClick={() => navigate("/voucher")}
                      >
                        atau ke voucher page
                      </span>
                    </span>
                  </div>
                </div>
                <div className="form-control px-2">
                  {!voucherList?.data?.length ? (
                    <p className="text-sm">
                      Belum Ada Voucher Tersedia{" "}
                      <span
                        className={`font-semibold text-blue-400 cursor-pointer`}
                        onClick={() => navigate("/diskon")}
                      >
                        Buat Voucher?
                      </span>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {voucherList?.data?.map(
                        (voucher) =>
                          (voucher.skuList?.includes(handleShowValue().sku) ||
                            tempVoucherTerhubung?.includes(voucher._id)) &&
                          !tempVoucherTerputus?.includes(voucher._id) && (
                            <span
                              key={voucher._id}
                              className="bg-blue-200 text-blue-800 px-3 py-1 rounded flex items-center gap-2"
                            >
                              {voucher?.judulVoucher}
                              <button
                                onClick={() => {
                                  handleDirectVoucherTerputus(voucher._id);
                                }}
                                className="bg-red-500 text-white rounded-full px-2 text-sm"
                              >
                                x
                              </button>
                            </span>
                          )
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      document.getElementById("pickvoucher").showModal();
                      setTempVoucherTerhubung(
                        selectedInventoryVoucherList?.data?.data.map(
                          (item) => item._id
                        )
                      );
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Atur Ulang Voucher Terhubung
                  </button>
                </div>
              </div> */}

              <div className="mb-4">
                <label className=" flex items-center gap-x-2 text-sm font-bold mb-2">
                  <p>Status</p>
                  {selectedInventory?.isDisabled ? "(Tidak Aktif)" : "(Aktif)"}
                  <div className="dropdown dropdown-hover">
                    <BadgeHelp />
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 font-mono font-light"
                    >
                      Jika Barang Disabled, tidak akan bisa terjual di aplikasi
                      mobile
                    </ul>
                  </div>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setselectedInventory((prev) => ({
                        ...prev,
                        isDisabled: true,
                      }));
                    }}
                    className={`px-4 py-2 rounded ${
                      selectedInventory?.isDisabled
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                  >
                    Disable
                  </button>
                  <button
                    onClick={() => {
                      setselectedInventory((prev) => ({
                        ...prev,
                        isDisabled: false,
                      }));
                    }}
                    className={`px-4 py-2 rounded ${
                      !selectedInventory?.isDisabled
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  >
                    Enable
                  </button>
                </div>
                {/* Thumbanail */}
                <div className="flex flex-col items-center p-6 bg-white rounded-lg gap-x-2 shadow-md">
                  <h2 className="font-light text-center mb-4">
                    Thumbnail section
                  </h2>
                  <div className="flex justify-center">
                    <div className="overflow-hidden rounded-md shadow-lg">
                      <img
                        alt="Inventory Preview"
                        src={
                          selectedImage
                            ? URL.createObjectURL(selectedImage)
                            : thumbnail?.data?.base64
                        }
                        width={300}
                        height={300}
                      />
                    </div>
                  </div>
                  <div className="w-full max-w-xs mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const img = e.target.files[0];
                        setSelectedImage(img);
                      }}
                      className="file-input w-full bg-gray-100 text-gray-800 border-2 border-gray-300 rounded-md p-2 transition-all hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PickPromoDialog
        promoList={promoList?.data}
        selectedInventory={selectedInventory}
        tempPromoTerhubung={tempPromoTerhubung}
        setTempPromoTerhubung={setTempPromoTerhubung}
        setTempPromoTerputus={setTempPromoTerputus}
        tempPromoTerputus={tempPromoTerputus}
        handleKonfirmasiPromoTerhubung={handleKonfirmasiPromoTerhubung}
        key={"pickpromo"}
      />

      <PickDiskonDialog
        diskonList={diskonList?.data?.data}
        selectedInventory={selectedInventory}
        tempDiskonTerhubung={tempDiskonTerhubung}
        setTempDiskonTerhubung={setTempDiskonTerhubung}
        setTempPromoTerputus={setTempDiskonTerputus}
        handleKonfirmasiDiskonTerhubung={handleKonfirmasiDiskonTerhubung}
        setTempDiskonTerputus={setTempDiskonTerputus}
        key={"pickdiskon"}
      />

      <PickVoucherDialog
        tempVoucherTerhubung={tempVoucherTerhubung}
        tempVoucherTerputus={tempVoucherTerputus}
        setTempVoucherTerhubung={setTempVoucherTerhubung}
        setTempVoucherTerputus={setTempVoucherTerputus}
        handleKonfirmasiVoucherTerhubung={handleKonfirmasiVoucherTerhubung}
        voucherList={voucherList?.data}
        selectedInventory={selectedInventory}
        key={"pickvoucher"}
      />
      <StackTraceBySku skuToTrace={skuToTrace} />
    </div>
  );
};

export default ItemLibrary;
