import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { headers } from "next/headers";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { RefreshToken } from "@/utils/components";
import { Navbar } from "@/components/navbar";
import { UserNavbar } from "@/components/userbar";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  var path = await headers().then((h) => {
    return h.get("x-path");
  });

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col h-screen">
            {path == "/" && <Navbar activeIndex={0} />}
            {path!.includes("/user") && (
              <>
                {(path!.includes("/my-events") ||
                  path!.includes("/create-event")) && (
                  <UserNavbar activeIndex={0} />
                )}
                {(path!.includes("/joined-events") ||
                  path!.includes("/join-event") ||
                  path!.includes("/manage-booking")) && (
                  <UserNavbar activeIndex={1} />
                )}
              </>
            )}
            <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
              <RefreshToken>{children}</RefreshToken>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
