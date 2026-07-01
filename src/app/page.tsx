import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Mascot } from "@/components/mascot";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8ef] px-6 py-10 text-[#251f1c] dark:bg-[#17110e] dark:text-[#fff8ef]">
      <main className="w-full max-w-md">
        <section className="flex flex-col items-center text-center">
          <Mascot mood="wave" size={88} className="mb-4" />
          <h1 className="text-4xl font-black tracking-normal">CardsAI</h1>
          <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-[#6f6259] dark:text-[#d8c8bc]">
            Aprenda vocabulário com textos, palavras novas e flashcards por idioma.
          </p>
        </section>

        <Suspense fallback={<AuthFormSkeleton />}>
          <AuthForm />
        </Suspense>
      </main>
    </div>
  );
}

function AuthFormSkeleton() {
  return (
    <section className="mt-8 rounded-[20px] border border-[#eadfd3] bg-white p-4 shadow-[0_12px_35px_rgba(72,45,24,0.08)] dark:border-[#352821] dark:bg-[#211814]">
      <div className="h-12 rounded-2xl bg-[#f6efe7] dark:bg-[#2b211c]" />
      <div className="mt-4 h-12 rounded-2xl bg-[#f6efe7] dark:bg-[#2b211c]" />
      <div className="mt-5 h-14 rounded-2xl bg-[#f6efe7] dark:bg-[#2b211c]" />
      <div className="mt-4 h-14 rounded-2xl bg-[#f6efe7] dark:bg-[#2b211c]" />
    </section>
  );
}
