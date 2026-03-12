"use server";

import { revalidatePath } from "next/cache";

import { serverAxiosInstance } from "@/helpers/axiosInstance";
import { staffFormSchema } from "@/app/(dashboard)/staff/_components/form/schema";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { StaffServerActionResponse } from "@/types/server-action";

export async function createStaff(
    formData: FormData
): Promise<StaffServerActionResponse> {
    // Parse and validate using the scheme which now includes role_id
    const parsedData = staffFormSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        password: formData.get("password"),
        image: formData.get("image"),
        role_id: formData.get("role_id"),
    });

    if (!parsedData.success) {
        return {
            validationErrors: formatValidationErrors(
                parsedData.error.flatten().fieldErrors
            ),
        };
    }

    const { image, ...staffData } = parsedData.data;

    try {
        const createData: Record<string, unknown> = {
            name: staffData.name,
            phone: staffData.phone,
            role_id: staffData.role_id,
            password: (formData.get("password") as string) || "password123", // Use provided password or fallback (though schema should enforce it for create)
            email: staffData.email,
            // Note: In a real app, email and password should probably be inputs or handled via invitation
        };

        // Handle image upload if provided (simulated as in editStaff)
        if (image instanceof File && image.size > 0) {
            const fileExt = image.name.split(".").pop();
            const fileName = `staff/${staffData.name}-${Date.now()}.${fileExt}`;
            createData.image_url = `/uploads/staff/${fileName}`;
        }

        const { data } = await serverAxiosInstance.post("/api/staff", createData);

        if (!data.success) {
            console.error("API create failed:", data.error);
            return { dbError: data.error || "Something went wrong. Please try again later." };
        }

        revalidatePath("/staff");
        return { success: true, staff: data.data };

    } catch (error: unknown) {
        console.error("Staff create error:", error);
        const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Something went wrong. Please try again later.";
        return {
            dbError: errorMessage
        };
    }
}
