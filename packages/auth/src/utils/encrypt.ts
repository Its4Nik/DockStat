import { CryptrAsync } from "cryptr"
import { CRYPTO_SECRET } from "./env"

const crypt = new CryptrAsync(CRYPTO_SECRET)

export default crypt
