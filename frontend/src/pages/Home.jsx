import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";
import MenuNavigation from "../components/MenuNavigation";
import { mockPages } from "../api/constant";
import {
	BarChart,
	Box,
	Gift,
	Percent,
	Presentation,
	Search,
	ShoppingCart,
	Store,
	User2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

// Lazy load components
const DashboardPreview = lazy(() => import("../components/DashboardPreview"));
const QuickAccessCards = lazy(() => import("../components/QuickAccessCards"));
const ToolsAndResources = lazy(() => import("../components/ToolsAndResources"));

const Home = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

	// Kelompokkan halaman berdasarkan kategori
	const pageCategories = useMemo(
		() => ({
			penjualan: [
				"/invoices",
				"/sales_report",
				"/kwitansi_pembayaran_tertunda",
				"/payment_method",
			],
			inventori: [
				"/item_library",
				"/summary",
				"/brands",
				"/purchase_order_create",
				"/purchase_order_receive",
			],
			promosi: ["/promo", "/diskon", "/voucher"],
			pengguna: ["/all_account", "/kasir_list", "/spg_list", "/profile"],
			outlet: ["/outlet_list", "/dashboard"],
			lainnya: [
				"/ui",
				"/artikel_documentation",
				"/help",
				"/database",
				"/customer_list",
			],
		}),
		[]
	);

	// Halaman populer yang sering diakses pengguna
	const popularPages = useMemo(
		() => [
			"/invoices",
			"/item_library",
			"/dashboard",
			"/promo",
			"/diskon",
			"/sales_report",
		],
		[]
	);

	// Mendapatkan detail halaman dari path
	const getPageDetails = useCallback((path) => {
		return mockPages.find((page) => page.originalPath === path);
	}, []);

	// Mendapatkan halaman populer dengan detail
	const getPopularPagesWithDetails = useCallback(() => {
		return popularPages.map((path) => getPageDetails(path)).filter(Boolean);
	}, [popularPages, getPageDetails]);

	const handleSearch = useCallback((query) => {
		setSearchQuery(query);
		setSelectedResultIndex(-1);

		if (query.trim() === "") {
			setSearchResults([]);
			return;
		}

		const filteredPages = mockPages.filter(
			(page) =>
				page.originalPath.toLowerCase().includes(query.toLowerCase()) ||
				page.description.toLowerCase().includes(query.toLowerCase())
		);

		setSearchResults(filteredPages);
	}, []);

	const navigateToPage = useCallback((path) => {
		window.location.href = path;
	}, []);

	const handleKeyDown = useCallback(
		(e) => {
			if (!searchResults.length) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedResultIndex((prev) =>
					prev < searchResults.length - 1 ? prev + 1 : prev
				);
			}

			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : prev));
			}

			if (e.key === "Enter" && selectedResultIndex >= 0) {
				e.preventDefault();
				navigateToPage(searchResults[selectedResultIndex].originalPath);
			}
		},
		[searchResults, selectedResultIndex, navigateToPage]
	);

	// Mendapatkan label kategori dalam bahasa Indonesia
	const getCategoryLabel = useCallback((category) => {
		const labels = {
			penjualan: "Penjualan",
			inventori: "Inventori",
			promosi: "Promosi",
			pengguna: "Pengguna",
			outlet: "Outlet",
			lainnya: "Lainnya",
		};
		return labels[category] || category;
	}, []);

	// Mendapatkan warna untuk kategori
	const getCategoryColor = useCallback((category) => {
		const colors = {
			penjualan: "bg-blue-100 text-blue-800",
			inventori: "bg-green-100 text-green-800",
			promosi: "bg-yellow-100 text-yellow-800",
			pengguna: "bg-indigo-100 text-indigo-800",
			outlet: "bg-purple-100 text-purple-800",
			lainnya: "bg-gray-100 text-gray-800",
		};
		return colors[category] || "bg-gray-100 text-gray-800";
	}, []);

	return (
		<>
			<Helmet>
				<title>
					Horizon POS - Sistem Manajemen Point of Sale dari Horizon Paradigm
				</title>
				<meta
					name="description"
					content="Horizon POS adalah sistem manajemen point of sale dari Horizon Paradigm yang terintegrasi dengan aplikasi mobile Horizon POS."
				/>
				<meta
					name="keywords"
					content="Point of Sale,  Horizon POS, aplikasi POS gratis, POS System, aplikasi kasir, Retail Management"
				/>
				<meta property="og:title" content="Horizon POS" />
				<meta
					property="og:description"
					content="Sistem manajemen point of sale dari Horizon Paradigm"
				/>
				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://pos.mycsi.net" />
				<link rel="canonical" href="https://pos.mycsi.net" />
				{/* Preload critical assets */}
				<link
					rel="preload"
					href="/fonts/Poppins-Regular.ttf"
					as="font"
					type="font/ttf"
					crossOrigin="anonymous"
				/>
				<link rel="preconnect" href="https://pos.mycsi.net" />
			</Helmet>
			<div className="md:mt-20 max-md:mt-20">
				<MenuNavigation />
				{/* below here home page */}
				<div className="min-h-screen p-4 md:p-6 lg:pt-20  dark:bg-gray-900 text-gray-900 dark:text-gray-100">
					{" "}
					{/* Tambahkan kelas dark:bg dan dark:text */}
					<div className="max-w-7xl mx-auto">
						{/* Header */}
						<div className="text-center mb-6 md:mb-8">
							<h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2 font-mono">
								{" "}
								{/* Ubah text-gray-800 */}
								Horizon POS
							</h1>
							<p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
								{" "}
								{/* Ubah text-gray-600 */}
								Back-Office Horizon POS App
							</p>
						</div>

						{/* Search Bar */}
						<div className="relative mb-8 md:mb-10 max-w-2xl mx-auto">
							<div className="relative">
								<div className="absolute inset-y-0 right-3 flex items-center pl-3 pointer-events-none">
									<Search className="h-4 w-4 md:h-5 md:w-5 text-gray-500 dark:text-gray-400" />{" "}
									{/* Ubah text-gray-500 */}
								</div>
								<input
									type="text"
									className="block w-full py-2 px-3 md:py-3 md:px-4 text-sm  dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-md transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
									placeholder="Cari fitur atau halaman..."
									value={searchQuery}
									onChange={(e) => handleSearch(e.target.value)}
									onFocus={() => setIsSearchFocused(true)}
									onBlur={() =>
										setTimeout(() => setIsSearchFocused(false), 200)
									}
									onKeyDown={handleKeyDown}
								/>
							</div>

							{/* Search Results */}
							{isSearchFocused && searchResults.length > 0 && (
								<div className="absolute z-10 w-full mt-2 bg-base	">
									{" "}
									{/* Ubah bg dan border */}
									<ul className="divide-y divide-gray-100 dark:divide-gray-700">
										{" "}
										{/* Ubah divide-gray */}
										{searchResults.map((page, index) => (
											<li
												key={index}
												className={`p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
													/* Ubah hover:bg */
													selectedResultIndex === index
														? "bg-gray-100 dark:bg-gray-700"
														: "" // Ubah bg
												}`}
												onClick={() => navigateToPage(page.originalPath)}
												onMouseEnter={() => setSelectedResultIndex(index)}
											>
												<div className="flex items-center flex-col md:flex-row">
													<div className="flex-shrink-0 bg-primary/10 p-2 rounded-full mb-2 md:mb-0">
														<Search className="h-4 w-4 md:h-5 md:w-5 text-primary dark:text-primary-light" />
													</div>
													<div className="ml-0 md:ml-4 text-center md:text-left">
														<p className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100">
															{" "}
															{/* Ubah text-gray-900 */}
															{page.originalPath.replace("/", "")}
														</p>
														<p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
															{" "}
															{/* Ubah text-gray-500 */}
															{page.description}
														</p>
													</div>
													{/* Kategori badge */}
													{Object.entries(pageCategories).map(
														([category, paths]) =>
															paths.includes(page.originalPath) ? (
																<span
																	key={category}
																	className={`mt-2 md:mt-0 md:ml-auto text-xs px-2 py-1 rounded-full ${getCategoryColor(
																		category
																	)} dark:bg-opacity-20 dark:text-opacity-90`} // Tambahkan dark:bg-opacity dan dark:text-opacity
																>
																	{getCategoryLabel(category)}
																</span>
															) : null
													)}
												</div>
											</li>
										))}
									</ul>
								</div>
							)}

							{/* No Results Message */}
							{isSearchFocused &&
								searchQuery.trim() !== "" &&
								searchResults.length === 0 && (
									<div className="absolute z-10 w-full mt-2  dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-100 dark:border-gray-700 text-center">
										{" "}
										{/* Ubah bg dan border */}
										<p className="text-gray-500 dark:text-gray-400 text-sm">
											{" "}
											{/* Ubah text-gray-500 */}
											Tidak ada hasil yang ditemukan untuk "{searchQuery}"
										</p>
										<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
											{" "}
											{/* Ubah text-gray-400 */}
											Coba kata kunci lain
										</p>
									</div>
								)}

							{/* Category Filter Chips */}
							{isSearchFocused && searchQuery.trim() === "" && (
								<div className="absolute z-10 w-full mt-2  dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
									{" "}
									{/* Ubah bg dan border */}
									<div className="p-4">
										<p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
											{" "}
											{/* Ubah text-gray-500 */}
											Kategori Halaman
										</p>
										<div className="flex flex-wrap gap-2">
											{Object.entries(pageCategories).map(
												([category, paths]) => (
													<button
														key={category}
														className={`text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-full ${getCategoryColor(
															category
														)} transition-all hover:shadow-sm dark:bg-opacity-20 dark:text-opacity-90`} // Tambahkan dark:bg-opacity dan dark:text-opacity
														onClick={() => {
															const categoryPages = mockPages.filter((page) =>
																paths.includes(page.originalPath)
															);
															setSearchResults(categoryPages);
														}}
													>
														{getCategoryLabel(category)} ({paths.length})
													</button>
												)
											)}
										</div>
									</div>
									<div className="px-4 pb-4">
										<p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
											{" "}
											{/* Ubah text-gray-500 */}
											Halaman Populer
										</p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
											{getPopularPagesWithDetails()
												.slice(0, 4)
												.map((page, index) => (
													<button
														key={index}
														className="text-left flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md" /* Ubah hover:bg */
														onClick={() => navigateToPage(page.originalPath)}
													>
														<span className="text-primary dark:text-primary-light mr-2 text-xs md:text-sm">
															{" "}
															{/* Tambahkan dark:text */}#{index + 1}
														</span>
														<span className="text-gray-900 dark:text-gray-100 text-xs md:text-sm truncate">
															{" "}
															{/* Tambahkan text-gray-900 dan dark:text */}
															{page.originalPath
																.replace("/", "")
																.replace(/_/g, " ")}
														</span>
													</button>
												))}
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Category Navigation */}
						<div className="mb-8 md:mb-10 flex justify-center">
							<div className="flex lg:w-[70vw] justify-center flex-wrap gap-4">
								{/* Sales Category */}
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/invoices")}
								>
									<div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<ShoppingCart
											color="blue"
											className="dark:text-blue-400"
										/>{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">
										Penjualan
									</span>
								</div>

								{/* Inventory Category */}
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/item_library")}
								>
									<div className="p-2 md:p-3 bg-green-100 dark:bg-green-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<Box color="green" className="dark:text-green-400" />{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">
										Inventori
									</span>
								</div>
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/voucher")}
								>
									<div className="p-2 md:p-3 bg-green-100 dark:bg-green-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<Percent
											color="green"
											className="dark:text-green-400"
										/>{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">
										Voucher
									</span>
								</div>

								{/* Promotions Category */}
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/promo")}
								>
									<div className="p-2 md:p-3 bg-yellow-100 dark:bg-yellow-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<Gift color="green" className="dark:text-yellow-400" />{" "}
										{/* Ubah color ikon dan tambahkan dark:text */}
									</div>
									<span className="text-xs md:text-sm font-medium">Promo</span>
								</div>

								{/* Discount Category */}
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/diskon")}
								>
									<div className="p-2 md:p-3 bg-red-100 dark:bg-red-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<Percent color="red" className="dark:text-red-400" />{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">Diskon</span>
								</div>

								{/* Reports Category */}
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/sales_report")}
								>
									<div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<BarChart
											color="purple"
											className="dark:text-purple-400"
										/>{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">
										Laporan
									</span>
								</div>

								{/* User Management Category */}
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/all_account")}
								>
									<div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<User2
											color="indigo"
											className="dark:text-indigo-400"
										/>{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">Kasir</span>
								</div>
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/spg")}
								>
									<div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<Presentation
											color="indigo"
											className="dark:text-indigo-400"
										/>{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">SPG</span>
								</div>
								<div
									className=" dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col items-center text-center text-gray-900 dark:text-gray-100" /* Ubah bg dan tambahkan text-color */
									onClick={() => navigateToPage("/outlet_list")}
								>
									<div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-800 rounded-full mb-2">
										{" "}
										{/* Ubah bg */}
										<Store
											color="indigo"
											className="dark:text-indigo-400"
										/>{" "}
										{/* Tambahkan dark:text untuk ikon */}
									</div>
									<span className="text-xs md:text-sm font-medium">Outlet</span>
								</div>
							</div>
						</div>

						{/* Lazy loaded components */}
						<Suspense
							fallback={
								<div className="loading loading-spinner loading-lg text-gray-500 dark:text-gray-400"></div>
							}
						>
							<DashboardPreview />
						</Suspense>
						{/* Popular Pages */}
						<div className="mb-8 md:mb-10">
							<div className="flex items-center mb-4 md:mb-6 flex-col md:flex-row">
								<h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">
									{" "}
									{/* Ubah text-gray-800 */}
									Halaman Populer
								</h2>
								<div className="mt-2 md:mt-0 md:ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
									{" "}
									{/* Ubah bg dan text color */}
									Akses Cepat
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4">
								{getPopularPagesWithDetails().map((page, index) => (
									<div
										key={index}
										className="flex items-center  dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 dark:border-gray-700" /* Ubah bg dan border */
										onClick={() => navigateToPage(page.originalPath)}
									>
										<div className="rounded-lg flex items-center justify-center h-8 w-8 md:h-10 md:w-10 flex-shrink-0 bg-primary/10">
											<span className="font-bold text-primary dark:text-primary-light text-sm md:text-base">
												{" "}
												{/* Ubah text-primary */}
												{index + 1}
											</span>
										</div>
										<div className="ml-3 md:ml-4">
											<h3 className="font-medium text-sm md:text-base text-gray-900 dark:text-gray-100">
												{" "}
												{/* Tambahkan text-gray-900 dan dark:text */}
												{page.originalPath.replace("/", "").replace(/_/g, " ")}
											</h3>
											<p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
												{" "}
												{/* Ubah text-gray-500 */}
												{page.description}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<Suspense
							fallback={
								<div className="loading loading-spinner loading-lg text-gray-500 dark:text-gray-400"></div>
							}
						>
							<QuickAccessCards />
						</Suspense>

						<Suspense
							fallback={
								<div className="loading loading-spinner loading-lg text-gray-500 dark:text-gray-400"></div>
							}
						>
							<ToolsAndResources />
						</Suspense>

						{/* Support Section */}
						<div className=" dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md text-gray-900 dark:text-gray-100">
							{" "}
							{/* Ubah bg dan tambahkan text-color */}
							<h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
								{" "}
								{/* Ubah text-gray-800 */}
								Butuh Bantuan?
							</h2>
							<p className="mb-4 text-sm md:text-base">
								Temukan panduan penggunaan sistem dan informasi terkini
							</p>
							<div className="flex flex-col gap-3 md:flex-row md:gap-4">
								<button
									onClick={() => navigateToPage("/artikel_documentation")}
									className="btn btn-outline btn-sm flex-1 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600" // Sesuaikan untuk mode gelap
								>
									Lihat Dokumentasi
								</button>
								<button
									onClick={() => toast("lihat pojok kanan bawah")}
									className="btn btn-primary btn-sm flex-1 bg-primary text-white dark:bg-primary-dark dark:text-gray-100 hover:bg-primary-darker dark:hover:bg-primary-light" // Sesuaikan untuk mode gelap
								>
									Report Bug
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default React.memo(Home);
