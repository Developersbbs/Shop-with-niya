import { useUser, UserRole } from "@/contexts/UserContext";

const permissions = {
  orders: {
    canChangeStatus: ["superadmin", "admin", "cashier"],
    canPrint: ["superadmin", "admin", "cashier"],
  },
  categories: {
    canCreate: ["superadmin", "admin"],
    canDelete: ["superadmin", "admin"],
    canEdit: ["superadmin", "admin"],
    canTogglePublished: ["superadmin", "admin"],
  },
  coupons: {
    canCreate: ["superadmin", "admin"],
    canDelete: ["superadmin", "admin"],
    canEdit: ["superadmin", "admin"],
    canTogglePublished: ["superadmin", "admin"],
  },
  customers: {
    canDelete: ["superadmin"],
    canEdit: ["superadmin", "admin"],
  },
  products: {
    canCreate: ["superadmin", "admin"],
    canDelete: ["superadmin", "admin"],
    canEdit: ["superadmin", "admin"],
    canTogglePublished: ["superadmin", "admin"],
  },
  staff: {
    canDelete: ["superadmin"],
    canEdit: ["superadmin"],
    canTogglePublished: ["superadmin"],
  },
} as const;

type PermissionMap = typeof permissions;
type Feature = keyof PermissionMap;

export function useAuthorization() {
  const { user, profile, isLoading } = useUser();

  const hasPermission = <F extends Feature>(
    feature: F,
    action: keyof PermissionMap[F]
  ): boolean => {
    if (isLoading || !profile || !profile.role) return false;

    const allowedRoles = permissions[feature][action];
    return (allowedRoles as UserRole[]).includes(profile.role);
  };

  const isSelf = (staffId: string) => {
    return user?.id === staffId;
  };

  return { hasPermission, isSelf, isLoading };
}

export type HasPermission = ReturnType<
  typeof useAuthorization
>["hasPermission"];
export type IsSelf = ReturnType<typeof useAuthorization>["isSelf"];
