export type CreatorDashboardOverview = {
  events_created: number;
  events_completed: number;
  earnings_total: number;
  balance: number;
  events_running: number;
};

export type CreatorDashboardSeries = {
  months: string[];
  series: {
    orders: number[];
    earnings: number[];
  };
};

export type CreatorDashboardFanLocation = {
  location: string;
  buyers: number;
  tickets: number;
  earnings_total: number;
};

export type CreatorDashboardRecentScan = {
  name: string;
  event: string;
  time: string;
  avatar_url?: string | null;
  avatar_color: string;
  location?: string | null;
};

export type CreatorDashboardNotification = {
  id: string | number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
};

export type CreatorDashboard = {
  user: { name: string; email: string };
  overview: CreatorDashboardOverview;
  fan_location: CreatorDashboardSeries & {
    callouts: { top_locations: CreatorDashboardFanLocation[] };
  };
  earning_graph: CreatorDashboardSeries & {
    callouts: { earnings_total: number; orders_total: number };
  };
  recent_scanned: CreatorDashboardRecentScan[];
  notifications: CreatorDashboardNotification[];
};

export type CreatorDashboardResponse = { data: CreatorDashboard };
