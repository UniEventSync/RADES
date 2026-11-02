import { AuthForm } from "@/components/auth-form";
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) { const { email } = await searchParams; return <div className="flex min-h-[calc(100vh-152px)] items-center justify-center px-5 py-12"><AuthForm mode="reset" initialEmail={email}/></div>; }
