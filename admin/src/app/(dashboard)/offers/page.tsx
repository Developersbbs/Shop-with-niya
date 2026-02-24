import { Metadata } from "next";

import PageTitle from "@/components/shared/PageTitle";
import Offers from "./_components";

export const metadata: Metadata = {
  title: "Offers",
};

export default function OffersPage() {
  return (
    <section>
      <PageTitle>Offers</PageTitle>

      <Offers />
    </section>
  );
}