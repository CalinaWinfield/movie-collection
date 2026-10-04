export const FORMATS_BY_CATEGORY = {
  movie: [
    { value: '4K UHD', label: '4K UHD' },
    { value: 'Blu-ray', label: 'Blu-ray' },
    { value: 'Steelbook', label: 'Steelbook' },
    { value: 'Criterion', label: 'Criterion Collection' },
    { value: 'DVD', label: 'DVD' },
    { value: 'VHS', label: 'VHS' },
    { value: 'LaserDisc', label: 'LaserDisc' },
    { value: 'Digital', label: 'Digital' },
  ],
  tv: [
    { value: '4K UHD', label: '4K UHD' },
    { value: 'Blu-ray', label: 'Blu-ray' },
    { value: 'DVD', label: 'DVD' },
    { value: 'Steelbook', label: 'Steelbook' },
    { value: 'Criterion', label: 'Criterion Collection' },
    { value: 'VHS', label: 'VHS' },
    { value: 'Digital', label: 'Digital' },
  ],
  game: [
    { value: 'Nintendo Switch', label: 'Nintendo Switch' },
    { value: 'PlayStation 5', label: 'PlayStation 5' },
    { value: 'PlayStation 4', label: 'PlayStation 4' },
    { value: 'PlayStation 3', label: 'PlayStation 3' },
    { value: 'PlayStation 2', label: 'PlayStation 2' },
    { value: 'PlayStation 1', label: 'PlayStation 1' },
    { value: 'Xbox Series X', label: 'Xbox Series X' },
    { value: 'Xbox One', label: 'Xbox One' },
    { value: 'Xbox 360', label: 'Xbox 360' },
    { value: 'Nintendo 3DS / DS', label: 'Nintendo 3DS / DS' },
    { value: 'Nintendo Wii / Wii U', label: 'Nintendo Wii / Wii U' },
    { value: 'Retro Cartridge', label: 'Retro Cartridge' },
    { value: 'PC Steam', label: 'PC / Steam' },
    { value: 'Digital', label: 'Digital' },
  ],
};

export const DEFAULT_FORMAT_BY_CATEGORY = {
  movie: '4K UHD',
  tv: 'Blu-ray',
  game: 'Nintendo Switch',
};

export const DEFAULT_PACKAGING_BY_CATEGORY = {
  movie: 'Standard Case',
  tv: 'Box Set',
  game: 'Standard Case',
};

export function getFormatsForCategory(category) {
  return FORMATS_BY_CATEGORY[category] || FORMATS_BY_CATEGORY.movie;
}
