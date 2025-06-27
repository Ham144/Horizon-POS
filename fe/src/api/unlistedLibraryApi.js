import axios from "axios";
import { BASE_URL } from "./constant";

// Mendapatkan konfigurasi unlisted library
export const getConfigUnlistedSource = async () => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/unlistedLibraries/getConfigUnlistedSource`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Memperbarui konfigurasi unlisted library
export const updateConfigUnlistedSource = async (configData) => {
  const response = await axios.put(
    `${BASE_URL}/api/v1/unlistedLibraries/updateConfigUnlistedSource`,
    configData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Mereset konfigurasi unlisted library
export const resetConfigUnlistedSource = async () => {
  const response = await axios.delete(
    `${BASE_URL}/api/v1/unlistedLibraries/resetConfigUnlistedSource`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

// Mendapatkan data produk dari unlisted library
export const getUnlistedLibraryByQueries = async (params = {}) => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/unlistedLibraries/getUnlistedLibraryByQueries`,
    {
      params,
      withCredentials: true,
    }
  );
  return response.data;
};
