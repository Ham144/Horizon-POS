import React, { useEffect, useState, useRef, useCallback } from "react";
import { Delete, Info, Package } from "lucide-react";
import { useFilter, useUserInfo } from "../store";
import { useQuery } from "@tanstack/react-query";
import { getOuletByUserId } from "../api/outletApi";
import ModalFilterByBrand from "./ModalFilterByBrand";
import { getAllBrands } from "@/api/brandApi";

// Style untuk efek shimmer
const shimmerAnimationStyle = `
  @keyframes shimmer {
    0% {
      transform: translateX(-150%);
    }
    50% {
      transform: translateX(150%);
    }
    100% {
      transform: translateX(150%);
    }
  }
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
  
  .shimmer-effect {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.6) 50%,
      rgba(255,255,255,0) 100%
    );
    box-shadow: 0 0 10px 10px rgba(255,255,255,0.3);
    height: 100%;
    width: 60%;
  }
`;

const FilterInventories = ({ onChange }) => {
  const { userInfo } = useUserInfo();

  const { setFilter: setFilterZustand } = useFilter();

  //tanstack
  const { data: myOutlet } = useQuery({
    queryKey: ["outlet", userInfo?._id],
    queryFn: () => getOuletByUserId(userInfo?._id),
    enabled: !!userInfo?._id,
  });

  const { data: brandList } = useQuery({
    queryKey: ["brand"],
    queryFn: () => getAllBrands(),
  });

  const initialFilter = {
    startDate: "",
    endDate: "",
    limit: 100,
    skip: 0,
    asc: true,
    searchKey: "",
    page: 1,
    brandIds: myOutlet?.data?.brandIds || [],
    requiredQuantity: false,
    requiredRpHargaDasar: false,
    requiredBarcodeItem: false,
  };

  const [filter, setFilter] = useState(initialFilter);
  const [expanded, setExpanded] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false); // Track debouncing state
  const formRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced function for searchKey updates
  const debouncedUpdateFilter = useCallback(
    (updatedFilter) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set debouncing state to true to show the loading animation
      setIsDebouncing(true);

      debounceTimerRef.current = setTimeout(() => {
        setFilter(updatedFilter);
        if (onChange) onChange(updatedFilter);
        // Reset debouncing state after updating the filter
        setIsDebouncing(false);
      }, 500); // 500ms debounce delay
    },
    [onChange, setFilter]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    const updatedFilter = {
      ...filter,
      [name]: newValue,
    };

    setFilter(updatedFilter);

    // If it's a search input, use debounced update
    if (name === "searchKey") {
      debouncedUpdateFilter(updatedFilter);
    }
  };

  const handleConfirmBrandFilter = (temporarySelected) => {
    setFilter({
      ...filter,
      brandIds: temporarySelected,
    });
    if (onChange) onChange(updatedFilter);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    // Hentikan debouncing yang sedang berjalan jika ada
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      setIsDebouncing(false);
    }

    // Reset page dan skip saat filter berubah
    const updatedFilter = {
      ...filter,
      page: 1,
      skip: 0,
    };
    setFilter(updatedFilter);
    if (onChange) onChange(updatedFilter);
  };

  const handleResetSearch = () => {
    // Hentikan debouncing yang sedang berjalan jika ada
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      setIsDebouncing(false);
    }

    const resetState = { ...filter, searchKey: "" };
    setFilter(resetState);
    if (onChange) onChange(resetState);
  };

  const handleResetFilter = () => {
    // Hentikan debouncing yang sedang berjalan jika ada
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      setIsDebouncing(false);
    }

    const resetState = {
      ...initialFilter,
      page: 1,
      skip: 0,
    };
    setFilter(resetState);
    setExpanded(false);
  };

  useEffect(() => {
    setFilter({
      ...filter,
      brandIds: myOutlet?.data?.brandIds || [],
    });
  }, [myOutlet]);

  return (
    <form className="w-full  overflow-y-auto  " onSubmit={handleSubmit}>
      {/* Style untuk animasi shimmer */}
      <style dangerouslySetInnerHTML={{ __html: shimmerAnimationStyle }} />

      {/* Search Input Field */}
      <div className="flex  flex-col gap-2 items-center   ">
        <div className="flex rounded-md  border-2 w-full">
          <input
            type="text"
            name="searchKey"
            value={filter.searchKey}
            onSubmit={handleSubmit}
            onChange={handleChange}
            placeholder="Cari SKU atau description"
            className="flex-1 relative px-4 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Efek shimmer hanya ditampilkan saat debouncing */}
          {isDebouncing && (
            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-0">
              <div className="animate-shimmer shimmer-effect absolute h-full"></div>
            </div>
          )}

          <button
            className={`flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white text-sm font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 ${
              filter.searchKey === "" ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleResetSearch}
            type="button"
            disabled={filter.searchKey === ""}
          >
            <Delete className="h-4 w-4" />
          </button>

          <button
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white text-sm font-semibold hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={handleSubmit}
            type="submit"
          >
            {isDebouncing ? (
              <div className="animate-spin h-4 w-4 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          type="button"
          className=" py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold w-full hover:bg-gray-300"
        >
          {expanded ? "Filter" : "Filter"}
        </button>
      </div>

      {/* Expandable Form */}
      {expanded && (
        <div
          ref={formRef}
          className="space-y-4 p-4 bg-white rounded-lg shadow-md fixed max-md:w-full w-[30rem] h-[90vh] pb-32 overflow-y-auto z-30"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col">
            <label
              htmlFor="startDate"
              className="font-semibold text-gray-700 mb-2 text-sm"
            >
              Tanggal terupdate awal:
            </label>
            <input
              id="startDate"
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-secondary"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="endDate"
              className="font-semibold text-gray-700 mb-2 text-sm"
            >
              Tanggal terupdate akhir:
            </label>
            <input
              id="endDate"
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-secondary"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="limit"
              className="font-semibold text-gray-700 mb-2 text-sm"
            >
              Limit:
            </label>
            <input
              id="limit"
              type="number"
              name="limit"
              value={filter.limit}
              min="1"
              onChange={handleChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-secondary"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="limit"
              className="font-semibold text-gray-700 mb-2 text-sm"
            >
              My outlet : {myOutlet?.data?.namaOutlet || "Loading..."}
            </label>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Brand</span>
                <div
                  className="tooltip tooltip-left"
                  data-tip="Brand ini terpasang ke outlet anda, dan item library terkait brand itu saja yang ditampilkan, jika ingin mendapatkan semua item library, hilangkan filter brand"
                >
                  <button className="btn btn-sm btn-circle btn-ghost">
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </label>
              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-lg">
                {brandList?.data?.data
                  ?.filter((brand) => filter?.brandIds?.includes(brand._id))
                  .map((brand) => (
                    <div
                      key={brand._id}
                      className="flex items-center bg-primary/10 text-primary rounded px-2 py-1"
                    >
                      <span>{brand.name}</span>
                      <button
                        type="button"
                        className="ml-2 text-primary hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilter((prev) => ({
                            ...prev,
                            brandIds: prev.brandIds.filter(
                              (id) => id !== brand._id
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
                  className="text-primary hover:bg-primary/10 rounded px-2 flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("modalFilterByBrand")?.showModal();
                  }}
                >
                  <Package className="w-4 h-4" />
                  Tambah Brand
                </button>
              </div>
            </div>
          </div>

          {/* Filter boolean  */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-white rounded-md shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text font-semibold text-gray-800 text-sm">
                    Urutan Ascending (terupdate terbaru)
                  </span>
                  <input
                    id="asc"
                    type="checkbox"
                    name="asc"
                    checked={filter.asc}
                    onChange={handleChange}
                    className="checkbox checkbox-primary ml-2"
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text font-semibold text-gray-800 text-sm">
                    Hanya memiliki kuantitas
                  </span>
                  <input
                    id="requiredQuantity"
                    type="checkbox"
                    name="requiredQuantity"
                    checked={filter.requiredQuantity}
                    onChange={handleChange}
                    className="checkbox checkbox-primary ml-2"
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text font-semibold text-gray-800 text-sm">
                    Hanya memiliki harga dasar
                  </span>
                  <input
                    id="requiredRpHargaDasar"
                    type="checkbox"
                    name="requiredRpHargaDasar"
                    checked={filter.requiredRpHargaDasar}
                    onChange={handleChange}
                    className="checkbox checkbox-primary ml-2"
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text font-semibold text-gray-800 text-sm">
                    Hanya memiliki barcode
                  </span>
                  <input
                    id="requiredBarcodeItem"
                    type="checkbox"
                    name="requiredBarcodeItem"
                    checked={filter.requiredBarcodeItem}
                    onChange={handleChange}
                    className="checkbox checkbox-primary ml-2"
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => {
              // Bersihkan timer debounce jika ada
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                setIsDebouncing(false);
              }

              setTimeout(() => {
                setExpanded(false);
              }, 0);
              setFilterZustand(filter);
            }}
          >
            Apply Filter
          </button>
          <button
            type="button"
            className="w-full py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => {
              // Bersihkan timer debounce jika ada
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                setIsDebouncing(false);
              }

              setTimeout(() => {
                setExpanded(false);
              }, 0);
              handleResetFilter();
            }}
          >
            Reset Filter
          </button>
          <button
            className="btn btn-sm  w-full rounded-lg bg-secondary text-center"
            onClick={() => setExpanded(false)}
          >
            Close
          </button>
        </div>
      )}
      <ModalFilterByBrand
        onConfirm={handleConfirmBrandFilter}
        selectedBrand={myOutlet?.data?.brandIds}
      />
    </form>
  );
};

export default FilterInventories;
