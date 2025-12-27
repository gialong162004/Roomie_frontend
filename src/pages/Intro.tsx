import React from 'react';
import { Home, Search, Shield, Clock, MapPin, Heart, Users, Star } from 'lucide-react';

const IntroPage = () => {
  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Tìm kiếm dễ dàng",
      description: "Hệ thống tìm kiếm thông minh giúp bạn tìm được phòng trọ phù hợp chỉ trong vài giây"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Xác thực tin cậy",
      description: "Tất cả tin đăng đều được kiểm duyệt kỹ lưỡng, đảm bảo thông tin chính xác và an toàn"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Cập nhật liên tục",
      description: "Hàng trăm tin mới mỗi ngày, luôn có nhiều lựa chọn cho bạn"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Vị trí thuận lợi",
      description: "Tìm phòng theo khu vực mong muốn với bản đồ trực quan và chi tiết"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Lưu yêu thích",
      description: "Đánh dấu những phòng ưng ý để so sánh và liên hệ sau"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Kết nối trực tiếp",
      description: "Liên hệ ngay với chủ phòng qua điện thoại hoặc tin nhắn"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Phòng trọ" },
    { number: "50,000+", label: "Người dùng" },
    { number: "5,000+", label: "Giao dịch thành công" },
    { number: "4.8/5", label: "Đánh giá" }
  ];

  const steps = [
    {
      step: "01",
      title: "Tìm kiếm phòng",
      description: "Sử dụng bộ lọc thông minh để tìm phòng theo khu vực, giá cả và tiện nghi"
    },
    {
      step: "02",
      title: "Xem thông tin",
      description: "Xem chi tiết hình ảnh, mô tả và thông tin liên hệ của chủ phòng"
    },
    {
      step: "03",
      title: "Liên hệ trực tiếp",
      description: "Gọi điện hoặc nhắn tin với chủ phòng để hẹn lịch xem phòng"
    },
    {
      step: "04",
      title: "Chốt phòng",
      description: "Thoả thuận và ký hợp đồng, bắt đầu cuộc sống mới của bạn"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primaryDark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Home className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Tìm Phòng Trọ Dễ Dàng
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Nền tảng kết nối người tìm phòng và chủ nhà uy tín, nhanh chóng và an toàn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent hover:bg-accentHover text-textDark font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                Bắt đầu tìm phòng
              </button>
              <button className="bg-white text-primary hover:bg-secondary font-semibold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                Đăng tin cho thuê
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-textGray">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-textDark mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-lg text-textGray max-w-2xl mx-auto">
              Chúng tôi cung cấp giải pháp toàn diện giúp bạn tìm được ngôi nhà mơ ước một cách dễ dàng nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-cardBg p-8 rounded-xl border border-borderLight hover:border-primary hover:shadow-lg transition-all group"
              >
                <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-textDark mb-3">
                  {feature.title}
                </h3>
                <p className="text-textGray leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works Section */}
      <div className="bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-textDark mb-4">
              Quy trình tìm phòng
            </h2>
            <p className="text-lg text-textGray max-w-2xl mx-auto">
              4 bước đơn giản để tìm được phòng trọ ưng ý
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-cardBg p-6 rounded-xl border-2 border-borderLight hover:border-primary transition-all">
                  <div className="text-5xl font-bold text-primary/20 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-textDark mb-3">
                    {item.title}
                  </h3>
                  <p className="text-textGray leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="text-primary text-2xl">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-textDark mb-4">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-lg text-textGray max-w-2xl mx-auto">
              Hàng ngàn người đã tìm được phòng trọ mơ ước qua nền tảng của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Nguyễn Văn A",
                role: "Sinh viên",
                content: "Tôi đã tìm được phòng trọ gần trường chỉ sau 2 ngày. Giao diện dễ dùng, thông tin rõ ràng và chủ phòng rất nhiệt tình!",
                rating: 5
              },
              {
                name: "Trần Thị B",
                role: "Nhân viên văn phòng",
                content: "Nền tảng tuyệt vời! Giúp tôi tiết kiệm rất nhiều thời gian tìm kiếm. Tin đăng được kiểm duyệt kỹ nên rất an tâm.",
                rating: 5
              },
              {
                name: "Lê Văn C",
                role: "Chủ nhà",
                content: "Đăng tin rất dễ dàng và nhanh chóng. Nhiều người liên hệ, phòng cho thuê nhanh hơn mong đợi. Rất hài lòng!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="bg-cardBg p-6 rounded-xl border border-borderLight hover:shadow-lg transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-textGray mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-textDark">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-textGray">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary to-primaryDark text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sẵn sàng tìm phòng trọ của bạn?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Hàng ngàn phòng trọ đang chờ bạn khám phá. Bắt đầu ngay hôm nay!
          </p>
          <button className="bg-accent hover:bg-accentHover text-textDark font-semibold px-10 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg text-lg">
            Khám phá ngay
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-textDark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">Phòng Trọ</span>
              </div>
              <p className="text-white/70">
                Nền tảng tìm kiếm phòng trọ uy tín và hiệu quả nhất Việt Nam
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Về chúng tôi</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-primary transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Chính sách</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-white/70">
                <li>Email: support@phongtro.vn</li>
                <li>Hotline: 1900 xxxx</li>
                <li>Địa chỉ: Hồ Chí Minh</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2024 Phòng Trọ. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;