export interface University {
  id: string;
  name: string;
  shortName: string;
  city: string;
  hostels: string[];
}

export const universities: University[] = [
  {
    id: 'ug',
    name: 'University of Ghana',
    shortName: 'UG',
    city: 'Legon',
    hostels: ['Volta', 'Mensah', 'Commonwealth', 'Akuafo', 'Sarbah', 'Legon'],
  },
  {
    id: 'knust',
    name: 'Kwame Nkrumah University of Science and Technology',
    shortName: 'KNUST',
    city: 'Kumasi',
    hostels: ['Unity', 'Independence', 'Republic', 'Queens', 'Africa'],
  },
  {
    id: 'ucc',
    name: 'University of Cape Coast',
    shortName: 'UCC',
    city: 'Cape Coast',
    hostels: ['Casford', 'Valco', 'Oguaa'],
  },
  {
    id: 'uew',
    name: 'University of Education, Winneba',
    shortName: 'UEW',
    city: 'Winneba',
    hostels: ['North', 'South', 'Central'],
  },
  {
    id: 'gimpa',
    name: 'Ghana Institute of Management and Public Administration',
    shortName: 'GIMPA',
    city: 'Accra',
    hostels: ['GIMPA'],
  },
  {
    id: 'ashesi',
    name: 'Ashesi University',
    shortName: 'Ashesi',
    city: 'Berekuso',
    hostels: ['Ashesi'],
  },
  {
    id: 'upsa',
    name: 'University of Professional Studies, Accra',
    shortName: 'UPSA',
    city: 'Accra',
    hostels: ['UPSA', 'Accra'],
  },
];

export const cityLocations: string[] = [
  'Osu',
  'Cantonments',
  'Accra CBD',
  'Dzorwulu',
  'East Legon',
  'Tema',
  'Kumasi',
  'Takoradi',
];

// Helper to get all location tags (hostels + cities)
export const getAllLocationTags = (): string[] => {
  const hostelTags = universities.flatMap((uni) => uni.hostels);
  return [...hostelTags, ...cityLocations];
};

// Helper to find university by hostel
export const findUniversityByHostel = (hostel: string): University | undefined => {
  return universities.find((uni) => uni.hostels.includes(hostel));
};
