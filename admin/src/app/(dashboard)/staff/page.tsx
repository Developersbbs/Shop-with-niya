import { Metadata } from "next";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetTrigger } from "@/components/ui/sheet";
import PageTitle from "@/components/shared/PageTitle";
import StaffFormSheet from "./_components/form/StaffFormSheet";
import StaffTable from "./_components/staff-table";
import StaffFilters from "./_components/StaffFilters";
import { createStaff } from "@/actions/staff/createStaff";

export const metadata: Metadata = {
  title: "Staff",
};

export default async function StaffPage() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <PageTitle className="mb-0">All Staff</PageTitle>

        <StaffFormSheet
          title="Add New Staff"
          description="Add a new staff member to manage your store"
          submitButtonText="Add Staff"
          actionVerb="created"
          staffEmail=""
          action={createStaff}
          initialData={{}}
        >
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Staff
            </Button>
          </SheetTrigger>
        </StaffFormSheet>
      </div>

      <StaffFilters />
      <StaffTable />
    </section>
  );
}
