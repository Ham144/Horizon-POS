import React from "react";

const RegistrationSuccess = () => {
	return (
		<div className="flex flex-col items-center justify-center w-full h-screen bg-white">
			<div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
				<h2 className="text-3xl font-bold text-center mb-6">
					Selamat! Anda berhasil mendaftar
				</h2>
				<p className="text-lg text-center mb-6">
					Silakan cek inbox email Anda untuk melakukan konfirmasi pendaftaran.
					Klik link konfirmasi yang dikirimkan untuk mengaktifkan akun Anda.
				</p>
				<p className="text-lg text-center mb-6">
					Jika Anda tidak menerima email, silakan periksa folder spam atau
					hubungi tim support kami.
				</p>
				<div className="flex justify-center">
					<a
						href="/"
						className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
					>
						Kembali ke halaman utama
					</a>
				</div>
			</div>
		</div>
	);
};

export default RegistrationSuccess;
