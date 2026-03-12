"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";


export default function CouponFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL when debounced search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    params.set("page", "1");
    params.set("limit", searchParams.get("limit") || "10");

    router.push(`/coupons?${params.toString()}`);
  }, [debouncedSearch, router, searchParams]);



  return (
    <Card className="mb-5">
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6 p-4">
        <Input
          type="search"
          placeholder="Search by coupon code or name"
          className="w-full h-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </Card>
  );
}
