import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  verifyEmailConnection,
  testOutlookConnection,
  testCustomEmailConnection,
  runEmailKwitansiJob,
  getCurrentEmailConfig,
  saveEmailConfig,
} from "../api/adminApi";
import toast from "react-hot-toast";

const EmailConfig = () => {
  // State untuk form konfigurasi email kustom
  const [customConfig, setCustomConfig] = useState({
    host: "",
    port: "587",
    secure: false,
    service: "Outlook365",
    user: "",
    pass: "",
    to: "",
  });

  // State untuk email tujuan pengujian default
  const [testEmail, setTestEmail] = useState("");

  // State untuk loading
  const [isTestingDefault, setIsTestingDefault] = useState(false);
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [isRunningJob, setIsRunningJob] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Query untuk memverifikasi koneksi email saat ini
  const { data: connectionStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["emailConnectionStatus"],
    queryFn: verifyEmailConnection,
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Gagal memeriksa status koneksi email"
      );
    },
  });

  // Query untuk mendapatkan konfigurasi email saat ini
  const { data: currentConfig, refetch: refetchConfig } = useQuery({
    queryKey: ["currentEmailConfig"],
    queryFn: getCurrentEmailConfig,
    onSuccess: (data) => {
      if (data?.config) {
        // Isi form dengan konfigurasi saat ini
        setCustomConfig((prev) => ({
          ...prev,
          host: data.config.host || "",
          port: data.config.port || "587",
          secure: data.config.secure || false,
          service: data.config.service || "Outlook365",
          user: data.config.user || "",
          // Password tidak diisi dari server untuk alasan keamanan
        }));
      }
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          "Gagal mendapatkan konfigurasi email saat ini"
      );
    },
  });

  // Mutation untuk menguji koneksi email default
  const testDefaultConnection = async () => {
    if (!testEmail) {
      toast.error("Masukkan alamat email tujuan untuk pengujian");
      return;
    }

    setIsTestingDefault(true);
    try {
      const result = await testOutlookConnection(testEmail);
      toast.success("Email test berhasil dikirim!");
      return result;
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal mengirim email test"
      );
      throw error;
    } finally {
      setIsTestingDefault(false);
    }
  };

  // Mutation untuk menguji koneksi email kustom
  const testCustomConnection = async () => {
    // Validasi form
    if (
      !customConfig.host ||
      !customConfig.port ||
      !customConfig.user ||
      !customConfig.pass ||
      !customConfig.to
    ) {
      toast.error("Semua field harus diisi");
      return;
    }

    setIsTestingCustom(true);
    try {
      const result = await testCustomEmailConnection(customConfig);
      toast.success("Email test berhasil dikirim dengan konfigurasi kustom!");
      return result;
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal mengirim email test"
      );
      throw error;
    } finally {
      setIsTestingCustom(false);
    }
  };

  // Mutation untuk menyimpan konfigurasi email
  const saveConfig = async () => {
    // Validasi form
    if (
      !customConfig.host ||
      !customConfig.port ||
      !customConfig.user ||
      !customConfig.pass
    ) {
      toast.error("Semua field konfigurasi harus diisi");
      return;
    }

    setIsSaving(true);
    try {
      const configToSave = { ...customConfig };
      delete configToSave.to; // Hapus field to karena tidak perlu disimpan di .env

      const result = await saveEmailConfig(configToSave);
      toast.success("Konfigurasi email berhasil disimpan!");

      // Refresh status dan konfigurasi
      refetchStatus();
      refetchConfig();

      return result;
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal menyimpan konfigurasi email"
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Mutation untuk menjalankan job pengiriman email kwitansi
  const runEmailJob = async () => {
    setIsRunningJob(true);
    try {
      const result = await runEmailKwitansiJob();
      toast.success("Job pengiriman email kwitansi telah dijalankan!");
      return result;
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Gagal menjalankan job pengiriman email"
      );
      throw error;
    } finally {
      setIsRunningJob(false);
    }
  };

  // Handler untuk mengubah state form kustom
  const handleCustomConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomConfig({
      ...customConfig,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Load konfigurasi saat komponen dimuat
  useEffect(() => {
    refetchConfig();
  }, [refetchConfig]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Konfigurasi Email</h1>

      {/* Status Koneksi Email Saat Ini */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Status Koneksi Email</h2>
          <button
            onClick={() => refetchStatus()}
            className="btn btn-sm btn-outline"
          >
            Refresh Status
          </button>
        </div>

        <div className="flex items-center mb-4">
          <div
            className={`w-4 h-4 rounded-full mr-2 ${
              connectionStatus?.success
                ? "bg-success"
                : connectionStatus?.success === false
                ? "bg-error"
                : "bg-gray-300"
            }`}
          ></div>
          <span>
            {connectionStatus?.success
              ? "Terhubung"
              : connectionStatus?.success === false
              ? "Tidak Terhubung"
              : "Belum Diperiksa"}
          </span>
        </div>

        {connectionStatus && (
          <div className="text-sm">
            <p>{connectionStatus.message}</p>
          </div>
        )}

        {currentConfig?.config && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <h3 className="font-medium text-sm mb-1">Konfigurasi Saat Ini:</h3>
            <div className="text-xs grid grid-cols-2 gap-2">
              <span>
                Host:{" "}
                <span className="font-semibold">
                  {currentConfig.config.host}
                </span>
              </span>
              <span>
                Port:{" "}
                <span className="font-semibold">
                  {currentConfig.config.port}
                </span>
              </span>
              <span>
                Secure:{" "}
                <span className="font-semibold">
                  {currentConfig.config.secure ? "Ya" : "Tidak"}
                </span>
              </span>
              <span>
                Service:{" "}
                <span className="font-semibold">
                  {currentConfig.config.service || "-"}
                </span>
              </span>
              <span>
                User:{" "}
                <span className="font-semibold">
                  {currentConfig.config.user}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pengujian Email Default */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Uji Pengiriman Email (Konfigurasi dari Server)
        </h2>
        <div className="form-control w-full mb-4">
          <label className="label">
            <span className="label-text">Email Tujuan Pengujian</span>
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Masukkan email tujuan"
            className="input input-bordered w-full"
            required
          />
        </div>

        <button
          onClick={testDefaultConnection}
          className={`btn btn-success w-full ${
            isTestingDefault ? "loading" : ""
          }`}
          disabled={isTestingDefault || !testEmail}
        >
          {isTestingDefault ? "Mengirim..." : "Kirim Email Test"}
        </button>
      </div>

      {/* Form Konfigurasi Email Kustom */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Konfigurasi Email & Uji</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">SMTP Host</span>
            </label>
            <input
              type="text"
              name="host"
              value={customConfig.host}
              onChange={handleCustomConfigChange}
              placeholder="smtp.example.com"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">SMTP Port</span>
            </label>
            <input
              type="number"
              name="port"
              value={customConfig.port}
              onChange={handleCustomConfigChange}
              placeholder="587"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              name="user"
              value={customConfig.user}
              onChange={handleCustomConfigChange}
              placeholder="your@email.com"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              name="pass"
              value={customConfig.pass}
              onChange={handleCustomConfigChange}
              placeholder="Password"
              className="input input-bordered w-full"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Service (opsional)</span>
            </label>
            <select
              name="service"
              value={customConfig.service}
              onChange={handleCustomConfigChange}
              className="select select-bordered w-full"
            >
              <option value="">Tidak Ada</option>
              <option value="Outlook365">Outlook365</option>
              <option value="Gmail">Gmail</option>
              <option value="Yahoo">Yahoo</option>
              <option value="Hotmail">Hotmail</option>
            </select>
          </div>

          <div className="form-control w-full flex items-center justify-start mt-8">
            <label className="cursor-pointer label justify-start">
              <input
                type="checkbox"
                name="secure"
                checked={customConfig.secure}
                onChange={handleCustomConfigChange}
                className="checkbox checkbox-primary mr-2"
              />
              <span className="label-text">
                Gunakan SSL (biasanya untuk port 465)
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={saveConfig}
            className={`btn btn-success w-full ${isSaving ? "loading" : ""}`}
            disabled={isSaving}
          >
            {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>

          <div className="divider text-sm text-gray-500">Test Konfigurasi</div>

          <div className="form-control w-full mb-3">
            <label className="label">
              <span className="label-text">Email Tujuan Test</span>
            </label>
            <input
              type="email"
              name="to"
              value={customConfig.to}
              onChange={handleCustomConfigChange}
              placeholder="test@example.com"
              className="input input-bordered w-full"
            />
          </div>

          <button
            onClick={testCustomConnection}
            className={`btn btn-outline w-full ${
              isTestingCustom ? "loading" : ""
            }`}
            disabled={isTestingCustom}
          >
            {isTestingCustom ? "Mengirim..." : "Uji Konfigurasi"}
          </button>
        </div>
      </div>

      {/* Jalankan Job Email Kwitansi */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Jalankan Job Pengiriman Email Kwitansi
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Klik tombol di bawah untuk menjalankan job pengiriman email kwitansi
          secara manual. Job ini akan mencari semua invoice yang sudah dibayar
          tetapi belum dikirim email kwitansi, dan mengirimkan email bukti
          pembayaran ke pelanggan.
        </p>

        <button
          onClick={runEmailJob}
          className={`btn btn-accent w-full ${isRunningJob ? "loading" : ""}`}
          disabled={isRunningJob}
        >
          {isRunningJob ? "Menjalankan..." : "Jalankan Job Email Kwitansi"}
        </button>
      </div>
    </div>
  );
};

export default EmailConfig;
