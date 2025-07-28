import { redirect } from "next/navigation";

export default function HomeRedirect() {
  redirect("/auth");
  return null;
}
