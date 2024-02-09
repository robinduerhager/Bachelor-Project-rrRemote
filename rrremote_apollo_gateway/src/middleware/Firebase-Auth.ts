import * as admin from 'firebase-admin'

const firebaseApp = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://<DB NAME>.firebaseio.com'
})

export const auth = admin.auth()