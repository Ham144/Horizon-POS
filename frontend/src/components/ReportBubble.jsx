import React, { useState, useRef } from "react";
import { createReport } from "../api/reportApi";
import { toast, Toaster } from "react-hot-toast";
import { Bug, MessageCircle, Upload, X } from "lucide-react";

const ReportBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "placeholder.jpg", // Default placeholder jika tidak ada gambar yang diupload
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP"
      );
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB");
      return;
    }

    // Buat URL untuk preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Simpan base64 string ke formData
      setFormData((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      image: "placeholder.jpg", // Kembali ke placeholder default
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi form
    if (!formData.title) {
      toast.error("Judul wajib diisi");
      return;
    }

    if (!formData.description) {
      toast.error("Deskripsi wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      await createReport(formData);
      toast.success("Laporan berhasil dikirim");
      setIsOpen(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        image: "placeholder.jpg",
      });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(error.message || "Gagal mengirim laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Toaster />
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 flex items-center justify-center text-white z-50"
        aria-label="Buat Laporan"
      >
        <Bug className="h-6 w-6" />
      </button>

      {/* Modal DaisyUI */}
      <dialog
        id="report_modal"
        className={`modal ${isOpen ? "modal-open" : ""}`}
      >
        <div className="modal-box max-w-2xl">
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={closeModal}
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">Buat Laporan Error</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">
                    Judul <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Masukkan judul laporan"
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">
                    Deskripsi <span className="text-error">*</span>
                  </span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Jelaskan masalah yang Anda alami"
                  rows={4}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Unggah Gambar</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="file-input file-input-bordered w-full"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    hidden
                  />
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-full cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {!imagePreview ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Klik untuk mengunggah gambar
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          JPG, PNG, GIF, WEBP (Maks. 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeModal}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Mengirim...
                  </>
                ) : (
                  "Kirim Laporan"
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="modal-backdrop" onClick={closeModal}></div>
      </dialog>
    </>
  );
};

export default ReportBubble;
