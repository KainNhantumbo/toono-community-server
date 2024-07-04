import axios from "axios";
import "dotenv/config";
import type { Request, Response } from "express";
import { db } from "../../database/client.database";
import Exception from "../../lib/app-exception";
import { createToken } from "../../lib/utils";

export type GithubAuthResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

export type GithubUserData = {
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

export default class OauthController {
  async github(req: Request, res: Response) {
    const { code, scope } = req.params;
    if (!code || !scope) throw new Exception("Please provide correct parameters", 400);

    const CLIENT_SECRET = process.env.GITHUB_SECRET_ID;
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;

    //  get the github auth token
    const { data } = await axios<GithubAuthResponse>({
      url: "https://github.com/login/oauth/access_token",
      data: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: code },
      headers: { Accept: "application/json" }
    });

    if (!data) throw new Exception("Error fetching access token from GitHub.", 400);

    // get the user data
    const { access_token } = data;

    const { data: userData } = await axios<GithubUserData>({
      url: "https://api.github.com/user",
      headers: { Authorization: `Bearer ${access_token}` }
    });

    // check if this user exists
    const user = await db.query.users.findFirst({
      where: (table, func) => func.eq(table.email, userData.email),
      columns: { id: true, email: true, name: true, role: true, password: true },
      with: { profile_image: true }
    });

    if (!user) throw new Exception("User not found", 404);

    // authenticate user
    const accessToken = await createToken(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN || "",
      "10m"
    );
    const refreshToken = await createToken(
      { id: user.id, role: user.role },
      process.env.REFRESH_TOKEN || "",
      "7d"
    );

    return res
      .status(200)
      .cookie("USER_TOKEN", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      .json({
        id: user.id,
        token: accessToken,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image?.url || ""
      });
  }
}
