export const defaultCategoryBanner = {
  title: 'Trang sức được tuyển chọn',
  description: 'Khám phá các thiết kế thanh lịch dành cho quà tặng, sự kiện và phong cách hằng ngày.',
  image: '/images/category_default_.png',
  overlay: 'from-[#fff4df]/85 via-[#fffaf2]/50 to-[#e9eef7]/35'
};

export const categoryBannerMap = {
  nhan: {
    title: 'Nhẫn thanh lịch',
    description: 'Những thiết kế nhẫn tinh gọn, dễ đeo hằng ngày và phù hợp cho nhiều khoảnh khắc đặc biệt.',
    image: '/banners/categories/rings-banner.jpg',
    overlay: 'from-[#fff4df]/85 via-[#fffaf2]/45 to-[#ead5a2]/28'
  },
  'bong-tai': {
    title: 'Bông tai nổi bật vừa đủ',
    description: 'Điểm nhấn tinh tế cho gương mặt với chất liệu và kiểu dáng được chọn lọc.',
    image: '/banners/categories/earrings-banner.jpg',
    overlay: 'from-[#f7f3ff]/85 via-[#fffafc]/45 to-[#ddd7f5]/28'
  },
  'day-chuyen': {
    title: 'Dây chuyền thanh nhã',
    description: 'Các mẫu dây chuyền mềm mại, dễ phối và phù hợp nhiều phong cách sử dụng.',
    image: '/banners/categories/necklaces-banner.jpg',
    overlay: 'from-[#f4efe8]/85 via-[#fffaf4]/45 to-[#eed6bd]/28'
  },
  'lac-tay': {
    title: 'Lắc tay tinh tế',
    description: 'Tạo điểm nhấn nhẹ nhàng cho cổ tay với những thiết kế nữ tính và hiện đại.',
    image: '/banners/categories/bracelets-banner.jpg',
    overlay: 'from-[#f0f8f2]/85 via-[#fffdf8]/45 to-[#d8eadb]/28'
  },
  'vong-co': {
    title: 'Vòng cổ sang trọng',
    description: 'Những lựa chọn vòng cổ được hoàn thiện để tôn lên vẻ thanh lịch và cân đối.',
    image: '/banners/categories/necklaces-banner.jpg',
    overlay: 'from-[#eef5fb]/85 via-[#fffdfb]/45 to-[#d6e4f4]/28'
  },
  'trang-suc-cuoi': {
    title: 'Trang sức cưới tinh tế',
    description: 'Bộ sưu tập dành cho ngày trọng đại với tinh thần thanh lịch, nhẹ nhàng và bền lâu.',
    image: '/banners/categories/wedding-banner.jpg',
    overlay: 'from-[#fff1f4]/88 via-[#fffaf6]/48 to-[#efdae2]/30'
  },
  'dong-ho': {
    title: 'Đồng hồ hiện đại',
    description: 'Những mẫu đồng hồ thời trang hoàn thiện chỉn chu, phù hợp cho công việc và sự kiện.',
    image: '/banners/categories/watches-banner.jpg',
    overlay: 'from-[#edf1f6]/88 via-[#fffdfb]/48 to-[#dce5ef]/30'
  }
};

export function getCategoryBannerConfig(categorySlug, categoryName) {
  const matchedBanner = categorySlug ? categoryBannerMap[categorySlug] : null;

  if (matchedBanner) {
    return matchedBanner;
  }

  if (categoryName) {
    return {
      ...defaultCategoryBanner,
      title: categoryName,
      description: 'Khám phá các thiết kế nổi bật được sắp xếp rõ ràng để hành trình mua sắm trở nên dễ dàng hơn.'
    };
  }

  return defaultCategoryBanner;
}
