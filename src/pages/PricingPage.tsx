import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SubscriptionAPI } from "../api/api";
import { useToast } from "../components/common/ToastProvider";

type SubscriptionPackage = {
  _id: string;
  name: string;
  price: number;
  days: number;
  priority_level?: number;
  featured?: boolean;
  features?: string[];
  description?: string;
};

type SubscriptionHistoryItem = {
  _id: string;
  package: {
    _id: string;
    name: string;
    price: number;
    days: number;
  };
  startAt: string;
  expiryAt: string;
  status: string;
  price: number;
};

type PaymentHistoryItem = {
  time: string;
  type: string;
  amount: number;
  status: string;
  transactionId: string;
  paymentMethod: string;
};

const CheckIcon = () => (
  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary shrink-0">
    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 12 12" stroke="currentColor">
      <polyline
        points="2,6 5,9 10,3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const toPackagesArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.packages)) return res.packages;
  if (Array.isArray(res?.content)) return res.content;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  return [];
};

const normalizePackage = (pkg: any): SubscriptionPackage | null => {
  const _id = String(pkg?._id ?? pkg?.id ?? "");
  const description = pkg?.description ? String(pkg.description) : undefined;
  if (!_id) return null;

  const name = String(pkg?.name ?? pkg?.title ?? "Gói");
  const price = Number(pkg?.price ?? pkg?.amount ?? 0);
  const days = Number(pkg?.days ?? pkg?.durationDays ?? pkg?.duration_days ?? 0);
  const priority_level =
    pkg?.priority_level !== undefined
      ? Number(pkg.priority_level)
      : pkg?.priorityLevel !== undefined
        ? Number(pkg.priorityLevel)
        : undefined;
  const featured = pkg?.featured !== undefined ? Boolean(pkg.featured) : undefined;

  const features = Array.isArray(pkg?.features)
    ? pkg.features.map((x: any) => String(x)).filter(Boolean)
    : undefined;

  return { _id, name, price, days, priority_level, featured, features, description };
};

const getPaymentUrl = (res: any): string | null => {
  const url =
    res?.order_url ??
    res?.orderUrl ??
    res?.payUrl ??
    res?.paymentUrl ??
    res?.checkoutUrl ??
    res?.data?.order_url ??
    res?.data?.orderUrl ??
    res?.data?.payUrl ??
    res?.data?.paymentUrl ??
    res?.data?.checkoutUrl;

  if (typeof url !== "string" || !url.trim()) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
};

