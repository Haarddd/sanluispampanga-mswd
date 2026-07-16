import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminAuthRoute = request.nextUrl.pathname.startsWith("/admin/authentication");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/authentication");
  const isSupportRoute = request.nextUrl.pathname.startsWith("/support");
  const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
  const isPendingRoute = request.nextUrl.pathname.startsWith("/verification-pending");
  const isVerifyRoute = request.nextUrl.pathname.startsWith("/verify");
  const isApiOrAsset = 
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json)$/);

  // 1. Guest redirection
  if (!user && !isAuthRoute && !isSupportRoute && !isVerifyRoute && !isAdminRoute && !isApiOrAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/authentication";
    return NextResponse.redirect(url);
  }

  if (!user && isAdminRoute && !isAdminAuthRoute && !isApiOrAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/authentication";
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user rules
  if (user && !isApiOrAsset) {
    // Check if the authenticated user is an Admin
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();
    
    const isAdmin = !!adminUser;

    if (isAdmin) {
      // Admin should be redirected to admin dashboard if on client routes or admin auth route
      if (!isAdminRoute || isAdminAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/dashboard";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // Client User Rules (non-admin)
    if (isAdminRoute) {
      // Client user trying to access admin pages -> redirect to client home
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Fetch client profile to verify onboarding and approval status
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("verification_status, full_name")
      .eq("id", user.id)
      .single();

    const needsOnboarding = !profile?.full_name;
    const isApproved = profile?.verification_status === "APPROVED";

    if (needsOnboarding && !isOnboardingRoute && !isSupportRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (!needsOnboarding && !isApproved && !isPendingRoute && !isSupportRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/verification-pending";
      return NextResponse.redirect(url);
    }

    if (isApproved && (isAuthRoute || isPendingRoute || isOnboardingRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
