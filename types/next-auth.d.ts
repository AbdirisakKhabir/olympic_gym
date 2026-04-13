import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
      role: string;
      /** both | male | female — re-login may be needed after admin changes this in Settings */
      memberGenderAccess: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username: string;
    role: string;
    memberGenderAccess?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
    memberGenderAccess?: string;
  }
}