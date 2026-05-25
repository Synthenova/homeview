"use client";

import { FormEvent, useState } from "react";
import { contactEmail } from "@/lib/site";

type FormState = "idle" | "submitting" | "sent" | "error";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" }
    });

    if (response.ok) {
      form.reset();
      setState("sent");
    } else {
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
      {state === "sent" ? <p className="form-note">Request received. We will reply by email.</p> : null}
      {state === "error" ? <p className="form-note error-note">Something failed. Email us at {contactEmail}.</p> : null}
    </form>
  );
}
