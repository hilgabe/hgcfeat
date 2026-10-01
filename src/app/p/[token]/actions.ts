"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function portalCreateAction(token: string, formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("portal_create_request", {
    p_token: token,
    p_title: String(formData.get("title") ?? ""),
    p_description: String(formData.get("description") ?? ""),
    p_type: String(formData.get("type") ?? "outro"),
  });
  revalidatePath(`/p/${token}`);
  if (error) redirect(`/p/${token}?erro=${error.message.includes("rate") ? "limite" : "envio"}`);
  redirect(`/p/${token}?enviada=${data}`);
}

export async function portalCommentAction(token: string, requestId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("portal_comment", {
    p_token: token,
    p_request_id: requestId,
    p_body: String(formData.get("body") ?? ""),
  });
  revalidatePath(`/p/${token}`);
  if (error) redirect(`/p/${token}?erro=envio`);
  redirect(`/p/${token}?comentario=1#${requestId}`);
}
