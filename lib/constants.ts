export type Campus = { id: string; name: string; shortName: string; area: string; state: string; initials: string; bgColor: string; logoUrl?: string };
export const UNIVERSITIES: Campus[] = [
  { 
    id: 'uniport', 
    name: 'University of Port Harcourt', 
    shortName: 'UniPort',
    area: 'Choba',
    state: 'Rivers State',
    initials: 'UP',
    bgColor: 'bg-green-700',
    logoUrl: '/universities/uniport.jpg'
  },
  {
    id: 'rsu',
    name: 'Rivers State University',
    shortName: 'RSU',
    area: 'Nkpolu-Oroworukwo',
    state: 'Rivers State',
    initials: 'RSU',
    bgColor: 'bg-blue-700',
    logoUrl: '/universities/rsu.png'
  },
  {
    id: 'iaue',
    name: 'Ignatius Ajuru University of Education',
    shortName: 'IAUE',
    area: 'Rumuola',
    state: 'Rivers State',
    initials: 'IAUE',
    bgColor: 'bg-purple-700',
    logoUrl: '/universities/iaue.png'
  },
  {
    id: 'kenpoly',
    name: "Ken Saro-Wiwa Polytechnic",
    shortName: 'KenPoly',
    area: 'Bori',
    state: 'Rivers State',
    initials: 'KP',
    bgColor: 'bg-orange-700',
    logoUrl: '/universities/kenpoly.jpg'
  },
  { 
    id: 'unilag', 
    name: 'University of Lagos', 
    shortName: 'UNILAG', 
    area: 'Akoka', 
    state: 'Lagos State', 
    initials: 'UL', 
    bgColor: 'bg-blue-700',
    logoUrl: '/universities/unilag.png'
  },
  { 
    id: 'lasu', 
    name: 'Lagos State University', 
    shortName: 'LASU', 
    area: 'Ojo', 
    state: 'Lagos State', 
    initials: 'LS', 
    bgColor: 'bg-blue-800',
    logoUrl: '/universities/lasu.jpg'
  },
  { 
    id: 'yabatech', 
    name: 'Yaba College of Technology', 
    shortName: 'YABATECH', 
    area: 'Yaba', 
    state: 'Lagos State', 
    initials: 'YT', 
    bgColor: 'bg-indigo-700',
    logoUrl: '/universities/yabatech.png'
  },
  { 
    id: 'ui', 
    name: 'University of Ibadan', 
    shortName: 'UI', 
    area: 'Ibadan', 
    state: 'Oyo State', 
    initials: 'UI', 
    bgColor: 'bg-purple-700',
    logoUrl: '/universities/ui.png'
  },
  { 
    id: 'oau', 
    name: 'Obafemi Awolowo University', 
    shortName: 'OAU', 
    area: 'Ile-Ife', 
    state: 'Osun State', 
    initials: 'OA', 
    bgColor: 'bg-amber-700',
    logoUrl: '/universities/OAU.jpg'
  },
  { 
    id: 'unn', 
    name: 'University of Nigeria, Nsukka', 
    shortName: 'UNN', 
    area: 'Nsukka', 
    state: 'Enugu State', 
    initials: 'UN', 
    bgColor: 'bg-emerald-700',
    logoUrl: '/universities/unn.png'
  },
  { 
    id: 'uniben', 
    name: 'University of Benin', 
    shortName: 'UNIBEN', 
    area: 'Ugbowo', 
    state: 'Edo State', 
    initials: 'UB', 
    bgColor: 'bg-red-700',
    logoUrl: '/universities/uniben.png'
  },
  { 
    id: 'abu', 
    name: 'Ahmadu Bello University', 
    shortName: 'ABU', 
    area: 'Zaria', 
    state: 'Kaduna State', 
    initials: 'AB', 
    bgColor: 'bg-cyan-700',
    logoUrl: '/universities/abu.png'
  },
]

export const DISTANCE_OPTIONS = [
  { value: 'under_5', label: 'Under 5 mins walk' },
  { value: '5_to_15', label: '5–15 mins walk' },
  { value: '15_to_30', label: '15–30 mins walk' },
  { value: 'above_30', label: '30+ mins walk' },
]

export const ROOM_TYPES = [
  { value: 'self_con', label: 'Self-contained' },
  { value: 'one_bedroom', label: '1 Bedroom' },
  { value: 'two_bedroom', label: '2 Bedroom' },
  { value: 'shared', label: 'Shared Room' },
]

export const AMENITIES = [
  { value: 'water', label: 'Running water', icon: 'droplet' },
  { value: 'electricity', label: '24hr electricity / gen', icon: 'zap' },
  { value: 'security', label: 'Security / gateman', icon: 'shield' },
  { value: 'parking', label: 'Parking space', icon: 'car' },
  { value: 'prepaid_meter', label: 'Prepaid meter', icon: 'zap' },
  { value: 'kitchen', label: 'Private kitchen', icon: 'utensils' },
  { value: 'bathroom', label: 'En-suite bathroom', icon: 'bath' },
  { value: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
]
