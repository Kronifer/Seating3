import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title({ color: "blue" })}>Seating3&nbsp;</span>
        <span className={title()}>is coming soon.</span>
        <div className={subtitle({ class: "mt-4" })}>Stay tuned for more!</div>
      </div>
    </section>
  );
}
