import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, getUserInfo } from "@/api/authApi";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router";
import { useUserInfo } from "@/store";

export default function Login({ className, ...props }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);

	const path = useLocation().pathname;
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// Zustand
	const { setUserInfo, clearUserInfo } = useUserInfo();

	// Verifikasi token saat komponen dimuat
	useEffect(() => {
		const verifyToken = async () => {
			const token = localStorage.getItem("token");

			if (!token) return;

			setIsVerifying(true);

			try {
				const response = await getUserInfo(token);
				setUserInfo(response.userInfo);

				// Invalidate query untuk memperbarui data
				queryClient.invalidateQueries(["userInfo"]);

				// Hapus navigasi ke path yang sama karena tidak diperlukan
			} catch (error) {
				// Token tidak valid, hapus dari localStorage
				localStorage.removeItem("token");
				clearUserInfo();
				toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
			} finally {
				setIsVerifying(false);
			}
		};

		verifyToken();
	}, []);

	const { mutateAsync: handleLogin, isPending } = useMutation({
		mutationFn: async (e) => {
			e.preventDefault();
			const res = await login({ username, password });
			return res.data;
		},
		retryDelay: 1000,
		mutationKey: ["userInfo"],
		onSuccess: async (res) => {
			localStorage.setItem("token", res?.token);
			setUserInfo(await res?.data);

			// Invalidate query untuk memperbarui data
			queryClient.invalidateQueries(["userInfo"]);

			if (path === "/login" || path === "/register") {
				navigate("/");
			} else {
				toast.loading("Memverifikasi sesi Anda...");
				setTimeout(() => {
					toast.dismiss();
					window.location.reload();
				}, 400);
			}
		},
		onError: (err) => {
			console.log(err);
			toast.error(
				err?.response?.data?.message ||
					"Login gagal. Periksa username dan password Anda."
			);
		},
	});

	return (
		<div
			className={cn(
				"flex min-h-screen items-center justify-center bg-base-200",
				className
			)}
			{...props}
		>
			<Card className="w-full max-w-lg overflow-visible shadow-lg relative">
				<CardContent className="flex flex-col">
					<div className="relative flex  justify-center items-center p-4 -mt-20 ">
						{!(isPending || isVerifying) ? (
							<img
								src="/csi-logo2.png"
								alt="Horizon Pos Logo"
								width={120}
								height={120}
								className="rounded-2xl shadow-md bg-white  object-contain transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
								style={{
									transformStyle: "preserve-3d",
									transform:
										"perspective(1000px) rotateX(-5deg) translateZ(20px)",
								}}
							/>
						) : (
							<span className="loading loading-spinner w-16 h-16 mx-auto" />
						)}
					</div>

					{/* Form Section */}
					<form
						onSubmit={handleLogin}
						className="p-6 md:p-8 flex flex-col maxmd justify-center"
					>
						<div className="flex flex-col gap-6">
							<div className="flex flex-col items-center text-center">
								<h1 className="text-2xl font-bold text-primary">Horizon Pos</h1>
								<p className="text-balance text-sm text-base-content/70">
									Masuk ke Backoffice Horizon Pos
								</p>
							</div>
							<div className="grid gap-4">
								<div className="grid gap-2">
									<Label htmlFor="username" className="text-base-content">
										Username
									</Label>
									<Input
										id="username"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										type="text"
										placeholder="Input username anda"
										required
										className="border-base-content/20"
										disabled={isPending || isVerifying}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="password" className="text-base-content">
										Password
									</Label>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="border-base-content/20"
										disabled={isPending || isVerifying}
									/>
								</div>
							</div>
							<Button
								type="submit"
								className={`w-full ${
									(isPending || isVerifying) && "loading-bars"
								} btn btn-primary`}
								disabled={isPending || isVerifying}
							>
								{isVerifying
									? "Memverifikasi..."
									: isPending
									? "Memproses..."
									: "Login"}
							</Button>
							<div className="flex items-center">
								<a
									href="#"
									className="ml-auto text-sm text-primary underline-offset-2 hover:underline"
								>
									Lupa password?
								</a>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
