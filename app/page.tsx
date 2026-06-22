import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-30">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.05] max-w-4xl">
        Craftit Furniture. <br />
        <span className="text-muted-foreground">Built for Your Home.</span>
      </h1>
      <p className="mt-6 max-w-xl text-muted-foreground text-lg">
        Your home deserves furniture as great as the life you&apos;re building.
      </p>

      <ThemeToggle />
    </section>
  );
}
