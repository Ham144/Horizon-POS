import { getSimpleOverview } from "@/api/dashboardApi";
import { useUserInfo } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { ChartBar, Delete, List, ShoppingBag } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const DashboardPreview = () => {
	const navigate = useNavigate();

	const { userInfo } = useUserInfo();

	const { data: simpleOverview } = useQuery({
		enabled: !!userInfo,
		queryKey: ["dashboard_preview"],
		queryFn: async () => {
			const response = await getSimpleOverview();
			return response.data;
		},
	});

	return (
		<div className="mb-8 md:mb-10">
			<div className="flex justify-between items-center mb-6 flex-col md:flex-row">
				<h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-0 flex items-center gap-2">
					<ChartBar color="blue" />
					Ringkasan Bisnis
				</h2>
				<button
					onClick={() => navigate("/sales_report")}
					className="btn btn-sm hover:bg-blue-600 text-white shadow-md"
				>
					<List color="white" />
					Detail Overview
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Penjualan Hari Ini */}
				<div className="p-6 rounded-lg shadow-md border border-gray-200">
					<div className="flex items-center space-x-4">
						<div className="p-3 rounded-md">
							<ShoppingBag color="green" />
						</div>
						<div>
							<h3 className="text-sm font-semibold">Penjualan Hari Ini</h3>
							<p className="text-xl font-bold">
								{userInfo ? (
									Intl.NumberFormat("id-ID", {
										style: "currency",
										currency: "IDR",
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									}).format(
										simpleOverview?.penjualanHariIni[0]?.totalSales || 0
									)
								) : (
									<span className="badge badge-warning">Perlu Login</span>
								)}
							</p>
							<p className="text-xs">Hanya outlet Anda</p>
						</div>
					</div>
				</div>

				{/* Total Transaksi Hari Ini */}
				<div className="p-6 rounded-lg shadow-md border border-gray-200">
					<div className="flex items-center space-x-4">
						<div className="p-3 rounded-md">
							<ShoppingBag color="blue" />
						</div>
						<div>
							<h3 className="text-sm font-semibold">
								Total Transaksi Hari Ini
							</h3>
							<p className="text-xl font-bold">
								{userInfo ? (
									simpleOverview?.totalTransaksiHariIni
								) : (
									<span className="badge badge-warning">Perlu Login</span>
								)}
							</p>
							<p className="text-xs">Hanya outlet Anda</p>
						</div>
					</div>
				</div>

				{/* Transaksi Void Hari Ini */}
				<div className="p-6 rounded-lg shadow-md border border-gray-200">
					<div className="flex items-center space-x-4">
						<div className="p-3 rounded-md">
							<Delete color="red" />
						</div>
						<div>
							<h3 className="text-sm font-semibold">Transaksi Void Hari Ini</h3>
							<p className="text-xl font-bold">
								{userInfo ? (
									simpleOverview?.transaksiBatalHariIni
								) : (
									<span className="badge badge-warning">Perlu Login</span>
								)}
							</p>
							<p className="text-xs">Hanya outlet Anda</p>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
				{/* Card: Outlet Terlaris Hari Ini */}
				<div className="p-6 rounded-xl shadow-lg border border-gray-100 transform transition-transform duration-300 hover:scale-[1.01]">
					<h3 className="text-base font-semibold mb-4 flex items-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-5 h-5 mr-2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
							/>
						</svg>
						Outlet Terlaris Hari Ini
					</h3>
					<div>
						{userInfo ? (
							<div className="space-y-3">
								<p>
									<span className="font-medium">Nama Outlet:</span>{" "}
									<span className="ml-1">
										{simpleOverview?.outletTerlarisHariIni[0]?.outlet
											?.namaOutlet || "Belum ada data"}
									</span>
								</p>
								<p>
									<span className="font-medium">Kode Outlet:</span>{" "}
									<span className="ml-1">
										{simpleOverview?.outletTerlarisHariIni[0]?.outlet
											?.kodeOutlet || "Belum ada data"}
									</span>
								</p>
								<p>
									<span className="font-medium">Transaksi Hari Ini:</span>{" "}
									<span className="ml-1 font-semibold">
										{simpleOverview?.outletTerlarisHariIni[0]
											?.jumlahTransaksi || "0"}
									</span>
								</p>
								<p>
									<span className="font-medium">Alamat:</span>{" "}
									<span className="ml-1">
										{simpleOverview?.outletTerlarisHariIni[0]?.outlet?.alamat ||
											"Belum ada data"}
									</span>
								</p>
							</div>
						) : (
							<div role="alert" className="alert alert-warning text-sm">
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
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<span>Anda perlu login untuk melihat data ini.</span>
							</div>
						)}
					</div>
					<p className="text-xs mt-4 italic">
						*Data diambil dari semua outlet yang terdaftar.
					</p>
				</div>

				{/* Card: 3 Barang Terlaris Hari Ini */}
				<div className="p-6 rounded-xl shadow-lg border border-gray-100 transform transition-transform duration-300 hover:scale-[1.01]">
					<h3 className="text-base font-semibold mb-4 flex items-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-5 h-5 mr-2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M3.75 13.5l10.5-11.25L12 10.5h8.25L1.5 21l6.75-9H3.75z"
							/>
						</svg>
						3 Barang Terlaris Hari Ini
					</h3>
					<div className="overflow-x-auto max-h-[220px] custom-scrollbar">
						{userInfo ? (
							<table className="table w-full text-sm">
								<thead>
									<tr className="">
										<th className="text-left py-2 px-3">SKU</th>
										<th className="text-left py-2 px-3">Rekor Terjual</th>
										<th className="text-left py-2 px-3">Terjual Hari Ini</th>
									</tr>
								</thead>
								<tbody>
									{simpleOverview?.barangTerlarisHariIni &&
									simpleOverview.barangTerlarisHariIni.length > 0 ? (
										simpleOverview.barangTerlarisHariIni.map((item, index) => (
											<tr key={index} className="border-b border-gray-100">
												<td className="py-2 px-3 font-medium">
													{item?.barang?.sku || "-"}
												</td>
												<td className="py-2 px-3">
													{item?.barang?.terjual || "0"}
												</td>
												<td className="py-2 px-3 font-semibold">
													{item?.totalQuantityTerjual || "0"}
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan="3" className="text-center py-4">
												Belum ada data penjualan barang hari ini.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						) : (
							<div role="alert" className="alert alert-warning text-sm">
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
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								<span>Anda perlu login untuk melihat data ini.</span>
							</div>
						)}
					</div>
					<p className="text-xs mt-4 italic">
						*Data diambil dari penjualan di semua outlet Anda.
					</p>
				</div>
			</div>
		</div>
	);
};

export default React.memo(DashboardPreview);
