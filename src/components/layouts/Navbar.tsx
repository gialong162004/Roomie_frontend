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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Kiểm tra user đăng nhập và lấy token
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const savedToken = localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
    
    if (savedUser) {
      setUser(savedUser);
    }
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click ngoài dropdown đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  const handleMenuClick = (path: string) => {
    setAvatarOpen(false);
    navigate(path);
  };

  const handleAppointmentClick = () => {
    setAvatarOpen(false);
    setModalOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    setAvatarOpen(false);
    navigate("/");
  };

  // Lấy userId từ object user
  const userId = user?._id || user?.id || "";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || location.pathname !== "/" ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-8 md:px-16 h-20">
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
              {/* Notification Box - Chỉ hiển thị khi có userId và token */}
              {userId && token && (
                <NotificationBox userId={userId} token={token} />
              )}

              {/* Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary focus:outline-none hover:border-primaryDark transition-colors"
                >
                  <img src={user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => handleMenuClick("/profile")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      Hồ sơ
                    </button>
                    <button
                      onClick={handleAppointmentClick}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      Lịch hẹn
                    </button>
                    <button
                      onClick={() => handleMenuClick("/saved-posts")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      Lưu trữ
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="border border-primary px-5 py-2 rounded-full transition-all text-primary hover:bg-primary hover:text-white"
            >
              Đăng nhập
            </Link>
          )}
        </ul>

        {/* Mobile Button */}
        <button
          className="md:hidden text-3xl text-textGray focus:outline-none"
          onClick={toggleMenu}
        >
          ☰
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-6 h-16 border-b">
          <span className="font-semibold text-lg text-primary">ROOMIE</span>
          <button onClick={closeMenu} className="text-2xl">✕</button>
        </div>

        <ul className="flex flex-col gap-5 p-6 text-textGray font-medium uppercase tracking-wide">
          <li><Link to="/" onClick={closeMenu} className="hover:text-primary">Trang chủ</Link></li>
          <li><Link to="/rooms" onClick={closeMenu} className="hover:text-primary">Phòng trọ</Link></li>
          <li><Link to="/about" onClick={closeMenu} className="hover:text-primary">Giới thiệu</Link></li>
          <li><Link to="/contact" onClick={closeMenu} className="hover:text-primary">Liên hệ</Link></li>

          {user ? (
            <div className="flex flex-col gap-2 border-t pt-4 mt-2">
              <Link
                to="/profile"
                onClick={closeMenu}
                className="hover:text-primary transition-colors"
              >
                Hồ sơ
              </Link>
              <button
                onClick={() => {
                  closeMenu();
                  setModalOpen(true);
                }}
                className="text-left hover:text-primary transition-colors"
              >
                Lịch hẹn
              </button>
              <Link
                to="/saved-posts"
                onClick={closeMenu}
                className="hover:text-primary transition-colors"
              >
                Lưu trữ
              </Link>
              <button
                className="text-left hover:text-red-500 transition-colors"
                onClick={() => {
                  setUser(null);
                  setToken("");
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  localStorage.removeItem("accessToken");
                  closeMenu();
                  navigate("/");
                }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="border border-primary px-4 py-2 rounded-full text-center transition-all text-primary hover:bg-primary hover:text-white"
            >
              Đăng nhập
            </Link>
          )}
        </ul>
      </div>

      {/* Modal lịch hẹn */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;