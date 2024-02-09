import * as admin from 'firebase-admin'

// Initialize the Firebase App with the Credentials, provided by Gitlab-CI
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: '<FIREBASE DATABASE URL>'
})

// Get the Firebase Firestore instance from the admin SDK
// We can also get more instances here, like Firebase Auth if needed
const firestore = admin.firestore()

export {
  firestore
}