export interface TenantConfig {
  id: string;
  name: string;
  shortName: string;
  location: string;
  studentName: string;
  studentClass: string;
  colors: {
    indigo: string;
    indigoDark: string;
    gold: string;
    goldDark: string;
    sage: string;
    sageBg: string;
    terracotta: string;
    terracottaBg: string;
  };
}

export const tenants: Record<string, TenantConfig> = {
  dotmond: {
    id: 'dotmond',
    name: 'Dotmond School',
    shortName: 'DM',
    location: 'Lekki, Lagos',
    studentName: 'Amara Okafor',
    studentClass: 'JSS2 · ADM/24/0118',
    colors: {
      indigo: '#1B1464',
      indigoDark: '#100C40',
      gold: '#E8A33D',
      goldDark: '#B97D1F',
      sage: '#5C8463',
      sageBg: '#E9F0E8',
      terracotta: '#C75D3D',
      terracottaBg: '#FBEAE3',
    }
  },
  atwool: {
    id: 'atwool',
    name: 'Atwool School',
    shortName: 'Atwool',
    location: 'Lagos',
    studentName: 'Chike Obi',
    studentClass: 'SS1 · ATW/24/005',
    colors: {
      indigo: '#00205B', // Navy Blue
      indigoDark: '#00133A', 
      gold: '#C8102E', // Red for accents
      goldDark: '#9E0B22',
      sage: '#87CEEB', // Sky Blue
      sageBg: '#E0F4FC',
      terracotta: '#C8102E', // Red
      terracottaBg: '#FAE7EA',
    }
  }
};

export const defaultTenantId = 'dotmond';
