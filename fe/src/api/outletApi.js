import axios from "axios";
import { BASE_URL } from "./constant";

export const getOuletList = async () => {
  const response = await axios.get(`${BASE_URL}/api/v1/outlet/getAllOutlet`, {
    withCredentials: true,
  });
  return response?.data;
};

export const registerOutlet = async (body) => {
  const response = await axios.post(
    `${BASE_URL}/api/v1/outlet/registerOutlet`,
    body,
    {
      withCredentials: true,
    }
  );
  return response?.data;
};

export const editOutlet = async (body) => {
  const { namaOutlet, description } = body;
  if (!namaOutlet || !description) {
    throw new Error("field tidak lengkap, [namaOutlet, description]");
  } else {
    const response = await axios.put(`${BASE_URL}/api/v1/outlet/edit`, body, {
      withCredentials: true,
    });
    return response?.data;
  }
};

export const deleteOutlet = async (_id) => {
  const response = await axios.delete(
    `${BASE_URL}/api/v1/outlet/delete/${_id}`,
    {
      withCredentials: true,
    }
  );
  return response?.data;
};

export const assignUserToOutlet = async (userId, outletId) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/outlet/assignUserToOutlet`,
      { userId, outletId },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const assignBrandToOutlet = async (body) => {
  const response = await axios.post(
    `${BASE_URL}/api/v1/outlet/linkBrandToOutlet`,
    body,
    { withCredentials: true }
  );
  return response?.data;
};

export const getOuletByUserId = async (userId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/v1/outlet/getOutlet/${userId}`,
      {
        withCredentials: true,
      }
    );
    return response?.data;
  } catch (error) {
    return error?.response?.data?.message;
  }
};

//menerima array spgIds
export const assignSpgToOutlet = async (spgIds, outletId) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/outlet/assignSpgToOutlet`,
      { spgIds, outletId },
      { withCredentials: true }
    );
    return response?.data;
  } catch (error) {
    return error?.response?.data?.message;
  }
};
