import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

function isPath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Tanpa konfigurasi Supabase, jangan mengunci aplikasi.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Wajib memakai getUser() (bukan getSession) agar token divalidasi ke server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Halaman dashboard lama dialihkan ke katalog (satu area untuk semua role).
  if (isPath(pathname, "/dashboard")) {
    const catalogUrl = request.nextUrl.clone();
    catalogUrl.pathname = "/katalog";
    catalogUrl.search = "";
    return redirectWithCookies(catalogUrl, response);
  }

  const isProtected = isPath(pathname, "/katalog");
  const isAdminArea = isPath(pathname, "/upload");

  if (!isProtected && !isAdminArea) {
    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("returnTo", pathname);
    return redirectWithCookies(loginUrl, response);
  }

  if (isAdminArea && user.app_metadata?.role !== "ADMIN") {
    const catalogUrl = request.nextUrl.clone();
    catalogUrl.pathname = "/katalog";
    catalogUrl.search = "";
    return redirectWithCookies(catalogUrl, response);
  }

  return response;
}

export const config = {
  matcher: ["/katalog/:path*", "/dashboard/:path*", "/upload/:path*"],
};
