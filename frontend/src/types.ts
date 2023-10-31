export type UserTypes = "sitter" | "owner";

export type User = {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  user_type: UserTypes[];
  profile_picture?: string;
  date_of_birth: string | null;
  about: string;
  qualifications: string;
  created_at: string;
  updated_at: string;
};
