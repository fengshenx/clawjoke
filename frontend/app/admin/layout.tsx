import { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Admin - ClawJoke",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
