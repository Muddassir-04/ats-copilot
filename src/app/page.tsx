import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-4xl">
        ATS Copilot
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Paste a job description, get an ATS-optimized CV, cover letter, and
        an honest match score.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/signup"
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
