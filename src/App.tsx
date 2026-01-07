import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import ProfilePage from "./pages/Profile";
import SavedPostsPage from "./components/posts/savedPost";
import IntroPage from "./pages/Intro";
import MapSearchRadius from "./pages/MapSearchRadius";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="saved-posts" element={<SavedPostsPage />} />
        <Route path="about" element={<IntroPage />} />
        <Route path="map" element={<MapSearchRadius />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="verify-otp" element={<VerifyOTP />} />
    </Routes>
  );
}

export default App;
