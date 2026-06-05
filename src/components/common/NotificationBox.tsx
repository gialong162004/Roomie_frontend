import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, Clock, Home, AlertCircle, MessageSquare } from "lucide-react";
import { NotificationAPI } from "../../api/api";
import { useSocket } from "../../hooks/useSocket";

interface Notification {
  _id: string;
  user: string;
  sender?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type: "message" | "system" | "review" | "booking" | "postApproval";
  content: string;
  post?: {
    _id: string;
    title: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface NotificationBoxProps {
  userId: string;
  token: string;
}

const NotificationBox = ({ userId, token }: NotificationBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Xử lý notification events
  const handleNewNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(getNotificationTitle(notification.type), {
        body: notification.content,
        icon: "/logo.png",
      });
    }
  };

  const handleNotificationUpdated = (updated: Notification) => {
    setNotifications((prev) => {
      const existing = prev.find((n) => n._id === updated._id);
      if (existing?.isRead === updated.isRead) {
        return prev;
      }
      return prev.map((n) => (n._id === updated._id ? updated : n));
    });
  };

  const handleNotificationsMarkedAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  const handleNotificationDeleted = (deletedId: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== deletedId));
  };

  // Khởi tạo socket với các handlers
  useSocket({
    currentUserId: userId,
    selectedContactId: null,
    onMessageHistory: () => {},
    onNewMessage: () => {},
    onMessageEdited: () => {},
    onMessageRecalled: () => {},
    onMessageRead: () => {},
    onNewNotification: handleNewNotification,
    onNotificationUpdated: handleNotificationUpdated,
    onNotificationDeleted: handleNotificationDeleted,
    onNotificationsMarkedAllRead: handleNotificationsMarkedAllRead,
  });

  // Fetch notifications từ API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await NotificationAPI.getAllNotifications();
        
        let data = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response?.data) {
          data = Array.isArray(response.data) ? response.data : response.data.data || [];
        }
        
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId && token) {
      fetchNotifications();
    }
  }, [userId, token]);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC để đóng dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const markAsRead = async (id: string) => {
    if (actionLoading) return;
    
    const previousNotifications = [...notifications];
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    
    try {
      setActionLoading(true);
      await NotificationAPI.readNotifications(id);
      console.log("✅ Marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      setNotifications(previousNotifications);
      alert("Không thể đánh dấu đã đọc. Vui lòng thử lại!");
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (actionLoading || unreadCount === 0) return;
    
    const previousNotifications = [...notifications];
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    
    try {
      setActionLoading(true);
      await NotificationAPI.readAllNotifications(userId);
      console.log("✅ All marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      setNotifications(previousNotifications);
      alert("Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại!");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (actionLoading) return;
    
    const previousNotifications = [...notifications];
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    
    try {
      setActionLoading(true);
      await NotificationAPI.deleteNotifications(id);
      console.log("✅ Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      setNotifications(previousNotifications);
      alert("Không thể xóa thông báo. Vui lòng thử lại!");
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationTitle = (type: Notification["type"]) => {
    switch (type) {
      case "postApproval":
        return "Bài đăng được phê duyệt";
      case "message":
        return "Tin nhắn mới";
      case "booking":
        return "Đặt lịch hẹn";
      case "review":
        return "Đánh giá mới";
      case "system":
        return "Thông báo hệ thống";
      default:
        return "Thông báo";
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "postApproval":
        return <Check className="w-5 h-5 text-primary" />;
      case "message":
        return <MessageSquare className="w-5 h-5 text-primary" />;
      case "booking":
        return <Clock className="w-5 h-5 text-accent" />;
      case "review":
        return <Home className="w-5 h-5 text-primaryLight" />;
      case "system":
        return <Bell className="w-5 h-5 text-textGray" />;
      default:
        return <AlertCircle className="w-5 h-5 text-textGray" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-secondary rounded-full transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-6 h-6 text-textDark" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold animate-pulse shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-cardBg border border-borderLight rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-borderLight bg-secondary">
            <h3 className="text-lg font-semibold text-textDark">Thông báo</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={actionLoading}
                className="text-sm text-primary hover:text-primaryDark font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (notifications?.length || 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-16 h-16 text-borderLight mb-3" />
                <p className="text-textGray text-center">
                  Chưa có thông báo nào
                </p>
              </div>
            ) : (
              (notifications || []).map((notif) => (
                <div
                  key={notif._id}
                  className={`p-4 border-b border-borderLight hover:bg-background transition-colors cursor-pointer ${
                    !notif.isRead ? "bg-secondary border-l-4 border-l-primary" : ""
                  }`}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`text-sm font-semibold ${
                            !notif.isRead ? "text-textDark" : "text-textGray"
                          }`}>
                            {getNotificationTitle(notif.type)}
                          </h4>
                          {notif.sender && (
                            <p className="text-xs text-textGray">
                              từ {notif.sender.name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif._id);
                          }}
                          disabled={actionLoading}
                          className="text-textGray hover:text-accent disabled:opacity-50 transition-colors"
                          aria-label="Xóa thông báo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-textGray mt-1">
                        {notif.content}
                      </p>

                      {notif.post && (
                        <p className="text-xs text-textGray mt-1 italic">
                          📝 {notif.post.title}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-textGray">
                          {formatTime(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBox;