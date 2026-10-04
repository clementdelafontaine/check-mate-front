import { hash } from '@node-rs/argon2'

export const hashPassword = (password) => hash(password, { memoryCost: 19456 })
