import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full text-center justify-center items-center">
        {children}
      </div>
    </section>
  );
}
