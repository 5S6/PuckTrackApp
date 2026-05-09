export const theme = {
  bg: '#070810',
  surface: '#0D0F1A',
  border: 'rgba(255,255,255,0.1)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',
} as const;

interface TeamColors {
  primary: string;
  secondary: string;
  name: string;
  city: string;
}

const TEAMS: Record<string, TeamColors> = {
  ANA: { city: 'Anaheim',      name: 'Ducks',          primary: '#FC4C02', secondary: '#A2AAAD' },
  BOS: { city: 'Boston',       name: 'Bruins',         primary: '#FCB514', secondary: '#111111' },
  BUF: { city: 'Buffalo',      name: 'Sabres',         primary: '#003087', secondary: '#FCB514' },
  CAR: { city: 'Carolina',     name: 'Hurricanes',     primary: '#CE1126', secondary: '#231F20' },
  CBJ: { city: 'Columbus',     name: 'Blue Jackets',   primary: '#002654', secondary: '#CE1126' },
  CGY: { city: 'Calgary',      name: 'Flames',         primary: '#C80E2E', secondary: '#F1BE48' },
  CHI: { city: 'Chicago',      name: 'Blackhawks',     primary: '#CF0A2C', secondary: '#000000' },
  COL: { city: 'Colorado',     name: 'Avalanche',      primary: '#6F263D', secondary: '#236192' },
  DAL: { city: 'Dallas',       name: 'Stars',          primary: '#006847', secondary: '#8A8D8F' },
  DET: { city: 'Detroit',      name: 'Red Wings',      primary: '#CE1126', secondary: '#FFFFFF' },
  EDM: { city: 'Edmonton',     name: 'Oilers',         primary: '#FC4C00', secondary: '#0038A8' },
  FLA: { city: 'Florida',      name: 'Panthers',       primary: '#041E42', secondary: '#B9975B' },
  LAK: { city: 'Los Angeles',  name: 'Kings',          primary: '#111111', secondary: '#A2AAAD' },
  MIN: { city: 'Minnesota',    name: 'Wild',           primary: '#154734', secondary: '#A6192E' },
  MTL: { city: 'Montréal',     name: 'Canadiens',      primary: '#AF1E2D', secondary: '#003262' },
  NJD: { city: 'New Jersey',   name: 'Devils',         primary: '#CE1126', secondary: '#000000' },
  NSH: { city: 'Nashville',    name: 'Predators',      primary: '#FFB81C', secondary: '#002F6C' },
  NYI: { city: 'New York',     name: 'Islanders',      primary: '#00539B', secondary: '#F06727' },
  NYR: { city: 'New York',     name: 'Rangers',        primary: '#0038A8', secondary: '#CE1126' },
  OTT: { city: 'Ottawa',       name: 'Senators',       primary: '#C6121C', secondary: '#B7925A' },
  PHI: { city: 'Philadelphia', name: 'Flyers',         primary: '#F74902', secondary: '#000000' },
  PIT: { city: 'Pittsburgh',   name: 'Penguins',       primary: '#000000', secondary: '#FCB514' },
  SEA: { city: 'Seattle',      name: 'Kraken',         primary: '#001628', secondary: '#00BDB0' },
  SJS: { city: 'San Jose',     name: 'Sharks',         primary: '#006D75', secondary: '#000000' },
  STL: { city: 'St. Louis',    name: 'Blues',          primary: '#002F87', secondary: '#FCB514' },
  TBL: { city: 'Tampa Bay',    name: 'Lightning',      primary: '#0028A8', secondary: '#FFFFFF' },
  TOR: { city: 'Toronto',      name: 'Maple Leafs',    primary: '#003E7E', secondary: '#FFFFFF' },
  UTA: { city: 'Utah',         name: 'Hockey Club',    primary: '#69B3E7', secondary: '#000000' },
  VAN: { city: 'Vancouver',    name: 'Canucks',        primary: '#00205B', secondary: '#96D616' },
  VGK: { city: 'Vegas',        name: 'Golden Knights', primary: '#B9975B', secondary: '#333F48' },
  WSH: { city: 'Washington',   name: 'Capitals',       primary: '#041E42', secondary: '#C8102E' },
  WPG: { city: 'Winnipeg',     name: 'Jets',           primary: '#041E42', secondary: '#004C97' },
};

export function getTeamColors(abbrev: string): { primary: string; secondary: string } {
  const team = TEAMS[abbrev];
  if (!team) return { primary: '#283C5A', secondary: '#FFFFFF' };
  return { primary: team.primary, secondary: team.secondary };
}

export function getTeamFullName(abbrev: string): string {
  const team = TEAMS[abbrev];
  if (!team) return abbrev;
  return `${team.city} ${team.name}`;
}

export function getTeamCity(abbrev: string): string {
  return TEAMS[abbrev]?.city ?? abbrev;
}

export function getAllTeamAbbrevs(): string[] {
  return Object.keys(TEAMS).sort();
}
