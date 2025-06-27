import { BASE_URL } from "@/api/constant";
import { editKasir } from "@/api/kasirApi";
import { useUserInfo } from "@/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { FileWarning, LucideShieldQuestion } from "lucide-react";
import { getOuletList } from "@/api/outletApi";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo } = useUserInfo();

  const { data: outletList } = useQuery({
    queryFn: getOuletList,
    queryKey: ["outlet"],
  });

  // Initial form state based on userInfo
  const [formData, setFormData] = useState({
    username: userInfo?.username || "",
    password: "", // Leave blank for security; only fill to update
    email: userInfo?.email || "",
    telepon: userInfo?.telepon || "",
    outlet: userInfo?.outlet || "",
  });

  const queryClient = useQueryClient();
  // Mutation untuk mengedit kasir
  const { mutateAsync: handleEditKasir } = useMutation({
    mutationFn: async () => await editKasir(formData),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["kasir"]);
      toast.success("success");
    },
    onError: (err) => {
      toast(err?.response?.data?.message);
    },
  });

  function handleThisUserOutlet(user) {
    return outletList?.data?.find((i) => i.kasirList.includes(user._id));
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    async function fetchCurrentUserCompleteData() {
      const response = await axios.get(
        `${BASE_URL}/api/v1/auth/getUserInfoComplete`,
        {
          withCredentials: true,
        }
      );
      setFormData({
        _id: userInfo?._id,
        username: response?.data?.data?.username ?? "",
        password: "",
        email: response?.data?.data?.email ?? "",
        telepon: response?.data?.data?.telepon ?? "",
        outlet: response?.data?.data?.outlet ?? "",
      });
    }
    fetchCurrentUserCompleteData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          User Profile
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditKasir();
          }}
          className="space-y-6"
        >
          {/* Username */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              Username
              <div
                className="tooltip"
                data-tip="Tidak bisa diubah, sudah terlanjur penghubung (FK) antar Invoice"
              >
                <LucideShieldQuestion className="w-4 h-4" />
              </div>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500"
              placeholder="password baru (kosongkan jika tak mengganti)"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Telepon */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Telephone
            </label>
            <input
              type="tel"
              name="telepon"
              value={formData.telepon}
              onChange={handleChange}
              className="input input-bordered w-full bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Outlet */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Outlet
            </label>
            <select
              name="outlet"
              value={formData.outlet}
              onChange={handleChange}
              className="select select-bordered w-full bg-gray-50 text-gray-800 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={userInfo?.outlet}>
                {handleThisUserOutlet(userInfo)?.namaOutlet}
              </option>
              {outletList?.data?.map((outlet) => (
                <option key={outlet._id} value={outlet._id}>
                  {outlet.namaOutlet}
                </option>
              ))}
            </select>
            <div role="alert" className="alert alert-warning">
              <FileWarning />
              <span>
                Mengubah outlet dari sini belum sempurna, pergi ke{" "}
                <Link to="/all_account" className="link link-hover">
                  all account
                </Link>{" "}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-secondary btn-sm">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
