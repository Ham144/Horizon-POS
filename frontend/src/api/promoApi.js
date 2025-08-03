import axios from "axios";
import { BASE_URL } from "./constant";

export const getAllBarangPromo = async () => {
  const response = await axios.get(`${BASE_URL}/api/v1/promo/getAllPromo`, {
    withCredentials: true,
  });
  return response.data;
};

export const buatPromoBaru = async (body) => {
  const response = await axios.post(
    `${BASE_URL}/api/v1/promo/registerPromo`,
    body,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const updatePromo = async (body) => {
  const response = await axios.put(
    `${BASE_URL}/api/v1/promo/updatePromo`,
    body,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const deletePromo = async (id) => {
  const response = await axios.delete(
    `${BASE_URL}/api/v1/promo/deletePromo/${id}`,
    {
      withCredentials: true,
    }
  );
  return response;
};

export const getAllPromoByProduct = async (sku) => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/promo/getAllPromoByProduct/${sku}`,
    {
      withCredentials: true,
    }
  );
  return response;
};
