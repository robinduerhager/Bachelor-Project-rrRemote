import { Response, Request } from "express"
import * as admin from 'firebase-admin'

// Gives us autocompletion for the firebase-admin SDK
export interface Context {
  req: Request
  res: Response
  auth: admin.auth.Auth
  token: string
}