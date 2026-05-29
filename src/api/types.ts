export type User = {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
};

export type Post = {
  id: number;
  user_id: number;
  category_id?: number;
  title: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_blocked?: boolean;
  created_at: string;
  updated_at: string;
};

export type PostDetail = Post & {
  favorited: boolean;
};
