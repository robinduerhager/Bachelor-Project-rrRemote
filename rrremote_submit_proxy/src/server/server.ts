import AMQP from '../amqp/AMQPClient'
import { exec } from 'child_process'
import express from 'express'
import bodyParser from 'body-parser'

/**
 * @description Sets up an Express-REST Server, which will listen on /. get / will retrieve a Hello World function, while a POST Request on / will lead to a Renderjobstatus update of a Renderjob. This is necessary, because Royal Render has problems with connecting to RabbitMQ via the Python module called 'pika'
 * @param port The Port on which the Express App should run
 */
export const initApp = async (port: number) => {
	
  const app = express()

  // Setup bodyParser middleware for Express
  app.use(bodyParser.urlencoded({ extended: true }))

  // Setup the GET / Route with the Hello World functionality
  app.get('/', (req, res) => {
    res.send('Hello World')
  })

  // Setup the POST / Route with the publish Renderjobstatus update message
  app.post('/', (req, res) => {
	  
	  if (!req.body.renderjobID || !req.body.artistID || !req.body.status)
    throw new Error('Unable to send Renderjob Update Command')
    
    // publish a Renderjobstatus update Event
    // This will trigger the Upload Renderings sequence, if all Renderjobs have been Finished
    // Note, that there is a bug in the rrServer, which sometimes leads to faulty Renderjobstati, when querying Renderjob details (Royal Render v. 8.2.24). Holger Schönberge is informed of this and is about to update Royal Render, so RR should be updated in the upcoming months.
    const success = amqpClient.publishEvent({
      topic: 'Renderjob',
      category: 'status',
      action: 'update'
    }, {
		renderjobID: req.body.renderjobID,
		artistID: req.body.artistID,
    status: req.body.status,
    imgdirPart: req.body.imgdirPart ? req.body.imgdirPart : undefined
	})
	
	if (!success)
		throw new Error('Unable to send Renderjob Update Command')
	
	res.send('done')
  })

  // Connect the amqpClient with RabbitMQ
  const amqpClient = await AMQP.createClient({
    username: process.env.RABBITMQ_DEFAULT_USER,
    secret: process.env.RABBITMQ_DEFAULT_PASS,
    domain: '172.31.18.2',
    port: 5672,
    rpcQueue: 'renderjob.submitproxy.reply-to',
    serviceName: 'submitProxy'
  })

  // Add an RPC Listener for submitting a Renderjob, so the Renderjob Service can handle any undesired behaviour, and we don't have to update this proxy all the time (this proxy is not set up with gitlab-ci, since it has to be deployed as a windows service on the windows server via the npm package 'pm2')
  amqpClient.addRPCListener(
    {
      topic: 'Renderjob',
      category: 'submit',
      action: 'send'
    },
    msg => {
      return new Promise((resolve, reject) => {
        if (!msg) throw new Error('Unable to proxy submit')

        const convertedMsg = JSON.parse(msg.content.toString())
        if (!convertedMsg.commandOptions)
          throw new Error('Unable to proxy submit')

        let response = {
          err: undefined,
          stdout: undefined,
          stderr: undefined
        }
        // Execute the rrSubmitterconsole with the incoming RRCommand
        exec(
          `C:\\RR\\bin\\win64\\rrSubmitterconsole D:\\Animation\\student\\_IFS\\PROD\\${convertedMsg.commandOptions}`,
          (err, stdout, stderr) => {
            // Catch all Errors and stdout
            if (err) {
              response.err = err
              console.error(err)
            }

            if (stdout) {
              response.stdout = stdout
              console.log(stdout)
            }

            if (stderr) {
              response.stderr = stderr
              console.error(stderr)
            }

            // send back the response
            resolve(response)
          }
        )
      })
    }
  )
  .catch(e => {
    if (e) console.error(e)
  })

  app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`)
  })

  return amqpClient
}
