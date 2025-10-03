import { Google } from "arctic";
import { env } from "$env/dynamic/private";

export const google = new Google(
  env.GOOGLE_CLIENT_ID as string,
  env.GOOGLE_CLIENT_SECRET as string,
  "http://localhost:5173/login/google/callback" // replace in prod
);