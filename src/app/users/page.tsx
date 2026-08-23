import React from "react";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management | Sappy Stationery & Printing",
  description: "Manage store administrators, credentials, and access permissions.",
};

export default function UsersPage() {
  return <UsersClient />;
}