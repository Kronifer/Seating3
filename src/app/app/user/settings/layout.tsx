import { Metadata } from "next";

import { UseAuth } from "@/utils/components";

export const metadata: Metadata = {
  title: "User Settings",
};

export default function UserSettingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <UseAuth>{children}</UseAuth>
      </div>
    </section>
  );
}
