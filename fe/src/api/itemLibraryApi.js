import axios from "axios";
import { BASE_URL } from "./constant";

export const getAllinventories = async (queryKey) => {
  const extractedQuery = queryKey.queryKey[1];

  const queries = [];
  Object.keys(extractedQuery).forEach((key) => {
    if (extractedQuery[key] != "") {
      queries.push(`${key}=${extractedQuery[key]}`);
    } else {
      return;
    }
  });

  const url = `${BASE_URL}/api/v1/inventories/getAllinventories?${
    queries && queries.join("&")
  }`;

  const response = await axios.get(url, {
    withCredentials: true,
  });

  // Jika response sudah dalam format pagination (memiliki total, totalPages, dll)
  if (response?.data?.data?.data) {
    return {
      data: response?.data?.data?.data,
      total: response?.data?.data?.total,
      totalPages: response?.data?.totalPages,
      currentPage: response?.data?.currentPage,
    };
  }

  // Jika belum dalam format pagination, gunakan format lama
  return response.data;
};

export const getInventoryById = async (skuId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/inventories/getInventoryById/${skuId}`,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory details:", error);
    throw error;
  }
};

export const perbaruiInventoryDariUnlisted = async () => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/unlistedLibraries/getUnlistedLibraryByQueries`,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const updateSingleInventory = async (body) => {
  const response = await axios.put(
    `${BASE_URL}/api/v1/inventories/updateSingleInventori`,
    body,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const createSingleInventory = async (body) => {
  const response = await axios.post(
    `${BASE_URL}/api/v1/inventories/registerSingleInventori`,
    body,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const updateBulkPrices = async (updates) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/inventories/updateBulkPrices`,
      {
        updates,
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating bulk prices:", error);
    throw error;
  }
};

export const toggleDisableInventory = async (id) => {
  const response = await axios.post(
    `${BASE_URL}/api/v1/unlistedLibraries/toggleDisableInventory/${id}`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};
