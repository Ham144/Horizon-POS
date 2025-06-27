import axios from "axios";
import { BASE_URL } from "./constant";

export const uploadThumbail = async (body) => {
  const { sku, file } = body;
  const formData = new FormData();
  formData.append("image", file);
  const response = await axios.post(
    `${BASE_URL}/api/v1/thumbnail/upload/${sku}`,
    formData,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getImage = async (sku) => {
  if (!sku) {
    return;
  }
  const response = await axios.get(`${BASE_URL}/api/v1/thumbnail/get/${sku}`, {
    withCredentials: true,
  });
  return response.data;
};
