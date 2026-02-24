"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { User } from "@/types/api";
import { getCurrentUser, isAuthenticated } from "@/services/auth";

export type UserRole = string;

type UserProfile = {
  name: string;
  image_url?: string;
  role: UserRole;
};

type UserContextType = {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  refetch: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  isLoading: true,
  refetch: () => {},
});

// Type guard function to check if role is an object with name property
function isRoleObject(role: any): role is { name: string; display_name: string; is_default: boolean } {
  return typeof role === 'object' && role !== null && 'name' in role;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Listen for authentication state changes (token changes)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        // Token changed, invalidate user query
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // ← Remove queryClient from dependencies

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      // Check if user is authenticated first
      if (!isAuthenticated()) {
        console.log("UserContext: User not authenticated");
        return { user: null, profile: null };
      }

      try {
        console.log("UserContext: Fetching current user...");
        const user = await getCurrentUser();
        console.log("UserContext: User fetched:", user);

        const profile: UserProfile = {
          name: user.name,
          image_url: user.image_url, // Get image from database
          role: isRoleObject(user.role) ? user.role.name : user.role, // Extract role name if role is an object, otherwise use as-is
        };

        console.log("UserContext: Profile created with image_url:", user.image_url);
        return { user, profile };
      } catch (error) {
        console.error('UserContext: Failed to fetch user:', error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        return { user: null, profile: null };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on auth failure
  });

  const value = {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoading,
    refetch,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}