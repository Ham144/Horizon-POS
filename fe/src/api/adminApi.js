import axios from "axios";
import { BASE_URL } from "./constant";

// Verifikasi koneksi email saat ini
export const verifyEmailConnection = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/admin/verify-email-connection`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Test koneksi Outlook dengan parameter dari .env
export const testOutlookConnection = async (to) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/test-outlook-connection`,
      { to },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Test koneksi email dengan parameter kustom
export const testCustomEmailConnection = async (config) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/test-email-connection`,
      config,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Menjalankan job pengiriman email kwitansi secara manual
export const runEmailKwitansiJob = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/run-email-kwitansi-job`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mendapatkan konfigurasi email saat ini
export const getCurrentEmailConfig = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/admin/current-email-config`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Menyimpan konfigurasi email
export const saveEmailConfig = async (config) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/admin/save-email-config`,
      config,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
