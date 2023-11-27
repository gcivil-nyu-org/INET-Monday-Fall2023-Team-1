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
  phone_number: string;
  created_at: string;
  updated_at: string;
};

export type FurbabyLocation = {
  id: string;
  address: string;
  city: string;
  user_id: string;
  state: string;
  zipcode: string;
  country: string;
  default_location?: boolean;
};
