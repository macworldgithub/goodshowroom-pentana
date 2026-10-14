"use client";
import { useRouter } from "next/navigation";
import { ActionDialog } from "@/components/live-common";
import { api } from "@/lib/backend";
import { createClient } from "@/lib/supabase/client";
export default function Page() {
  const router = useRouter();
  return (
    <ActionDialog
      title="Create the first administrator"
      description="For a new installation only. The setup key is supplied by your system administrator."
      submitLabel="Create initial account"
      onClose={() => router.push("/login")}
      fields={[
        { name: "fullName", label: "Full name", required: true },
        { name: "email", label: "Work email", type: "email", required: true },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
          minLength: 12,
          maxLength: 128,
        },
        {
          name: "setupKey",
          label: "Setup key",
          type: "password",
          required: true,
        },
      ]}
      onSubmit={async (values) => {
        await api("auth/initial-user", {
          method: "POST",
          public: true,
          body: values,
        });
        const { error } = await createClient().auth.signInWithPassword({
          email: String(values.email),
          password: String(values.password),
        });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      }}
    />
  );
}
