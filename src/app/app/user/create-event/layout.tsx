import { Metadata } from "next";

import { UseAuth } from "@/utils/components";

export const metadata: Metadata = {
  title: "Create New Event",
};

//TODO: wrap children in useauth
export default function CreateEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full text-center justify-center">
        <UseAuth>{children}</UseAuth>
      </div>
    </section>
  );
}
