import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add account association
    frame: {
      version: "1",
      name: "Monad Farcaster MiniApp Template",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "template"],
      primaryCategory: "developer-tools",
      buttonTitle: "Launch Template",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
    accountAssociation: {
      "header": "eyJmaWQiOjEwNzA0MDUsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhCODdDZGRCOEI4NGQ3YjVlMGQzN0VEQzk3NzFhZjc0MjgzYTQ3ZjUxIn0",
      "payload": "eyJkb21haW4iOiJtaW5pLmJsYXN0LWNvbW1hbmRlci54eXoifQ",
      "signature": "MHg3NDQ5OTI3ZDk5NmJjODdkN2QxNzBjMDEzYmYzZDBlZjAwZjMwNzA5MzE0M2ZlYTI2ZjhjMzJmMjMxMDBmYzM2MTg1MjBlYjU2YzI1YzNmMzZiOWJiZjkyMDgxMjBlYzMwNTMyNzIyNjE4NmQwOWRjNDgyMDUxMTE0NzQ1YmViODFj"
    }
  };

  return NextResponse.json(farcasterConfig);
}
