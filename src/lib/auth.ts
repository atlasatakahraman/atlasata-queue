import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

const kickProvider = {
  id: "kick",
  name: "Kick",
  type: "oauth" as const,
  authorization: {
    url: "https://id.kick.com/oauth/authorize",
    params: {
      scope: "user:read channel:read chat:write events:subscribe",
      response_type: "code",
    },
  },
  token: {
    url: "https://id.kick.com/oauth/token",
    conform: async (response: Response) => {
      const headers = new Headers(response.headers);
      headers.set("content-type", "application/json");
      const body = await response.text();
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  },
  client: {
    token_endpoint_auth_method: "client_secret_post" as const,
  },
  userinfo: {
    url: "https://api.kick.com/public/v1/users",
    async request({ tokens }: { tokens: { access_token: string } }) {
      // 1. Get user info
      const res = await fetch("https://api.kick.com/public/v1/users", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      const userData = json.data?.[0] ?? {};

      // 2. Also fetch channel data to get chatroom_id as fallback
      if (userData.name) {
        try {
          // Try multiple official endpoints that are covered by our 'channel:read' scope
          const endpoints = [
            `https://api.kick.com/public/v1/channels/${userData.name}`,
            `https://api.kick.com/public/v1/users/${userData.id}` // Sometimes info is here too
          ];

          for (const endpoint of endpoints) {
            const channelRes = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                Accept: "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            
            if (channelRes.ok) {
              const channelJson = await channelRes.json();
              const channelData = Array.isArray(channelJson.data) ? channelJson.data[0] : (channelJson.data || channelJson);
              
              if (channelData && (channelData.chatroom || channelData.chatroom_id)) {
                userData.chatroom = channelData.chatroom || { id: channelData.chatroom_id };
                userData.channel_id = channelData.id;
                userData.chatroom_id = channelData.chatroom?.id || channelData.chatroom_id;
                break; // Found it!
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch channel info during login", e);
        }
      }

      return userData;
    },
  },
  profile(profile: Record<string, unknown>) {
    const mainId = profile.user_id ?? profile.id ?? null;
    // Check multiple potential fields for chatroom ID
    const resolvedChatroomId = (profile.chatroom as any)?.id ?? 
                               profile.chatroom_id ?? 
                               (profile.chatroom as any)?.chatroom_id ?? 
                               null;

    return {
      id: String(mainId ?? ""),
      name: profile.name as string | null,
      email: profile.email as string | null,
      image: profile.profile_picture as string | null,
      chatroomId: resolvedChatroomId ? String(resolvedChatroomId) : null,
    };
  },
  checks: ["pkce", "state"] as ("pkce" | "state" | "none")[],
  clientId: process.env.KICK_CLIENT_ID,
  clientSecret: process.env.KICK_CLIENT_SECRET,
};

export const authConfig: NextAuthConfig = {
  providers: [kickProvider],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.kickId = user.id;
        token.kickUsername = user.name;
        token.kickImage = user.image;
        token.chatroomId = (user as any).chatroomId;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.kickUserId = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.kickId as string;
        session.user.name = token.kickUsername as string;
        session.user.image = token.kickImage as string;
        (session.user as any).chatroomId = token.chatroomId;
      }
      (session as unknown as Record<string, unknown>).accessToken = token.accessToken;
      (session as unknown as Record<string, unknown>).kickUserId = token.kickUserId;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
