import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { register } from "@/api/authApi";

const countries = [
	{ code: "ID", name: "Indonesia (+62)" },
	{ code: "US", name: "United States (+1)" },
	{ code: "GB", name: "United Kingdom (+44)" },
];

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		telepon: "",
		organizationName: "",
		countryCode: "",
	});

	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const { mutate: handleRegister, isPending } = useMutation({
		mutationFn: async (e) => {
			e.preventDefault();
			for (const key in formData) {
				if (!formData[key]) throw new Error(`Field ${key} must be filled.`);
			}
			const res = await register(formData);
			return res.data;
		},
		onSuccess: () => {
			navigate("/registration-success");
			toast.success("Registration successful!");
		},
		onError: (err) => {
			toast.error(err.message || "Failed, please try again.");
		},
	});

	return (
		<div className="min-h-screen flex justify-center items-center p-4 bg-gray-100">
			<form
				onSubmit={handleRegister}
				className="bg-white p-6 rounded shadow w-full max-w-md"
			>
				<h1 className="text-xl font-bold mb-4">Register</h1>

				<label>Nama</label>
				<input
					name="username"
					value={formData.username}
					onChange={handleChange}
					className="border p-2 w-full mb-2"
				/>
				<label>Email</label>
				<input
					name="email"
					type="email"
					value={formData.email}
					onChange={handleChange}
					className="border p-2 w-full mb-2"
				/>

				<label>Organisasi</label>
				<input
					name="organizationName"
					value={formData.organizationName}
					onChange={handleChange}
					className="border p-2 w-full mb-2"
				/>

				<label>Negara</label>
				<select
					name="countryCode"
					value={formData.countryCode}
					onChange={handleChange}
					className="border p-2 w-full mb-2"
				>
					<option value="">Pilih negara</option>
					{countries.map((c) => (
						<option key={c.code} value={c.code}>
							{c.name}
						</option>
					))}
				</select>

				<label>Telepon</label>
				<input
					name="telepon"
					value={formData.telepon}
					onChange={handleChange}
					className="border p-2 w-full mb-4"
				/>

				<button
					disabled={isPending}
					className="w-full bg-blue-600 text-white py-2 rounded"
				>
					{isPending ? "Memproses..." : "Daftar"}
				</button>

				<p className="text-center text-sm mt-2">
					Sudah memiliki Akun?{" "}
					<button
						type="button"
						onClick={() => navigate("/login")}
						className="underline text-blue-600"
					>
						Login disini
					</button>
				</p>
			</form>
		</div>
	);
}
