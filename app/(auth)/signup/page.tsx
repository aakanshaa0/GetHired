import { redirect } from "next/navigation";

// Magic-link sign-in creates an account automatically on first use, so
// signup and login are the same flow — avoid duplicating the form.
export default function SignupPage() {
  redirect("/login");
}
