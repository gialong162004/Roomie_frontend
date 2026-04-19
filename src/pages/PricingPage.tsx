import { useEffect, useMemo, useState } from "react";
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

  return { _id, name, price, days, priority_level, featured, features };
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

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

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
      <h2 className="text-2xl font-medium text-textDark mb-1">Chọn gói nạp</h2>
      <p className="text-sm text-textGray mb-6">
        Nâng cấp tài khoản để trải nghiệm đầy đủ tính năng
      </p>

      {loading ? (
        <div className="text-sm text-textGray">Đang tải danh sách gói...</div>
      ) : sortedPackages.length === 0 ? (
        <div className="text-sm text-textGray">Hiện chưa có gói nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {sortedPackages.map((pkg) => {
            const isFeatured = pkg.featured ?? (pkg.priority_level === 1);
            const featureList =
              pkg.features && pkg.features.length > 0
                ? pkg.features
                : [
                    pkg.days ? `Sử dụng ${pkg.days} ngày` : "Thời hạn linh hoạt",
                    pkg.priority_level !== undefined
                      ? `Ưu tiên xử lý cấp ${pkg.priority_level}`
                      : "Ưu tiên xử lý",
                    "Hỗ trợ khách hàng",
                  ];

            return (
              <div
                key={pkg._id}
                className={`bg-cardBg rounded-xl flex flex-col gap-4 p-6 ${
                  isFeatured
                    ? "border-2 border-primary"
                    : "border border-borderLight"
                }`}
              >
                <div>
                  {isFeatured && (
                    <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-secondary text-primaryDark mb-2">
                      Phổ biến nhất
                    </span>
                  )}
                  <h3 className="text-xl font-medium text-textDark">{pkg.name}</h3>
                </div>

                <p className="text-3xl font-medium text-primary">
                  {(Number(pkg.price) || 0).toLocaleString("vi-VN")}
                  <span className="text-sm text-textGray font-normal">
                    {" "}đ{pkg.days ? ` / ${pkg.days} ngày` : ""}
                  </span>
                </p>

                <hr className="border-borderLight" />

                <ul className="flex flex-col gap-2">
                  {featureList.map((feat: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-textGray"
                    >
                      <CheckIcon />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(pkg._id)}
                  disabled={payingId === pkg._id}
                  className={`mt-auto py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                    isFeatured
                      ? "bg-primary hover:bg-primaryDark text-white"
                      : "border border-primaryLight text-primary hover:bg-secondary"
                  }`}
                >
                  {payingId === pkg._id
                    ? "Đang tạo thanh toán..."
                    : `Đăng ký ${pkg.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
