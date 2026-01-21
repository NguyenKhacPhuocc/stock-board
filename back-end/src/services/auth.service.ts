// src/services/auth.service.ts
import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwt'

export interface User {
  id: number
  email: string
  passwordHash: string
  role: 'admin' | 'user'
}

// Mock data – thay bằng DB sau
const users: User[] = [
  {
    id: 1,
    email: 'admin@gmail.com',
    passwordHash: bcrypt.hashSync('123456', 10),
    role: 'admin',
  },
]

export interface LoginResult {
  accessToken: string
  user: {
    id: number
    email: string
    role: string
  }
}

const login = async (email: string, password: string): Promise<LoginResult> => {
  const user = users.find(u => u.email === email)
  if (!user) {
    throw new Error('User not found')
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid password')
  }

  const accessToken = generateToken({
    userId: user.id,
    role: user.role,
  })

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  }
}

export default {
  login,
}
