export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  address?: string;
  gender?: string;
  introduce?: string;
}
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  avatar: string;
  address: string;
  dateOfBirth?: string;
  studentId?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  introduce?: string;
}
