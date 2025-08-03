import React, { useEffect } from "react"; // Pastikan React diimpor
import { useQuery } from "@tanstack/react-query"; // Atau 'react-query'
import { useNavigate, useParams } from "react-router-dom"; // Pastikan ini diimpor
import { toast } from "react-toastify"; // Pastikan toast diimpor jika Anda menggunakannya
import { useUserInfo } from "@/store";
import { verifyMagicLink } from "@/api/authApi";

function VerifyMagicLinkPage() {
	const { setUserInfo } = useUserInfo();
	const navigate = useNavigate(); // Inisialisasi useNavigate
	const { crypto } = useParams(); // Ambil token dari URL dan beri nama 'crypto'

	const { data, isLoading, error } = useQuery({
		queryKey: ["verifyMagicLink", crypto],
		queryFn: async () => await verifyMagicLink(crypto),
		enabled: !!crypto,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (data) {
			setUserInfo(data.data);
			navigate("/");
		}
		if (error) {
			toast.error(error?.response?.data?.message || "Gagal verifikasi link");
		}
	}, [isLoading]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			{isLoading ? (
				<div className="flex items-center justify-center">
					<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
					<p className="pl-2">Verify..</p>
				</div>
			) : (
				// Tampilkan displayMessage yang sudah diformat
				<p className="text-center"> {error?.response?.data?.message}</p>
			)}
		</div>
	);
}

export default VerifyMagicLinkPage;
