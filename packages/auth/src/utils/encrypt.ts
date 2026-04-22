import Cryptr from "cryptr"
import { CRYPTO_SECRET } from "./env"

const crypt = new Cryptr(CRYPTO_SECRET)

export default crypt
