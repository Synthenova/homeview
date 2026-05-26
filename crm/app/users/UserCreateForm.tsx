"use client";

import { useActionState } from "react";
import { createCrmUser } from "./actions";

type FormState = {
  error?: string;
  ok?: string;
};

const initialState: FormState = {};

export function UserCreateForm() {
  const [state, formAction, pending] = useActionState(createCrmUser, initialState);

  return (
    <form action={formAction} className="crm-form">
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.ok ? <p className="form-success">{state.ok}</p> : null}
      <label>
        Email
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        Role
        <select defaultValue="viewer" name="role" required>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label>
        Temporary password
        <input autoComplete="new-password" minLength={10} name="password" required type="password" />
      </label>
      <button disabled={pending} type="submit">
        {pending ? "Creating..." : "Create login"}
      </button>
    </form>
  );
}
