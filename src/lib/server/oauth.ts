import { Google } from "arctic";
import { env } from "$env/dynamic/private";


const callbackURL = import.meta.env.PROD
  ? "https://scribe-svelte.vercel.app/login/google/callback"
  : "http://localhost:5173/login/google/callback";

export const google = new Google(
  env.GOOGLE_CLIENT_ID as string,
  env.GOOGLE_CLIENT_SECRET as string,
  callbackURL
);