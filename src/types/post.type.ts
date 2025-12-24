export interface PostData {
  title: string;
  description: string;
  price: number;
  city: string;
  district: string;
  ward?: string;
  address: string;
  superficies: number;
  images: string[];
  category: string;
}
export interface PostFormData {
  title: string;
  description: string;
  price: number;
  city: string;
  district: string;
  ward?: string;
  address: string;
  superficies: number;
  imageFiles: File[];
  category: string;
}
export interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  superficies: number;
  category: { _id: string; name: string };
  city: string;
  district: string;
  address: string;
  images: string[];
  createdAt: string;
  statusApproval: boolean;
}
export interface searchFilter {
  city?: string;
  district?: string;
  ward?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
}