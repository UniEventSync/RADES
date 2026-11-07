import { AuthForm } from "@/components/auth-form";
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) { const { next } = await searchParams; return <div className="flex min-h-[calc(100vh-152px)] items-center justify-center px-5 py-12"><AuthForm mode="signin" nextPath={next}/></div>; }
