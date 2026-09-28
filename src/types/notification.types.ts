export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read_at?: string | null;
  created_at?: string | null;
  data: Record<string, unknown>;
};

export type NotificationsResponse = {
  data: AppNotification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};
