import * as admin from 'firebase-admin'

// Initialize the Firebase App with the Credentials, provided by Gitlab-CI
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://<DB NAME>.firebaseio.com'
})

// Get the Firebase Auth instance from the admin SDK
// We can also get more instances here, like Firestore if needed
const firebaseAuth = admin.auth()

export {
  firebaseAuth
}