export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon.png|icon.png|apple-touch-icon.png|img|manifest.json|login|register).*)",
  ],
};