import { RenderjobRepo } from './renderjobRepo'

if (!process.env.RRREMOTE_RR_USERNAME || !process.env.RRREMOTE_RR_SECRET)
      throw new Error('Unable to Login to RoyalRender')

const renderjobRepo = new RenderjobRepo({
  rrIp: '<LOCAL IP OF RR>',
  rrPort: 7773,
  rrUsername: process.env.RRREMOTE_RR_USERNAME,
  rrSecret: process.env.RRREMOTE_RR_SECRET
})

export {
  RenderjobRepo,
  renderjobRepo
}