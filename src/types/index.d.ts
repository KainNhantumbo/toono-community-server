import type { Application, NextFunction, Request, Response } from "express";
import type { IncomingMessage, Server as HttpServer, ServerResponse } from "http";

declare namespace Server {
  type CurrentServer = HttpServer<typeof IncomingMessage, typeof ServerResponse>;
  type DecodedPayload = { id: string; role: "USER" | "ADMIN" };
  type AppProps = { app: Application; port: number };
  type LoggerProps = { message: string; fileName: string };
  type HandledFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
}

declare namespace Schemas {}

declare namespace Github {
  type AuthResponse = {
    access_token: string;
    token_type: string;
    scope: string;
  };

  type UserData = {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    name: string;
    company: string;
    blog: string;
    location: string;
    email: string;
    hireable: boolean;
    bio: string;
    twitter_username: string;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
    private_gists: number;
    total_private_repos: number;
    owned_private_repos: number;
    disk_usage: number;
    collaborators: number;
    two_factor_authentication: boolean;
    plan: {
      name: string;
      space: number;
      collaborators: number;
      private_repos: number;
    };
  };
}
