// Contoh Komponen LanguageSwitcher.jsx

import React from "react";

// Fungsi ini akan mencari dan mengubah nilai dari dropdown Google Translate yang tersembunyi
const changeLanguage = (lang) => {
	const googleTranslateElement = document.getElementById(
		"google_translate_element"
	);
	if (googleTranslateElement) {
		const select = googleTranslateElement.querySelector("select");
		if (select) {
			select.value = lang;
			// Memicu event 'change' agar script Google mendeteksi perubahan
			select.dispatchEvent(new Event("change"));
		}
	}
};

export default function LanguageSwitcher() {
	return (
		<div className="flex text-balance items-center space-x-2">
			<span className="text-sm font-medium">Language</span>
			<button
				onClick={() => changeLanguage("id")}
				className="px-3 py-1 text-sm font-medium rounded-md hover:bg-gray-200"
			>
				ID
			</button>
			<span className="text-gray-300">|</span>
			<button
				onClick={() => changeLanguage("en")}
				className="px-3 py-1 text-sm font-medium rounded-md hover:bg-gray-200"
			>
				EN
			</button>
		</div>
	);
}
