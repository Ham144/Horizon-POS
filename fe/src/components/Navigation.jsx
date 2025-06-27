import { useUserInfo } from "@/store";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ArrowRight,
  LayoutDashboard,
  Lock,
  Menu,
  X,
  LogOut,
  FileText,
  AlertCircle,
  Info,
  LogIn,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/authApi";

const SideDrawer = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState();
  const [nosidebar, setNosidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State untuk toggle sidebar
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("");
  const pathname = useLocation().pathname;
  const queryClient = useQueryClient();

  const { mutate: handleLogout } = useMutation({
    mutationKey: ["userInfo"],
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries(["userInfo"]);
      clearUserInfo();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Session expired");
    },
  });

  //catatan (.) artinya new
  //catatan (nosidebar) artinya nosidebar
  //catatan (-) artinya tidak perlu ditampilkan navigasi
  const menuItems = [
    {
      title: "REPORTS",
      items: ["SALES REPORT.", "INVOICES", "STACK TRACE."],
    },
    {
      title: "LIBRARY",
      items: ["ITEM LIBRARY", "PROMO.", "DISKON", "VOUCHER.", "BRANDS"],
    },
    {
      title: "INVENTORY",
      items: ["PURCHASE ORDER CREATE", "PURCHASE ORDER RECEIVE"],
    },
    {
      title: "CUSTOMER",
      items: ["CUSTOMER LIST"],
    },
    {
      title: "ACCOUNTS AND SPGS",
      items: ["ALL ACCOUNT", "KASIR LIST", "SPG LIST"],
    },
    {
      title: "TRANSACTION SETTINGS",
      items: ["OUTLET LIST", "PAYMENT METHOD", "KWITANSI PEMBAYARAN TERTUNDA"],
    },
    {
      title: "APPLICATION SETTINGS",
      items: [
        "DATABASE FEATURE",
        "SUMBER THIRDPARTY",
        "PROFILE",
        "EMAIL CONFIG",
        "REPORT LIST",
      ],
    },
  ];

  function navigatTo(menu) {
    setActiveMenu(menu);

    const navigation = menu
      .toLowerCase()
      .split(" ")
      .join("_")
      .replace("nosidebar", "")
      .replace(".", "")
      .replace("-", "");

    // Invalidate userInfo query saat navigasi untuk memicu pengecekan token
    queryClient.invalidateQueries(["userInfo"]);
    // Pada tampilan mobile, tutup sidebar saat navigasi
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    return navigate(`/${navigation}`);
  }

  const handleMenuClick = (menu) => {
    if (menu.includes("nosidebar")) {
      setNosidebar(true);
      navigatTo(menu);
    } else {
      setNosidebar(false);
      navigatTo(menu);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Tutup sidebar ketika klik di luar sidebar pada mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    const handleClickOutside = (e) => {
      if (window.innerWidth < 768 && sidebarOpen) {
        const sidebar = document.getElementById("sidebar");
        const toggleButton = document.getElementById("sidebar-toggle");
        if (
          sidebar &&
          !sidebar.contains(e.target) &&
          !toggleButton.contains(e.target)
        ) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setCurrentPage(pathname.replace("/", "").replace("_", " ").toUpperCase());
    setNosidebar(pathname.includes("login"));

    // Invalidate userInfo query saat pathname berubah
    if (!pathname.includes("login")) {
      queryClient.invalidateQueries(["userInfo"]);
    }
  }, [pathname, queryClient]);

  const { userInfo, clearUserInfo } = useUserInfo();

  return (
    <div className="flex max-h-screen min-h-screen relative">
      {/* Toggle Button for Mobile */}
      <button
        id="sidebar-toggle"
        onClick={toggleSidebar}
        className={`fixed bottom-9 ${
          sidebarOpen ? "left-64" : "left-4"
        } z-40 md:hidden bg-gradient-to-r from-blue-200 to-blue-500 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105`}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Side Drawer */}
      <div
        id="sidebar"
        className={`${
          nosidebar
            ? "hidden"
            : sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } w-64 md:w-72 max-h-screen bg-gradient-to-b from-blue-600 to-blue-400 text-white flex flex-col max-md:fixed md:relative  h-full transition-transform z-50 duration-300 ease-in-out shadow-2xl `}
      >
        {/* Sidebar Header */}
        <div
          onClick={() => navigate("/")}
          className="p-4 bg-gradient-to-r from-blue-100 to-blue-300 border-b border-blue-300 sticky top-0 z-10 flex items-center justify-between shadow-md cursor-pointer"
        >
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <img
                src="./csi-logo2.png"
                alt="Catur Pos Logo"
                className="w-10 h-10 object-contain rounded-xl"
              />
            </div>
            <span className="text-lg font-bold text-blue-900">Catur Pos</span>
          </div>

          {/* User Role */}
          {userInfo && (
            <span className="text-xs bg-white text-blue-800 px-3 py-1 rounded-full font-semibold border border-blue-200 shadow-sm">
              {userInfo.roleName}
            </span>
          )}
        </div>

        {/* Login Info (if logged in) */}
        {userInfo ? (
          <div
            className="px-6 hover:bg-blue-700  cursor-pointer py-4 flex items-center gap-3 transition-colors duration-200"
            onClick={() => navigate("/profile")}
          >
            <div className="avatar placeholder ">
              <div className="bg-white text-blue-800 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                <span>{userInfo.username.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="cursor-pointer">
              <p className="text-sm font-medium text-white truncate max-w-[160px]">
                {userInfo.username}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="text-xs bg-white text-red-600 hover:bg-red-50 px-2 py-1 rounded-full font-bold mt-1 flex items-center gap-1"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4 bg-blue-900">
            <button
              onClick={() => navigate("/login")}
              className="btn bg-white text-blue-800 hover:bg-blue-100 mx-auto w-full font-bold flex items-center justify-center gap-2"
            >
              <LogIn size={16} /> Login to your account
            </button>
          </div>
        )}

        {/* Sidebar Menu */}
        <div className="flex-1 overflow-y-auto lg:overflow-auto overflow-hidden p-2">
          <div className="flex items-center justify-center">
            <div
              role="alert"
              className="alert mt-2 bg-white text-blue-800 w-full"
            >
              <div className="flex items-center gap-2 gap-x-7">
                <div className="avatar placeholder flex flex-col items-center justify-center">
                  <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center">
                    <LayoutDashboard size={20} />
                  </div>
                </div>
                <span className="font-bold">Dashboard</span>
                <button
                  name="go to dashboard"
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
                >
                  <ArrowRight color="white" size={20} />
                </button>
              </div>
            </div>
          </div>
          {menuItems.map((group, idx) => (
            <div key={idx} className="mt-3">
              <h2 className="px-4 py-2 text-sm font-bold bg-blue-600 border-b border-blue-300">
                {group.title}
              </h2>
              <ul className="mt-1">
                {group.items.map((item, i) =>
                  !item.includes("-") ? (
                    <li
                      key={i}
                      className={`px-4 py-3 text-sm cursor-pointer justify-between flex items-center hover:bg-blue-700 transition-colors duration-200 ${
                        activeMenu === item ? "bg-blue-700 font-bold" : ""
                      }`}
                      onClick={() => handleMenuClick(item)}
                    >
                      <span>
                        {item
                          .replace("nosidebar", "")
                          .replace(".", "")
                          .replace("-", "")}
                      </span>
                      <div className="flex">
                        {userInfo?.blockedAccess?.includes(
                          `/${item
                            .replace(".", "")
                            .replace("nosidebar", "")
                            .replace(" ", "_")
                            .replace(" ", "_")
                            .replace(" ", "_")
                            .replace("-", "")
                            .toLowerCase()}`
                        ) ? (
                          <Lock size={16} className="text-red-400" />
                        ) : (
                          ""
                        )}
                        {item.includes(".") && (
                          <span className="badge bg-white text-blue-800 badge-xs ml-2 font-bold">
                            New
                          </span>
                        )}
                      </div>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-blue-600 text-blue-200 text-xs bg-blue-600">
          <h2 className="font-bold mb-2 text-white">Help & Support</h2>
          <p className="flex gap-2">
            <a
              href="/artikel_documentation"
              className="text-white hover:underline flex items-center gap-1"
            >
              <FileText size={14} /> Docs
            </a>
            <span>•</span>
            <button
              onClick={() =>
                document.getElementById("report_modal").showModal()
              }
              className="text-white hover:underline flex items-center gap-1"
            >
              <AlertCircle size={14} /> Report
            </button>
            <span>•</span>
            <a
              href="/about"
              className="text-white hover:underline flex items-center gap-1"
            >
              <Info size={14} /> About
            </a>
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 bg-gray-50 p-6 overflow-auto lg:overflow-auto transition-all duration-300 ease-in-out ${
          sidebarOpen ? "md:ml-0" : "md:ml-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default SideDrawer;
