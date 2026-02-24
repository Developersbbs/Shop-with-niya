"use client";

import { Fragment, useState } from "react";

import CouponFilters from "./CouponFilters";
import CouponActions from "./CouponActions";
import AllCoupons from "./coupons-table";

export default function Coupons() {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [couponsData, setCouponsData] = useState<any[]>([]);

  return (
    <Fragment>
      <CouponActions
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        data={couponsData}
      />
      <CouponFilters />
      <AllCoupons
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onDataChange={setCouponsData}
      />
    </Fragment>
  );
}
