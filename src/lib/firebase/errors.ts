"use client";

import { FirebaseError } from "firebase/app";

export function getFirebaseErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof FirebaseError)) {
    return fallback;
  }

  const messages: Record<string, string> = {
    "functions/unauthenticated": "Sua sessão expirou. Entre novamente.",
    "functions/not-found": "O registro solicitado não foi encontrado.",
    "functions/invalid-argument": "Os dados enviados estão inválidos.",
    "functions/permission-denied": "Você não tem permissão para esta ação.",
    "functions/internal": "Erro interno no servidor. Tente novamente.",
    "functions/unavailable": "Firebase indisponível no momento. Tente novamente.",
  };

  return messages[error.code] ?? `${fallback} (${error.code})`;
}
