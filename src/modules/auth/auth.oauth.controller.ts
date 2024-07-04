import axios from "axios";
import "dotenv/config";
import type { Request, Response } from "express";
import { db } from "../../database/client.database";
import Exception from "../../lib/app-exception";
import { createToken } from "../../lib/utils";
import { Github } from "../../types";

export default class OauthController {
  async github(req: Request, res: Response) {
    const { code, scope } = req.params;
    if (!code || !scope) throw new Exception("Please provide correct parameters", 400);

    const CLIENT_SECRET = process.env.GITHUB_SECRET_ID;
    const CLIENT_ID = process.env.GITHUB_CLIENT_ID;

    //  get the github auth token
    const { data } = await axios<Github.AuthResponse>({
      url: "https://github.com/login/oauth/access_token",
      data: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code: code },
      headers: { Accept: "application/json" }
    });

    if (!data) throw new Exception("Error fetching access token from GitHub.", 400);

    // get the user data
    const { access_token } = data;

    const { data: userData } = await axios<Github.UserData>({
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
