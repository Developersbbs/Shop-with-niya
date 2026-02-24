import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import ReviewsClient from "./_components/client";

export const metadata: Metadata = {
    title: "Reviews",
};

export default function ReviewsPage() {
    return (
        <section>
            <PageTitle>Product Reviews</PageTitle>
            <ReviewsClient />
        </section>
    );
}
