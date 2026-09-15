"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function eurosToCents(value: FormDataEntryValue | null): number {
  const parsed = parseFloat(String(value ?? "0").replace(",", "."));
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    redirect("/login?error=1");
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createStudent(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const { error } = await supabase.from("students").insert({
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    email: email || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    class_name: String(formData.get("class_name") ?? "").trim() || null,
    expected_amount: eurosToCents(formData.get("expected_amount")),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) {
    redirect("/students/new?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/");
  redirect("/");
}

export async function updateStudent(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  await supabase
    .from("students")
    .update({
      first_name: String(formData.get("first_name") ?? "").trim(),
      last_name: String(formData.get("last_name") ?? "").trim(),
      email: email || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      class_name: String(formData.get("class_name") ?? "").trim() || null,
      expected_amount: eurosToCents(formData.get("expected_amount")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);
  revalidatePath("/");
  revalidatePath(`/students/${id}`);
}

export async function deleteStudent(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("students").delete().eq("id", String(formData.get("id")));
  revalidatePath("/");
  redirect("/");
}

export async function addManualPayment(formData: FormData) {
  const supabase = await createClient();
  const studentId = String(formData.get("student_id"));
  const paidAt = String(formData.get("paid_at") ?? "");
  await supabase.from("payments").insert({
    student_id: studentId,
    amount: eurosToCents(formData.get("amount")),
    method: String(formData.get("method") ?? "autre"),
    description: String(formData.get("description") ?? "").trim() || null,
    paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
    status: "paid",
  });
  revalidatePath("/");
  revalidatePath(`/students/${studentId}`);
}

export async function deletePayment(formData: FormData) {
  const supabase = await createClient();
  const studentId = String(formData.get("student_id") ?? "");
  await supabase.from("payments").delete().eq("id", String(formData.get("id")));
  revalidatePath("/");
  if (studentId) revalidatePath(`/students/${studentId}`);
}

export async function assignPayment(formData: FormData) {
  const supabase = await createClient();
  const studentId = String(formData.get("student_id") ?? "");
  if (!studentId) return;
  await supabase
    .from("payments")
    .update({ student_id: studentId })
    .eq("id", String(formData.get("payment_id")));
  revalidatePath("/");
  revalidatePath(`/students/${studentId}`);
}
