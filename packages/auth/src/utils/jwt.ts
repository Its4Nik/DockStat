import { jwtVerify, SignJWT } from "jose"
import { JWT_SECRET } from "./env"

// biome-ignore lint/suspicious/noExplicitAny: a
export async function createAuthToken(userInfo: any): Promise<string> {
  return await new SignJWT({ user: userInfo })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(JWT_SECRET)
}

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
    return payload
  } catch (_) {
    return null
  }
}
