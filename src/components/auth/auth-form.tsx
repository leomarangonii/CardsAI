"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/firebase/user-profile";

type AuthMode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nextPath = searchParams.get("next") ?? "/study";

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

        if (displayName.trim()) {
          await updateProfile(credential.user, { displayName: displayName.trim() });
          await credential.user.reload();
        }
        await ensureUserProfile(firebaseAuth.currentUser ?? credential.user);
      } else {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        await ensureUserProfile(credential.user);
      }

      router.replace(nextPath);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      await ensureUserProfile(credential.user);
      router.replace(nextPath);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setError(null);
    setStatus(null);

    if (!email.trim()) {
      setError("Digite seu email para receber o link de redefinição.");
      return;
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setStatus("Enviamos o link de redefinição para seu email.");
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    }
  }

  return (
    <section className="mt-8 rounded-[20px] border border-[#eadfd3] bg-white p-4 shadow-[0_12px_35px_rgba(72,45,24,0.08)] dark:border-[#352821] dark:bg-[#211814]">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f6efe7] p-1 dark:bg-[#2b211c]">
        <button
          className={`rounded-xl px-4 py-3 text-sm font-bold ${
            mode === "login"
              ? "bg-white shadow-sm dark:bg-[#3a2d26]"
              : "text-[#75685f] dark:text-[#d8c8bc]"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Entrar
        </button>
        <button
          className={`rounded-xl px-4 py-3 text-sm font-bold ${
            mode === "register"
              ? "bg-white shadow-sm dark:bg-[#3a2d26]"
              : "text-[#75685f] dark:text-[#d8c8bc]"
          }`}
          onClick={() => setMode("register")}
          type="button"
        >
          Criar conta
        </button>
      </div>

      <button
        className="mt-4 w-full rounded-2xl border border-[#e6d8ca] bg-white px-4 py-3 text-sm font-extrabold shadow-[0_4px_0_#e6d8ca] transition hover:border-orange-400 disabled:opacity-60 dark:border-[#4a3a31] dark:bg-[#2a211c] dark:shadow-[0_4px_0_#4a3a31]"
        disabled={submitting}
        onClick={handleGoogleSignIn}
        type="button"
      >
        Entrar com Google
      </button>

      <div className="my-5 flex items-center gap-4 text-xs font-bold text-[#b0a398]">
        <div className="h-px flex-1 bg-[#eadfd3] dark:bg-[#40332c]" />
        ou
        <div className="h-px flex-1 bg-[#eadfd3] dark:bg-[#40332c]" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <label className="block text-left text-sm font-bold">
            Nome
            <input
              className="mt-2 h-14 w-full rounded-2xl border border-[#e4d8cc] bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-[#4a3a31] dark:bg-[#2a211c]"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Lucas"
              type="text"
              value={displayName}
            />
          </label>
        ) : null}

        <label className="block text-left text-sm font-bold">
          Email
          <input
            autoComplete="email"
            className="mt-2 h-14 w-full rounded-2xl border border-[#e4d8cc] bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-[#4a3a31] dark:bg-[#2a211c]"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="lucas@email.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block text-left text-sm font-bold">
          Senha
          <input
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="mt-2 h-14 w-full rounded-2xl border border-[#e4d8cc] bg-white px-4 text-base outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 dark:border-[#4a3a31] dark:bg-[#2a211c]"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            required
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        {status ? (
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 dark:bg-green-950/30 dark:text-green-300">
            {status}
          </p>
        ) : null}

        <button
          className="h-14 w-full rounded-2xl bg-orange-500 px-4 text-base font-black text-white shadow-[0_5px_0_#d94a22] transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Aguarde..." : mode === "register" ? "Criar conta" : "Entrar"}
        </button>
      </form>

      <div className="mt-4 flex justify-center gap-2 text-xs font-extrabold text-orange-600">
        <button onClick={() => setMode(mode === "login" ? "register" : "login")} type="button">
          {mode === "login" ? "Criar conta" : "Já tenho conta"}
        </button>
        <span>·</span>
        <button onClick={handlePasswordReset} type="button">
          Esqueci a senha
        </button>
      </div>
    </section>
  );
}

function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Não foi possível autenticar agora.";
  }

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Este email já está em uso.",
    "auth/invalid-credential": "Email ou senha inválidos.",
    "auth/invalid-email": "Email inválido.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente em alguns minutos.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
    "auth/wrong-password": "Email ou senha inválidos.",
  };

  return messages[error.code] ?? "Não foi possível autenticar agora.";
}
