"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldErrors } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";

import {
  FormSheetContent,
  FormSheetBody,
  FormSheetHeader,
  FormSheetFooter,
} from "@/components/shared/form/FormSheet";
import {
  FormTextInput,
  FormImageInput,
  FormReadonly,
} from "@/components/shared/form";
import FormSelect from "@/components/shared/form/FormSelect";
import { useQuery } from "@tanstack/react-query";
import { FormSubmitButton } from "@/components/shared/form/FormSubmitButton";

import { staffFormSchema, StaffFormData } from "./schema";
import { objectToFormData } from "@/helpers/objectToFormData";
import { StaffServerActionResponse } from "@/types/server-action";
import { useUser } from "@/contexts/UserContext";

type BaseStaffFormProps = {
  title: string;
  description: string;
  submitButtonText: string;
  actionVerb: string;
  children: React.ReactNode;
  action: (formData: FormData) => Promise<StaffServerActionResponse>;
};

type EditStaffFormProps = BaseStaffFormProps & {
  initialData: Partial<StaffFormData>;
  previewImage?: string;
  staffEmail: string;
};

type StaffFormProps = EditStaffFormProps;

export default function StaffFormSheet({
  title,
  description,
  submitButtonText,
  actionVerb,
  initialData,
  previewImage,
  staffEmail,
  children,
  action,
}: StaffFormProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const imageDropzoneRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const { data: rolesData, error: rolesError, isLoading: rolesLoading } = useQuery({
    queryKey: ["staffRoles"],
    queryFn: async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const url = baseUrl.endsWith('/api') ? `${baseUrl}/staffRoles/dropdown` : `${baseUrl}/api/staffRoles/dropdown`;

        console.log("Fetching roles from:", url);
        const res = await fetch(url);
        if (!res.ok) {
          console.error("Roles fetch failed status:", res.status);
          throw new Error("Failed to fetch roles");
        }
        const json = await res.json();
        console.log("Roles fetch success:", json);
        return json;
      } catch (err) {
        console.error("Roles fetch error:", err);
        throw err;
      }
    }
  });

  const roleOptions = rolesData?.data?.map((role: any) => ({
    value: role._id,
    label: role.display_name
  })) || [];

  console.log("Parsed role options:", roleOptions);

  const defaultValues = {
    name: "",
    email: "",
    password: "",
    phone: "",
    image: undefined,
    role_id: "",
    ...initialData,
  };

  if (defaultValues.role_id && typeof defaultValues.role_id === 'object') {
    // @ts-ignore
    defaultValues.role_id = defaultValues.role_id._id || defaultValues.role_id.id;
  }

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    form.reset(initialData);
  }, [form, initialData]);

  const onSubmit = (data: StaffFormData) => {
    const formData = objectToFormData(data);

    startTransition(async () => {
      const result = await action(formData);

      if ("validationErrors" in result) {
        Object.keys(result.validationErrors).forEach((key) => {
          form.setError(key as keyof StaffFormData, {
            message: result.validationErrors![key],
          });
        });
      } else if ("dbError" in result) {
        toast.error(result.dbError);
      } else {
        form.reset();
        toast.success(
          `Staff "${result.staff.name}" ${actionVerb} successfully!`,
          { position: "top-center" }
        );
        queryClient.invalidateQueries({ queryKey: ["staff"] });
        if (user && user.id === result.staff.id) {
          queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        }

        setIsSheetOpen(false);
      }
    });
  };

  const onInvalid = (errors: FieldErrors<StaffFormData>) => {
    if (errors.image) {
      imageDropzoneRef.current?.focus();
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      {children}

      <SheetContent className="w-[90%] max-w-5xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="size-full"
          >
            <FormSheetContent>
              <FormSheetHeader>
                <div className="flex flex-col">
                  <SheetTitle>{title}</SheetTitle>
                  <SheetDescription>{description}</SheetDescription>
                </div>
              </FormSheetHeader>

              <FormSheetBody>
                <div className="space-y-6">
                  <FormTextInput
                    control={form.control}
                    name="name"
                    label="Staff Name"
                    placeholder="Staff Name"
                  />

                  <FormSelect
                    control={form.control}
                    name="role_id"
                    label="Role"
                    placeholder="Select a role"
                    options={roleOptions}
                  />

                  <FormTextInput
                    control={form.control}
                    name="email"
                    label="Staff Email"
                    placeholder="Staff Email"
                    readOnly={!!initialData.email} // Make readonly only if editing (initialData has email)
                  />

                  <FormTextInput
                    control={form.control}
                    name="password"
                    label="Password"
                    placeholder="Password "
                    type="password"
                  />

                  <FormImageInput
                    control={form.control}
                    name="image"
                    label="Staff Image"
                    previewImage={previewImage}
                    ref={imageDropzoneRef}
                  />

                  <FormTextInput
                    control={form.control}
                    name="phone"
                    label="Staff Phone"
                    placeholder="Staff Phone"
                  />
                </div>
              </FormSheetBody>

              <FormSheetFooter>
                <FormSubmitButton isPending={isPending} className="w-full">
                  {submitButtonText}
                </FormSubmitButton>
              </FormSheetFooter>
            </FormSheetContent>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
