export interface CustomerRecord {
  id: string;
  email: string;
  name: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
}

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type UpdateProfileInput = {
  name: string;
  phone: string;
};
