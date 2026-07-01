"use client";

import { httpsCallable } from "firebase/functions";
import { FirebaseError } from "firebase/app";
import { firebaseAuth, firebaseFunctions } from "@/lib/firebase/client";
import type {
  AddWordToLanguageDeckRequest,
  AddWordToLanguageDeckResponse,
  CreateStudySessionRequest,
  CreateStudySessionResponse,
  DeleteAccountResponse,
  GenerateStudyTextRequest,
  GenerateStudyTextResponse,
  GetReviewCardsRequest,
  GetReviewCardsResponse,
  SubmitCardAnswerRequest,
  SubmitCardAnswerResponse,
} from "@/lib/api/contracts";

const generateStudyTextCallable = httpsCallable<
  GenerateStudyTextRequest,
  GenerateStudyTextResponse
>(firebaseFunctions, "generateStudyText");

const addWordToLanguageDeckCallable = httpsCallable<
  AddWordToLanguageDeckRequest,
  AddWordToLanguageDeckResponse
>(firebaseFunctions, "addWordToLanguageDeck");

const createStudySessionCallable = httpsCallable<
  CreateStudySessionRequest,
  CreateStudySessionResponse
>(firebaseFunctions, "createStudySession");

const getReviewCardsCallable = httpsCallable<GetReviewCardsRequest, GetReviewCardsResponse>(
  firebaseFunctions,
  "getReviewCards",
);

const submitCardAnswerCallable = httpsCallable<
  SubmitCardAnswerRequest,
  SubmitCardAnswerResponse
>(firebaseFunctions, "submitCardAnswer");

const deleteAccountCallable = httpsCallable<void, DeleteAccountResponse>(
  firebaseFunctions,
  "deleteAccount",
);

async function requireAuthToken() {
  const user = firebaseAuth.currentUser;

  if (!user) {
    throw new FirebaseError("functions/unauthenticated", "Usuário não autenticado.");
  }

  await user.getIdToken();
}

export async function generateStudyText(request: GenerateStudyTextRequest) {
  await requireAuthToken();
  const result = await generateStudyTextCallable(request);
  return result.data;
}

export async function addWordToLanguageDeck(request: AddWordToLanguageDeckRequest) {
  await requireAuthToken();
  const result = await addWordToLanguageDeckCallable(request);
  return result.data;
}

export async function createStudySession(request: CreateStudySessionRequest) {
  await requireAuthToken();
  const result = await createStudySessionCallable(request);
  return result.data;
}

export async function getReviewCards(request: GetReviewCardsRequest) {
  await requireAuthToken();
  const result = await getReviewCardsCallable(request);
  return result.data;
}

export async function submitCardAnswer(request: SubmitCardAnswerRequest) {
  await requireAuthToken();
  const result = await submitCardAnswerCallable(request);
  return result.data;
}

export async function deleteAccount() {
  await requireAuthToken();
  const result = await deleteAccountCallable();
  return result.data;
}
