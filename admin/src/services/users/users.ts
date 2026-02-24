import axiosInstance from "@/helpers/axiosInstance";

export interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  displayName: string;
  role: string;
  is_active: boolean;
}

export interface UserSearchResponse {
  success: boolean;
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export const fetchUsersDropdown = async (search?: string): Promise<User[]> => {
  try {
    const response = await axiosInstance.get<UserSearchResponse>("/api/customers", {
      params: {
        search: search?.trim(),
        limit: 20, // Limit results for dropdown
      },
    });

    if (response.data.success) {
      return response.data.data.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        displayName: `${user.name}${user.email ? ` (${user.email})` : ''}${user.phone ? ` • ${user.phone}` : ''}`,
        role: user.role,
        is_active: user.is_active,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};
