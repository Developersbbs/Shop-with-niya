"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { fetchStaffRolesDropdown } from "@/services/staff";

export default function StaffFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");

  const {
    data: staffRoles,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["staff_roles"],
    queryFn: () => fetchStaffRolesDropdown(),
    staleTime: 5 * 60 * 1000,
  });

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role && role !== "all") params.set("role", role);

    params.set("page", "1");
    params.set("limit", searchParams.get("limit") || "10");
    router.push(`/staff?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setRole("all");
    router.push("/staff");
  };

  const handleRoleChange = useCallback((value: string) => {
    setRole(value);
  }, []);

  return (
    <Card className="mb-5">
      <form
        onSubmit={handleFilter}
        className="flex flex-col md:flex-row gap-4 lg:gap-6"
      >
        <Input
          type="search"
          placeholder="Search by name, email or phone"
          className="h-12 md:basis-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={role} onValueChange={handleRoleChange}>
  <SelectTrigger className="md:basis-1/3 capitalize">
    <SelectValue placeholder="Role" />
  </SelectTrigger>

  <SelectContent>
    {isLoading ? (
      <div className="flex flex-col gap-2 items-center px-2 py-6">
        <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    ) : isError ? (
      <div className="flex flex-col gap-2 items-center px-2 py-6 max-w-full">
        <span className="text-sm text-destructive">Failed to load staff roles</span>
      </div>
    ) : (
      <React.Fragment key="role-options">
        <SelectItem key="all" value="all">
          All Roles
        </SelectItem>

        {staffRoles?.map((role, index) => (
          <SelectItem key={role.id ? `role-${role.id}` : `role-index-${index}`} value={role.id || `role-${index}`} className="capitalize">
            {role.name}
          </SelectItem>
        ))}
      </React.Fragment>
    )}
  </SelectContent>
</Select>


        <div className="flex flex-wrap sm:flex-nowrap gap-4 md:basis-1/3">
          <Button type="submit" size="lg" className="flex-grow">
            Filter
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="flex-grow"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
}
