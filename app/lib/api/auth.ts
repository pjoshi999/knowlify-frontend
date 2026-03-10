import apiClient, { unwrapApiData } from "./client";
import type { User } from "./service-types";

type BackendRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

interface BackendMe {
  id: string;
  email: string;
  role: BackendRole;
  name: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

const mapRole = (role: BackendRole): User["role"] => {
  if (role === "INSTRUCTOR") return "instructor";
  return "student";
};

export async function getBackendMe(): Promise<User> {
  const response = await apiClient.get("/auth/me");
  const me = unwrapApiData<BackendMe>(response.data);

  return {
    id: me.id,
    email: me.email,
    role: mapRole(me.role),
    name: me.name,
    createdAt: new Date(me.createdAt),
    updatedAt: new Date(me.updatedAt),
  };
}
