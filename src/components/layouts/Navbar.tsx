import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AppointmentModal from "../AppointmentModal";
import NotificationBox from "../common/NotificationBox";

interface User {
  _id?: string;
  id?: string;
  name: string;
  avatar: string;
}

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Refs để xử lý click-outside cho cả 2 menu
  const dropdownRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Kiểm tra user đăng nhập và lấy token
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const savedToken = localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
    
    if (savedUser) setUser(savedUser);
    if (savedToken) setToken(savedToken);
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click ngoài đóng dropdown hoặc đóng mobile drawer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setAvatarOpen(false);
      }
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  const handleMenuClick = (path: string) => {
    setAvatarOpen(false);
    closeMenu();
    navigate(path);
  };

  const handleAppointmentClick = () => {
    setAvatarOpen(false);
    closeMenu();
    setModalOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    setAvatarOpen(false);
    closeMenu();
    navigate("/");
  };

  const userId = user?._id || user?.id || "";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || location.pathname !== "/" ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 md:px-16 h-20">
        {/* Logo */}
        <Link to="/" className="text-2xl font-semibold tracking-wide text-primary">
          ROOMIE
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-10 text-textDark font-medium uppercase tracking-wide items-center">
          <li><Link to="/" className="hover:text-primary">Trang chủ</Link></li>
          <li><Link to="/map" className="hover:text-primary">Bản đồ</Link></li>
          <li><Link to="/about" className="hover:text-primary">Giới thiệu</Link></li>

          {user ? (
            <div className="flex items-center gap-4">
              {userId && token && <NotificationBox userId={userId} token={token} />}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary focus:outline-none hover:border-primaryDark transition-colors"
                >
                  <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
                    <button onClick={() => handleMenuClick("/profile")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Hồ sơ</button>
                    <button onClick={handleAppointmentClick} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Lịch hẹn</button>
                    <button onClick={() => handleMenuClick("/saved-posts")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Lưu trữ</button>
                    <hr className="my-2" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">Đăng xuất</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="border border-primary px-5 py-2 rounded-full text-primary hover:bg-primary hover:text-white transition-all">
              Đăng nhập
            </Link>
          )}
        </ul>

        {/* Mobile Actions Zone */}
        <div className="flex md:hidden items-center gap-4">
          {user && userId && token && <NotificationBox userId={userId} token={token} />}
          <button className="text-3xl text-textGray focus:outline-none" onClick={toggleMenu}>
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Overlay (Lớp phủ mờ nền khi mở menu) */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity" onClick={closeMenu} />}

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-6 h-16 border-b">
          <span className="font-semibold text-lg text-primary">ROOMIE</span>
          <button onClick={closeMenu} className="text-2xl focus:outline-none">✕</button>
        </div>

        <ul className="flex flex-col gap-5 p-6 text-textGray font-medium uppercase tracking-wide">
          <li><Link to="/" onClick={closeMenu} className="hover:text-primary">Trang chủ</Link></li>
          <li><Link to="/map" onClick={closeMenu} className="hover:text-primary">Bản đồ</Link></li>
          <li><Link to="/about" onClick={closeMenu} className="hover:text-primary">Giới thiệu</Link></li>

          {user ? (
            <div className="flex flex-col gap-4 border-t pt-4 mt-2 normal-case">
              <div className="flex items-center gap-3 mb-2 bg-gray-50 p-2 rounded-lg">
                <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                <span className="font-semibold text-textDark truncate">{user.name}</span>
              </div>
              <button onClick={() => handleMenuClick("/profile")} className="text-left hover:text-primary">Hồ sơ</button>
              <button onClick={handleAppointmentClick} className="text-left hover:text-primary">Lịch hẹn</button>
              <button onClick={() => handleMenuClick("/saved-posts")} className="text-left hover:text-primary">Lưu trữ</button>
              <button onClick={handleLogout} className="text-left text-red-600 font-semibold mt-2 border-t pt-2">Đăng xuất</button>
            </div>
          ) : (
            <Link to="/login" onClick={closeMenu} className="border border-primary px-4 py-2 rounded-full text-center text-primary hover:bg-primary hover:text-white transition-all">
              Đăng nhập
            </Link>
          )}
        </ul>
      </div>

      {/* Modal lịch hẹn */}
      <AppointmentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </nav>
  );
};

export default Navbar;