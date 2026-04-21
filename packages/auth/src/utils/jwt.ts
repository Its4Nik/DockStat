import { SignJWT } from "jose"
import { JWT_SECRET } from "./env"

export async function createAuthToken(userInfo: any): Promise<string> {
  return await new SignJWT({ user: userInfo })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(JWT_SECRET)
}
