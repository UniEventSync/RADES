export function isUploadedMediaUrl(value:string) {
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(!base)return false;
  try { const target=new URL(value); const origin=new URL(base).origin; return target.origin===origin&&target.pathname.startsWith("/storage/v1/object/public/rades-media/"); }
  catch { return false; }
}
