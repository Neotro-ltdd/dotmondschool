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
    paper?: string;
    paperLine?: string;
    ink?: string;
    inkSoft?: string;
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
      indigo: '#1C5C82',
      indigoDark: '#0E3A54',
      gold: '#7C8A99',
      goldDark: '#4F5D6B',
      sage: '#2E9BD6',
      sageBg: '#E2F1FA',
      terracotta: '#C75D3D',
      terracottaBg: '#FBEAE3',
      paper: '#EEF1F3',
      paperLine: '#D6DCE1',
      ink: '#222B33',
      inkSoft: '#5C6B7A',
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
