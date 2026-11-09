import { hu } from "../hu";
import { AiError } from "./openai";

export function explainFailure(error: unknown): string {
  if (error instanceof AiError) {
    if (error.failure === "auth") return hu.errors.auth;
    if (error.failure === "quota") return hu.errors.quota;
    if (error.failure === "empty") return hu.errors.emptyGen;
  }
  return hu.errors.service;
}
