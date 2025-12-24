const FooterTailwind = () => {
  return (
    <footer className="text-center py-6 bg-gray-100">
      <h2 className="mb-2 text-lg font-bold text-[#D97A36] tracking-wide">
        ROOMIE
      </h2>
      <div className="mb-2 text-base space-x-3">
        <i className="fa-brands fa-github cursor-pointer hover:text-gray-700 transition-colors"></i>
        <i className="fa-brands fa-facebook cursor-pointer hover:text-blue-600 transition-colors"></i>
        <i className="fa-brands fa-instagram cursor-pointer hover:text-pink-500 transition-colors"></i>
      </div>
      <p className="text-sm text-gray-500">
        © 2025 Roomie - Find Your Perfect Space
      </p>
    </footer>
  );
};

export default FooterTailwind;
