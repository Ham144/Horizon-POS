import axios from "axios";
import { BASE_URL } from "./constant";

export const resetParyly = async (selected, action) => {
  const response = await axios.delete(
    `${BASE_URL}/api/v1/database-feature/reset-partly`
  );
  return response.data;
};
