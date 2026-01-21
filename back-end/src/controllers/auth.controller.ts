import { Request, Response } from 'express'
import authService from '../services/auth.service'

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email: string
    password: string
  }

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' })
  }

  try {
    const result = await authService.login(email, password)
    return res.json(result)
  } catch (err: any) {
    return res.status(401).json({ message: err.message })
  }
}
