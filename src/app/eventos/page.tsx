import { redirect } from "next/navigation";

export const dynamic = "force-static";

/** Agenda pública passou para /calendario */
export default function EventosPage() {
  redirect("/calendario");
}
