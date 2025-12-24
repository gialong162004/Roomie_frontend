import { useState, useEffect } from "react";
import { Edit2, Save, X, Home } from "lucide-react";
import { useParams } from "react-router-dom";
import CreatePostModal from "../components/posts/CreatePostModal";
import { UserAPI, PostAPI } from "../api/api";
import PostCard from "../components/posts/PostCard";
import { useToast } from "../components/common/ToastProvider";
import type { UserProfile } from "../types/user.type";
import type { Post } from "../types/post.type";


// Component InfoItem - ĐẶT NGOÀI để tránh re-create mỗi lần render
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

const ProfilePage = () => {
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
    introduce: ""
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // ----- Fetch current user ID để xác định isOwner -----
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

  // ----- Fetch profile từ API -----
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (userId) {
          // Xem profile của người khác
          res = await UserAPI.getPublicProfile(userId) as any;
        } else {
          // Xem profile của bản thân
          res = await UserAPI.getProfile() as any;
        }
        setProfile(res);
        
        // Xác định isOwner
        if (!userId || (currentUserId && (res._id === currentUserId || res.id === currentUserId))) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (error) {
        console.error("Lỗi lấy profile:", error);
        showToast("Không thể tải thông tin người dùng", {
          type: "error",
          subtitle: "Vui lòng thử lại sau",
        });
      }
    };
    
    if (userId || currentUserId !== null) {
      fetchProfile();
    }
  }, [userId, currentUserId]);

  // ----- Fetch posts của user -----
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoadingPosts(true);
        let res;
        if (userId && !isOwner) {
          // Lấy bài đăng công khai của người khác
          res = await PostAPI.getUserPost(userId) as any;
        } else {
          // Lấy bài đăng của bản thân
          res = await PostAPI.getMyPost() as any;
        }
        setPosts(res.content || res || []);
      } catch (error) {
        console.error("Lỗi lấy bài đăng:", error);
        showToast("Không thể tải bài đăng", {
          type: "error",
          subtitle: "Vui lòng thử lại sau",
        });
      } finally {
        setIsLoadingPosts(false);
      }
    };
    
    if (profile) {
      fetchPosts();
    }
  }, [userId, isOwner, profile]);

  if (!profile)
    return (
      <div className="p-6 text-center">Đang tải thông tin người dùng...</div>
    );

  const handleEdit = () => {
    setEditForm({
      name: profile.name || "",
      dateOfBirth: profile.dateOfBirth || "",
      address: profile.address || "",
      gender: profile.gender || "",
      email: profile.email || "",
      phone: profile.phone || "",
      introduce: profile.introduce || ""
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await UserAPI.updateProfile(editForm);
      setProfile({
        ...profile,
        ...editForm
      });
      setIsEditing(false);
      showToast("Cập nhật thông tin thành công!", {
        type: "success",
        subtitle: "Đã cập nhật lại thông tin",
      });
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      showToast("Có lỗi xảy ra!", {
        type: "error",
        subtitle: "Vui lòng thử lại.",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleAvatarEdit = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File quá lớn!", {
          type: "error",
          subtitle: "Vui lòng chọn ảnh nhỏ hơn 5MB",
        });
        return;
      }

      try {
        showToast("Đang tải ảnh lên...", {
          type: "info",
          subtitle: "Vui lòng đợi",
        });

        const response = await UserAPI.updateAvatar(file) as any;
        
        // Cập nhật avatar mới
        setProfile({
          ...profile,
          avatar: response.avatar || URL.createObjectURL(file)
        });

        showToast("Cập nhật avatar thành công!", {
          type: "success",
          subtitle: "Ảnh đại diện đã được thay đổi",
        });
      } catch (error) {
        console.error("Lỗi upload avatar:", error);
        showToast("Có lỗi xảy ra!", {
          type: "error",
          subtitle: "Không thể cập nhật ảnh đại diện",
        });
      }
    };
    input.click();
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Xử lý xóa bài đăng
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) {
      return;
    }

    try {
      await PostAPI.deletePost(postId);
      setPosts(posts.filter(post => post._id !== postId));
      showToast("Xóa bài đăng thành công!", {
        type: "success",
        subtitle: "Bài đăng đã được xóa",
      });
    } catch (error) {
      console.error("Lỗi xóa bài đăng:", error);
      showToast("Có lỗi xảy ra!", {
        type: "error",
        subtitle: "Không thể xóa bài đăng",
      });
    }
  };

  // Xử lý sửa bài đăng
  const handleEditPost = (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post) {
      setEditingPost(post);
      setIsModalOpen(true);
    }
  };

  // Xử lý sau khi tạo/cập nhật bài đăng thành công
  const handlePostSuccess = async () => {
    setIsModalOpen(false);
    setEditingPost(null);
    
    // Reload lại danh sách bài đăng
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

  // Xử lý đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PROFILE */}
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
                
                {/* Phần giới thiệu */}
                <div className="mt-4">
                  {isEditing ? (
                    <textarea
                      value={editForm.introduce}
                      onChange={(e) => handleInputChange('introduce', e.target.value)}
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
                <h3 className="text-lg font-semibold text-textDark mb-4">
                  Thông tin người dùng
                </h3>

                <InfoItem 
                  label="Họ tên" 
                  value={profile.name} 
                  field="name" 
                  isEditing={isEditing}
                  editForm={editForm}
                  onInputChange={handleInputChange}
                />
                {profile.dateOfBirth && (
                  <InfoItem
                    label="Ngày sinh"
                    value={profile.dateOfBirth}
                    field="dateOfBirth"
                    type="date"
                    isEditing={isEditing}
                    editForm={editForm}
                    onInputChange={handleInputChange}
                  />
                )}
                <InfoItem 
                  label="Địa chỉ" 
                  value={profile.address} 
                  field="address" 
                  isEditing={isEditing}
                  editForm={editForm}
                  onInputChange={handleInputChange}
                />

                {/* Giới tính */}
                <div className="flex justify-between py-3 border-b border-borderLight items-center gap-4">
                  <span className="text-textGray whitespace-nowrap">Giới tính</span>
                  {isEditing ? (
                    <select
                      value={editForm.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
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

                <InfoItem 
                  label="Email" 
                  value={profile.email} 
                  field="email" 
                  type="email" 
                  isEditing={false}
                  editForm={editForm}
                  onInputChange={handleInputChange}
                />
                <InfoItem 
                  label="Số điện thoại" 
                  value={profile.phone} 
                  field="phone" 
                  type="tel" 
                  isEditing={isEditing}
                  editForm={editForm}
                  onInputChange={handleInputChange}
                />
                
                {/* Nút chỉnh sửa thông tin */}
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

          {/* RIGHT POSTS */}
          <div className="lg:col-span-2">
            <div className="bg-cardBg rounded-lg shadow-sm p-6 mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-textDark">
                Bài đăng của {isOwner ? "bạn" : profile.name}
              </h3>

              {isOwner && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Đăng tin mới
                </button>
              )}
            </div>

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
                    {isOwner
                      ? "Bạn chưa có bài đăng nào"
                      : "Người dùng này chưa có bài đăng nào"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isOwner && (
          <CreatePostModal 
            isOpen={isModalOpen} 
            onClose={handleCloseModal}
            editingPost={editingPost}
            onSuccess={handlePostSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;