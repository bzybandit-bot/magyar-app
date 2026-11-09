import { ui } from "../hu";
import { AiError } from "./openai";

export function explainFailure(error: unknown): string {
  if (error instanceof AiError) {
    if (error.failure === "auth") return ui.errors.auth;
    if (error.failure === "quota") return ui.errors.quota;
    if (error.failure === "empty") return ui.errors.emptyGen;
  }
  return ui.errors.service;
}
