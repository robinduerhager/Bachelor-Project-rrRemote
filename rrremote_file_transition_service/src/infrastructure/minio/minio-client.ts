import { Client } from "minio"
const Minio = require('minio')

// Connect the minioClient to the MinIO Instance of the Linux VM
export const minioClient: Client = new Minio.Client({
  endPoint: process.env.NODE_ENV === 'production' ? 'minio' : 'localhost',
  port: process.env.NODE_ENV === 'production' ? 9000 : 9001,
  useSSL: false,
  accessKey: process.env.NODE_ENV === 'production' ? process.env.MINIO_ACCESS_KEY : 'minio',
  secretKey: process.env.NODE_ENV === 'production' ? process.env.MINIO_SECRET_KEY : 'minio123'
})