import axios from "axios";
import { BASE_URL } from "./constant";

export const getAllDiskon = async () => {
  const response = await axios.get(`${BASE_URL}/api/v1/diskon/getAllDiskon`, {
    withCredentials: true,
  });
  return response;
};

export const updateDiskon = async (body) => {
  const response = await axios.put(
    `${BASE_URL}/api/v1/diskon/updateDiskon`,
    body,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const deleteDiskon = async (id) => {
  const response = await axios.delete(
    `${BASE_URL}/api/v1/diskon/deleteDiskon/${id}`,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const createDiskon = async (body) => {
  const response = await axios.post(
    `${BASE_URL}/api/v1/diskon/registerDiskon`,
    body,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const getAllDiskonByProduct = async (sku) => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/diskon/getAllDiskonByProduct/${sku}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};
