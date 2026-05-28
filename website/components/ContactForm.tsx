"use client";

import { FormEvent, useState } from "react";
import { contactEmail } from "@/lib/site";
import { ensureStoredSessionId } from "@/lib/browser-session";

type FormState = "idle" | "submitting" | "error";
type ContactResponse = {
  ok: true;
  sessionId: string;
  chatId: string;
  prompt: string;
};

export const CONTACT_SUBMITTED_EVENT = "homeview:contact-submitted";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const projectType = String(formData.get("projectType") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    try {
      const sessionId = await ensureStoredSessionId({
        email,
        landingPage: window.location.pathname
      });
      const payload = {
        ...Object.fromEntries(formData),
        sessionId
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        setState("error");
        return;
      }

      const chatResponse = await fetch(`/api/sessions/${sessionId}/chats`, { method: "POST" });
      if (!chatResponse.ok) {
        setState("error");
        return;
      }

      const { chatId } = (await chatResponse.json()) as { chatId: string };
      const detail: ContactResponse = {
        ok: true,
        sessionId,
        chatId,
        prompt: `Project type: ${projectType}\nMessage: ${message}`
      };

      form.reset();
      window.dispatchEvent(new CustomEvent<ContactResponse>(CONTACT_SUBMITTED_EVENT, { detail }));
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <label>
        <span>Name</span>
        <input name="name" required placeholder="Your name" />
      </label>
      <label>
        <span>Email</span>
        <input name="email" required type="email" placeholder={contactEmail} />
      </label>
      <label>
        <span>Project type</span>
        <select name="projectType" defaultValue="Real estate">
          <option>Real estate</option>
          <option>Architecture</option>
          <option>Construction</option>
          <option>Insurance</option>
          <option>Homeowner record</option>
        </select>
      </label>
      <label>
        <span>Message</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us about the property, timeline, and what you want to capture."
        />
      </label>
      <button className="button button-dark" disabled={state === "submitting"} type="submit">
        <span>{state === "submitting" ? "Sending..." : "Contact us"}</span>
        <span aria-hidden="true">↗</span>
      </button>
      {state === "error" ? <p className="form-note error-note">Something failed. Email us at {contactEmail}.</p> : null}
    </form>
  );
}