export default function PricingPlans() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"packages" | "history" | "payment_history">(
    location.pathname === "/my-plans" ? "history" : "packages"
  );

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    setActiveTab(location.pathname === "/my-plans" ? "history" : "packages");
  }, [location.pathname]);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (activeTab !== "payment_history") return;
      setLoadingPayments(true);
      try {
        const res = (await SubscriptionAPI.historyPayment()) as any;
        setPaymentHistory(Array.isArray(res?.content) ? res.content : []);
      } catch (e) {
        console.error("Error fetching payment history:", e);
        showToast("Lỗi khi tải lịch sử giao dịch", { type: "error" });
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPaymentHistory();
  }, [activeTab, showToast]);

  // Fetch Packages
  useEffect(() => {
    let cancelled = false;

    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = (await SubscriptionAPI.getAllPackages()) as any;
        const raw = toPackagesArray(res);
        const normalized = raw
          .map(normalizePackage)
          .filter((x): x is SubscriptionPackage => Boolean(x));

        if (!cancelled) {
          setPackages(normalized);
        }
      } catch (e) {
        console.error("Error fetching subscription packages:", e);
        if (!cancelled) {
          showToast("Lỗi khi tải danh sách gói", { type: "error" });
          setPackages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPackages();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // Fetch History
  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = (await SubscriptionAPI.getSubscriptionHistory()) as any;
        const resData = res?.content || res?.data || res || [];
        if (!cancelled) {
          setHistory(Array.isArray(resData) ? resData : []);
        }
      } catch (e) {
        console.error("Error fetching subscription history:", e);
        if (!cancelled) {
          showToast("Lỗi khi tải lịch sử đăng ký", { type: "error" });
          setHistory([]);
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    if (activeTab === "history") {
      fetchHistory();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab, showToast]);

  const sortedPackages = useMemo(() => {
    const list = [...packages];
    list.sort((a, b) => {
      const pa = a.priority_level ?? Number.MAX_SAFE_INTEGER;
      const pb = b.priority_level ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return (b.price ?? 0) - (a.price ?? 0);
    });
    return list;
  }, [packages]);

  const handleSubscribe = async (packageId: string) => {
    if (payingId) return;
    setPayingId(packageId);

    try {
      const res = (await SubscriptionAPI.paySubscription(packageId)) as any;
      const url = getPaymentUrl(res);
      if (!url) {
        showToast("Không lấy được link thanh toán", { type: "error" });
        return;
      }
      window.location.href = url;
    } catch (e) {
      console.error("Error creating payment:", e);
      showToast("Tạo thanh toán thất bại", { type: "error" });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-medium text-textDark mb-1">Gói dịch vụ</h2>
        <p className="text-sm text-textGray mb-6">
          Quản lý và nâng cấp tài khoản để trải nghiệm đầy đủ tính năng
        </p>

        {/* Tabs */}
        <div className="flex border-b border-borderLight mb-6">
          <button
            onClick={() => {
              setActiveTab("packages");
              navigate("/pricing");
            }}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "packages"
                ? "border-primary text-primary"
                : "border-transparent text-textGray hover:text-textDark"
            }`}
          >
            Mua gói
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              navigate("/my-plans");
            }}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-textGray hover:text-textDark"
            }`}
          >
            Gói đã đăng kí
          </button>
          <button
            onClick={() => { setActiveTab("payment_history"); }}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === "payment_history" ? "border-primary text-primary" : "border-transparent text-textGray"}`}
          >
            Lịch sử giao dịch
          </button>
        </div>

        {activeTab === "packages" && (
          <>
            {loading ? (
              <div className="text-sm text-textGray">Đang tải danh sách gói...</div>
            ) : sortedPackages.length === 0 ? (
              <div className="text-sm text-textGray">Hiện chưa có gói nào.</div>
            ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {sortedPackages.map((pkg) => {
          const isFeatured = pkg.featured ?? (pkg.priority_level === 1);
          const featureList = pkg.description
            ? pkg.description.split("\n")
            : (pkg.features && pkg.features.length > 0 ? pkg.features : [
                              pkg.days ? `Sử dụng ${pkg.days} ngày` : "Thời hạn linh hoạt",
                              pkg.priority_level !== undefined
                                ? `Ưu tiên xử lý cấp ${pkg.priority_level}`
                                : "Ưu tiên xử lý",
                              "Hỗ trợ khách hàng",
                            ]);

          return (
            <div
              key={pkg._id}
              className={`bg-cardBg rounded-xl flex flex-col p-6 h-full ${ // Thêm h-full
                isFeatured ? "border-2 border-primary" : "border border-borderLight"
              }`}
            >
              {/* PHẦN 1: Tên gói và giá */}
              <div className="mb-4 relative pt-6"> {/* Thêm relative và pt-6 để dành chỗ cho badge */}
                {isFeatured && (
                  <span className="absolute top-0 left-0 text-xs font-medium px-3 py-1 rounded-full bg-secondary text-primaryDark">
                    Phổ biến nhất
                  </span>
                )}
                <h3 className="text-xl font-medium text-textDark">{pkg.name}</h3>
                <p className="text-3xl font-medium text-primary mt-2">
                  {(Number(pkg.price) || 0).toLocaleString("vi-VN")}
                  <span className="text-sm text-textGray font-normal">
                    {" "}đ{pkg.days ? ` / ${pkg.days} ngày` : ""}
                  </span>
                </p>
              </div>

              <hr className="border-borderLight mb-4" />

              {/* PHẦN 2: Mô tả/Tính năng - Dùng flex-grow để đẩy nút xuống dưới cùng */}
              <div className="flex-grow mb-6">
                <ul className="flex flex-col gap-2">
                  {featureList.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-textGray">
                      <CheckIcon />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PHẦN 3: Nút đăng ký - Luôn nằm ở đáy card */}
              <button
                onClick={() => handleSubscribe(pkg._id)}
                disabled={payingId === pkg._id}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                  isFeatured
                    ? "bg-primary hover:bg-primaryDark text-white"
                    : "border border-primaryLight text-primary hover:bg-secondary"
                }`}
              >
                {payingId === pkg._id ? "Đang tạo thanh toán..." : `Đăng ký ${pkg.name}`}
              </button>
            </div>
          );
        })}
        </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <div className="bg-cardBg rounded-xl border border-borderLight overflow-hidden">
            {loadingHistory ? (
              <div className="p-6 text-sm text-textGray">Đang tải lịch sử đăng kí...</div>
            ) : history.length === 0 ? (
              <div className="p-6 text-sm text-textGray">Bạn chưa đăng kí gói nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-borderLight text-textDark text-sm">
                      <th className="px-4 py-3 font-medium">Tên gói</th>
                      <th className="px-4 py-3 font-medium">Số tiền</th>
                      <th className="px-4 py-3 font-medium">Ngày bắt đầu</th>
                      <th className="px-4 py-3 font-medium">Ngày kết thúc</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, index) => {
                      const isExpired = new Date(item.expiryAt).getTime() < new Date().getTime();
                      return (
                        <tr key={item._id || index} className="border-b border-borderLight last:border-b-0 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-textDark font-medium">
                            {item.package?.name || "Gói nạp"}
                          </td>
                          <td className="px-4 py-3 text-sm text-primary font-medium">
                            {(item.price || item.package?.price || 0).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3 text-sm text-textGray">
                            {new Date(item.startAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-4 py-3 text-sm text-textGray">
                            {new Date(item.expiryAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {isExpired ? (
                              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-medium">Hết hạn</span>
                            ) : item.status === "active" ? (
                              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-medium">Đang hiệu lực</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium capitalize">{item.status || "Hoàn thành"}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === "payment_history" && (
          <div className="bg-cardBg rounded-xl border border-borderLight overflow-hidden">
            {loadingPayments ? (
              <div className="p-6 text-sm text-textGray">Đang tải lịch sử giao dịch...</div>
            ) : paymentHistory.length === 0 ? (
              <div className="p-6 text-sm text-textGray">Chưa có giao dịch nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-borderLight text-sm text-textGray">
                      <th className="px-4 py-3 font-medium">Thời gian</th>
                      <th className="px-4 py-3 font-medium">Loại</th>
                      <th className="px-4 py-3 font-medium">Phương thức</th>
                      <th className="px-4 py-3 font-medium">Số tiền</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((p) => (
                      <tr key={p.transactionId} className="border-b border-borderLight last:border-b-0">
                        <td className="px-4 py-3 text-sm text-textDark">
                          {new Date(p.time).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-textDark capitalize">
                          {p.type.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-sm text-textDark uppercase">
                          {p.paymentMethod}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-primary">
                          {p.amount.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-lg text-[11px] font-medium 
                            ${p.status === 'success' ? 'bg-green-100 text-green-700' : 
                              p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'}`}>
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
