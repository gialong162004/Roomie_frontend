import { useState, useEffect } from "react";
import { Edit2, Save, X, Home, Star, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CreatePostModal from "../components/posts/CreatePostModal";
import { UserAPI, PostAPI, ReviewAPI } from "../api/api";
import PostCard from "../components/posts/PostCard";
import { useToast } from "../components/common/ToastProvider";
import type { UserProfile } from "../types/user.type";
import type { Post } from "../types/post.type";

// ---- Types ----
interface ReviewerInfo {
  _id: string;
  name: string;
  avatar: string;
}
interface Review {
  _id: string;
  reviewer: ReviewerInfo;  // field thực tế từ API
  reviewee: string;
  rating: number;
  text?: string;
  createdAt: string;
  updatedAt?: string;
  conversation?: string;
}

// Helper an toàn đề phòng data bất ngờ
const getReviewer = (review: Review): ReviewerInfo => {
  const r = review.reviewer;
  if (r && typeof r === "object" && r.name) return r;
  return { _id: "", name: "Người dùng", avatar: "" };
};

// ---- StarRating ----
const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const [hovered, setHovered] = useState(0);
  const px = size === "sm" ? 14 : size === "lg" ? 28 : 20;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={px}
          height={px}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"} ${
            star <= (readonly ? value : hovered || value)
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-gray-300"
          }`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );
};

// ---- ReviewCard ----
const ReviewCard = ({ review }: { review: Review }) => {
  const reviewer = getReviewer(review);
  const content = review.text || "";
  const dateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("vi-VN")
    : "";

  return (
    <div className="bg-white rounded-xl border border-borderLight p-4 flex gap-3">
      {reviewer.avatar ? (
        <img
          src={reviewer.avatar}
          alt={reviewer.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-borderLight"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 border border-borderLight">
          {reviewer.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-semibold text-textDark text-sm">{reviewer.name}</span>
          {dateStr && <span className="text-xs text-textGray">{dateStr}</span>}
        </div>
        <StarRating value={review.rating ?? 0} readonly size="sm" />
        {content && (
          <p className="mt-2 text-sm text-textDark leading-relaxed">{content}</p>
        )}
      </div>
    </div>
  );
};

// ---- CreateReviewModal ----
const CreateReviewModal = ({
  targetName,
  onSubmit,
  onClose,
}: {
  targetName: string;
  onSubmit: (rating: number, text: string) => Promise<void>;
  onClose: () => void;
}) => {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    await onSubmit(rating, text);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-textDark">Đánh giá {targetName}</h3>
          <button onClick={onClose} className="text-textGray hover:text-textDark transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-textGray mb-2">Xếp hạng của bạn *</p>
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating === 0 && (
            <p className="text-xs text-red-400 mt-1">Vui lòng chọn số sao</p>
          )}
        </div>

        <div className="mb-5">
          <p className="text-sm text-textGray mb-2">Nhận xét (tuỳ chọn)</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            rows={4}
            className="w-full px-3 py-2 border border-borderLight rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-white text-textDark"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-borderLight text-textGray text-sm hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primaryDark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- InfoItem ----
const InfoItem = ({
  label,
  value,
  field,
  type = "text",
  isEditing,
  editForm,
  onInputChange,
}: {
  label: string;
  value: string | undefined;
  field: string;
  type?: string;
  isEditing: boolean;
  editForm: any;
  onInputChange: (field: string, value: string) => void;
}) => (
  <div className="flex justify-between py-3 border-b border-borderLight items-center gap-4">
    <span className="text-textGray whitespace-nowrap">{label}</span>
    {isEditing ? (
      <input
        type={type}
        value={editForm[field] || ""}
        onChange={(e) => onInputChange(field, e.target.value)}
        className="flex-1 px-3 py-2 border border-borderLight rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white text-textDark"
      />
    ) : (
      <span className="font-medium text-textDark text-right">{value || "-"}</span>
    )}
  </div>
);

// ============================================================
// MAIN ProfilePage
// ============================================================
const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    dateOfBirth: "",
    address: "",
    gender: "",
    email: "",
    phone: "",
    introduce: "",
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // ---- Review states ----
  type TabType = "posts" | "reviews";
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [canReview, setCanReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // ----- Fetch current user ID -----
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await UserAPI.getProfile() as any;
        setCurrentUserId(res._id || res.id);
      } catch (error) {
        console.error("Lỗi lấy thông tin user hiện tại:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // ----- Fetch profile -----
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (userId) {
          res = await UserAPI.getPublicProfile(userId) as any;
        } else {
          res = await UserAPI.getProfile() as any;
        }
        setProfile(res);
        if (!userId || (currentUserId && (res._id === currentUserId || res.id === currentUserId))) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (error) {
        console.error("Lỗi lấy profile:", error);
        showToast("Không thể tải thông tin người dùng", { type: "error", subtitle: "Vui lòng thử lại sau" });
      }
    };
    if (userId || currentUserId !== null) fetchProfile();
  }, [userId, currentUserId]);

  // ----- Fetch posts -----
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        let res;
        if (userId && !isOwner) {
          res = await PostAPI.getUserPost(userId) as any;
        } else {
          res = await PostAPI.getMyPost() as any;
        }
        setPosts(res.content || res || []);
      } catch (error) {
        console.error("Lỗi lấy bài đăng:", error);
        showToast("Không thể tải bài đăng", { type: "error", subtitle: "Vui lòng thử lại sau" });
      } finally {
        setIsLoadingPosts(false);
      }
    };
    if (profile) fetchPosts();
  }, [userId, isOwner, profile]);

  // ----- Fetch reviews -----
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoadingReviews(true);
        let res: any;
        if (userId && !isOwner) {
          res = await ReviewAPI.getReview(userId);
        } else {
          res = await ReviewAPI.getReviewsForMe();
        }
        const list: Review[] = res?.content || [];
        setReviews(list);
        // Dùng summary.avgRating từ API nếu có, fallback tự tính
        if (res?.summary?.avgRating != null) {
          setAvgRating(Math.round(res.summary.avgRating * 10) / 10);
        } else if (list.length > 0) {
          const avg = list.reduce((sum: number, r: Review) => sum + r.rating, 0) / list.length;
          setAvgRating(Math.round(avg * 10) / 10);
        } else {
          setAvgRating(0);
        }
      } catch (error) {
        console.error("Lỗi lấy đánh giá:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    if (profile) fetchReviews();
  }, [userId, isOwner, profile]);

  // ----- Check review eligibility -----
  useEffect(() => {
    const checkEligibility = async () => {
      if (!userId || isOwner) return;
      try {
        const res = await ReviewAPI.checkReviewEligibility(userId) as any;
        console.log("[Review] eligibility raw response:", res);
        const eligible = res?.eligible ?? res?.canReview ?? res?.data?.eligible ?? false;
        console.log("[Review] eligible =", eligible);
        setCanReview(eligible);
      } catch (err) {
        console.error("[Review] eligibility error:", err);
        setCanReview(false);
      }
    };
    if (profile && !isOwner) checkEligibility();
  }, [userId, isOwner, profile]);

  // Debug: log canReview state (xóa sau khi fix xong)
  useEffect(() => {
    if (!isOwner) console.log("[Review] canReview =", canReview, "| userId =", userId);
  }, [canReview]);

  if (!profile)
    return <div className="p-6 text-center">Đang tải thông tin người dùng...</div>;

  // ---- Handlers ----
  const handleEdit = () => {
    setEditForm({
      name: profile.name || "",
      dateOfBirth: profile.dateOfBirth || "",
      address: profile.address || "",
      gender: profile.gender || "",
      email: profile.email || "",
      phone: profile.phone || "",
      introduce: profile.introduce || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await UserAPI.updateProfile(editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      showToast("Cập nhật thông tin thành công!", { type: "success", subtitle: "Đã cập nhật lại thông tin" });
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      showToast("Có lỗi xảy ra!", { type: "error", subtitle: "Vui lòng thử lại." });
    }
  };

  const handleCancel = () => setIsEditing(false);

  const handleAvatarEdit = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast("File quá lớn!", { type: "error", subtitle: "Vui lòng chọn ảnh nhỏ hơn 5MB" });
        return;
      }
      try {
        showToast("Đang tải ảnh lên...", { type: "info", subtitle: "Vui lòng đợi" });
        const response = await UserAPI.updateAvatar(file) as any;
        setProfile({ ...profile, avatar: response.avatar || URL.createObjectURL(file) });
        showToast("Cập nhật avatar thành công!", { type: "success", subtitle: "Ảnh đại diện đã được thay đổi" });
      } catch (error) {
        console.error("Lỗi upload avatar:", error);
        showToast("Có lỗi xảy ra!", { type: "error", subtitle: "Không thể cập nhật ảnh đại diện" });
      }
    };
    input.click();
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;
    try {
      await PostAPI.deletePost(postId);
      setPosts(posts.filter((post) => post._id !== postId));
      showToast("Xóa bài đăng thành công!", { type: "success", subtitle: "Bài đăng đã được xóa" });
    } catch (error) {
      console.error("Lỗi xóa bài đăng:", error);
      showToast("Có lỗi xảy ra!", { type: "error", subtitle: "Không thể xóa bài đăng" });
    }
  };

  const handleEditPost = (postId: string) => {
    const post = posts.find((p) => p._id === postId);
    if (post) { setEditingPost(post); setIsModalOpen(true); }
  };

  const handlePostSuccess = async () => {
    setIsModalOpen(false);
    setEditingPost(null);
    try {
      const res = await PostAPI.getMyPost() as any;
      setPosts(res.content || res || []);
      showToast(editingPost ? "Cập nhật bài đăng thành công!" : "Đăng bài thành công!", {
        type: "success",
        subtitle: editingPost ? "Bài đăng đã được cập nhật" : "Bài đăng mới đã được tạo",
      });
    } catch (error) {
      console.error("Lỗi tải lại bài đăng:", error);
    }
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingPost(null); };

  // ---- Submit review ----
  const handleSubmitReview = async (rating: number, text: string) => {
    if (!userId) return;
    try {
      await ReviewAPI.createReview(userId, rating, text);
      const res: any = await ReviewAPI.getReview(userId);
      const list: Review[] = res?.content || [];
      setReviews(list);
      if (res?.summary?.avgRating != null) {
        setAvgRating(Math.round(res.summary.avgRating * 10) / 10);
      } else if (list.length > 0) {
        const avg = list.reduce((sum: number, r: Review) => sum + r.rating, 0) / list.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
      setCanReview(false);
      setShowReviewModal(false);
      showToast("Gửi đánh giá thành công!", { type: "success", subtitle: "Cảm ơn bạn đã đánh giá" });
    } catch {
      showToast("Có lỗi xảy ra!", { type: "error", subtitle: "Không thể gửi đánh giá" });
    }
  };

  // ============================================================
  return (
    <div className="min-h-screen bg-background py-8 px-4 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ===== LEFT PROFILE (giữ nguyên gốc) ===== */}
          <div className="lg:col-span-1">
            <div className="bg-cardBg rounded-lg shadow-sm overflow-hidden sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
              <div className="p-6 text-center border-b border-borderLight">
                {/* Avatar */}
                <div className="relative inline-block">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-borderLight"
                  />
                  {isOwner && (
                    <button
                      onClick={handleAvatarEdit}
                      className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primaryDark transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h2 className="mt-4 text-xl font-bold text-textDark">{profile.name}</h2>

                {/* ★ MỚI: Badge điểm trung bình */}
                {reviews.length > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-700">{avgRating}</span>
                    <span className="text-xs text-amber-500">({reviews.length} đánh giá)</span>
                  </div>
                )}

                {/* Phần giới thiệu */}
                <div className="mt-4">
                  {isEditing ? (
                    <textarea
                      value={editForm.introduce}
                      onChange={(e) => handleInputChange("introduce", e.target.value)}
                      placeholder="Giới thiệu về bản thân..."
                      className="w-full px-3 py-2 border border-borderLight rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none bg-white"
                      rows={4}
                    />
                  ) : (
                    <p className="text-sm text-textGray text-center">
                      {profile.introduce || "Chưa có giới thiệu"}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-textDark mb-4">Thông tin người dùng</h3>

                <InfoItem label="Họ tên" value={profile.name} field="name" isEditing={isEditing} editForm={editForm} onInputChange={handleInputChange} />
                {profile.dateOfBirth && (
                  <InfoItem label="Ngày sinh" value={profile.dateOfBirth} field="dateOfBirth" type="date" isEditing={isEditing} editForm={editForm} onInputChange={handleInputChange} />
                )}
                <InfoItem label="Địa chỉ" value={profile.address} field="address" isEditing={isEditing} editForm={editForm} onInputChange={handleInputChange} />

                {/* Giới tính */}
                <div className="flex justify-between py-3 border-b border-borderLight items-center gap-4">
                  <span className="text-textGray whitespace-nowrap">Giới tính</span>
                  {isEditing ? (
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className="flex-1 px-3 py-2 border border-borderLight rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  ) : (
                    <span className="font-medium text-textDark text-right">{profile.gender}</span>
                  )}
                </div>

                <InfoItem label="Email" value={profile.email} field="email" type="email" isEditing={false} editForm={editForm} onInputChange={handleInputChange} />
                <InfoItem label="Số điện thoại" value={profile.phone} field="phone" type="tel" isEditing={isEditing} editForm={editForm} onInputChange={handleInputChange} />

                {/* ★ MỚI: Nút đánh giá (khi xem profile người khác & đủ điều kiện) */}
                {!isOwner && canReview && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="mt-4 w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition flex items-center justify-center gap-2 font-medium"
                  >
                    <Star className="w-4 h-4" />
                    Đánh giá người dùng
                  </button>
                )}

                {/* ★ MỚI: Thông báo đã đánh giá */}
                {!isOwner && !canReview && (
                  <p className="mt-4 text-center text-xs text-textGray bg-gray-50 rounded-lg py-2 px-3">
                    Bạn đã đánh giá người dùng này
                  </p>
                )}

                {/* Nút chỉnh sửa thông tin (owner) */}
                {isOwner && !isEditing && (
                  <button
                    onClick={handleEdit}
                    className="mt-4 w-full py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa thông tin
                  </button>
                )}

                {/* Action buttons khi đang edit */}
                {isEditing && isOwner && (
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={handleSave}
                      className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-full py-2 bg-gray-300 text-textDark rounded-lg hover:bg-gray-400 transition flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== RIGHT: POSTS + REVIEWS ===== */}
          <div className="lg:col-span-2">

            {/* Header + Tab bar (gộp vào 1 card) */}
            <div className="bg-cardBg rounded-lg shadow-sm mb-6 overflow-hidden">
              {/* Title row — giữ nguyên gốc */}
              <div className="px-6 pt-5 pb-0 flex items-center justify-between">
                <h3 className="text-xl font-bold text-textDark">
                  {activeTab === "posts"
                    ? `Bài đăng của ${isOwner ? "bạn" : profile.name}`
                    : `Đánh giá về ${isOwner ? "bạn" : profile.name}`}
                </h3>

                {/* Nút owner (chỉ hiện ở tab posts) */}
                {isOwner && activeTab === "posts" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate("/pricing")}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition text-sm"
                    >
                      Đăng kí gói
                    </button>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition flex items-center gap-2 text-sm"
                    >
                      <Home className="w-4 h-4" />
                      Đăng tin mới
                    </button>
                  </div>
                )}

                {/* ★ MỚI: Nút "Viết đánh giá" ở header khi ở tab reviews */}
                {!isOwner && canReview && activeTab === "reviews" && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
                  >
                    <Star className="w-4 h-4" />
                    Viết đánh giá
                  </button>
                )}
              </div>

              {/* ★ MỚI: Tab bar */}
              <div className="flex mt-4 border-t border-borderLight">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 ${
                    activeTab === "posts"
                      ? "text-primary border-primary"
                      : "text-textGray border-transparent hover:text-textDark"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Bài đăng
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    activeTab === "posts" ? "bg-primary/10 text-primary" : "bg-gray-100 text-textGray"
                  }`}>
                    {posts.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 ${
                    activeTab === "reviews"
                      ? "text-primary border-primary"
                      : "text-textGray border-transparent hover:text-textDark"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Đánh giá
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    activeTab === "reviews" ? "bg-primary/10 text-primary" : "bg-gray-100 text-textGray"
                  }`}>
                    {reviews.length}
                  </span>
                </button>
              </div>
            </div>

            {/* ===== Tab: Bài đăng (giữ nguyên gốc) ===== */}
            {activeTab === "posts" && (
              <div className="space-y-4">
                {isLoadingPosts ? (
                  <div className="bg-cardBg rounded-lg shadow-sm p-12 text-center">
                    <p className="text-textGray">Đang tải bài đăng...</p>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      isOwner={isOwner}
                      onEdit={handleEditPost}
                      onDelete={handleDeletePost}
                    />
                  ))
                ) : (
                  <div className="bg-cardBg rounded-lg shadow-sm p-12 text-center">
                    <Home className="w-16 h-16 text-borderLight mx-auto mb-4" />
                    <p className="text-textGray">
                      {isOwner ? "Bạn chưa có bài đăng nào" : "Người dùng này chưa có bài đăng nào"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ===== Tab: Đánh giá ===== */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                {/* Rating summary (chỉ hiện khi có review) */}
                {reviews.length > 0 && (
                  <div className="bg-cardBg rounded-lg shadow-sm p-5 flex items-center gap-6">
                    <div className="text-center flex-shrink-0">
                      <p className="text-5xl font-bold text-amber-500">{avgRating}</p>
                      <div className="mt-1">
                        <StarRating value={Math.round(avgRating)} readonly size="sm" />
                      </div>
                      <p className="text-xs text-textGray mt-1">{reviews.length} đánh giá</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => r.rating === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-textGray w-3">{star}</span>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-textGray w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isLoadingReviews ? (
                  <div className="bg-cardBg rounded-lg shadow-sm p-12 text-center">
                    <p className="text-textGray">Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="bg-cardBg rounded-lg shadow-sm p-12 text-center">
                    <Star className="w-16 h-16 text-borderLight mx-auto mb-4" />
                    <p className="text-textGray mb-3">
                      {isOwner ? "Bạn chưa có đánh giá nào" : "Người dùng này chưa có đánh giá nào"}
                    </p>
                    {!isOwner && canReview && (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="px-5 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition"
                      >
                        Hãy là người đầu tiên đánh giá
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {isOwner && (
          <CreatePostModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            editingPost={editingPost}
            onSuccess={handlePostSuccess}
          />
        )}

        {showReviewModal && (
          <CreateReviewModal
            targetName={profile.name}
            onSubmit={handleSubmitReview}
            onClose={() => setShowReviewModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;