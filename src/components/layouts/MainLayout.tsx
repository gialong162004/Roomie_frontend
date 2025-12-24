import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "../chat/ChatWidget";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-100">
        <Footer />
      </footer>
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
