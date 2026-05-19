export const IMAGE_ASPECT_CLASSES = {
  square: 'aspect-square',
  heroDesktop: 'md:aspect-[8/3]',
  heroMobile: 'aspect-[4/3]',
  editorialCard: 'aspect-[4/5]'
};

export const BANNER_TYPE_OPTIONS = [
  {
    value: 'hero',
    label: 'Hero Banner',
    description: 'Desktop 1920x720 (8:3), mobile 1200x900 (4:3).'
  },
  {
    value: 'promo',
    label: 'Promo Banner',
    description: 'Khung 8:3 desktop và 4:3 mobile.'
  },
  {
    value: 'story',
    label: 'Story Banner',
    description: 'Nội dung editorial, preview theo khung vuông 1:1.'
  }
];

export function getBannerTypeMeta(type = 'hero') {
  return BANNER_TYPE_OPTIONS.find((option) => option.value === type) || BANNER_TYPE_OPTIONS[0];
}
