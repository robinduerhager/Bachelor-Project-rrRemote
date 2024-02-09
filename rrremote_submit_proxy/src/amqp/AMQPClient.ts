/*
 * Insipiert durch folgende Quellen:
 * QUELLE: https://www.rabbitmq.com/tutorials/tutorial-six-javascript.html
 * QUELLE: https://github.com/murnax/rabbitmq-with-expressjs/blob/master/amqpClient.js
 * QUELLE: https://www.squaremobius.net/amqp.node/channel_api.html
 */

import amqp, { ConsumeMessage } from 'amqplib'
import uuidv4 from 'uuid/v4'
import { RequireAtLeastOne } from '../utils/types'

export interface amqpEventProps {
  topic: string
  category: string
  action: string
}

export interface amqpClientOptions {
  username: string
  secret: string
  domain: string
  port: number
  serviceName: string
  rpcQueue?: string
}

export interface amqpClientProps {
  channel: amqp.Channel
  renderjobExchange: amqp.Replies.AssertExchange
  rpcReplyQueue: amqp.Replies.AssertQueue
}

class AMQPClient implements amqpClientOptions {
  public username: string
  public secret: string
  public domain: string
  public port: number
  public serviceName: string

  public channel: amqp.Channel
  public renderjobExchange: amqp.Replies.AssertExchange
  public rpcReplyQueue: amqp.Replies.AssertQueue

  private constructor(options: amqpClientOptions, props: amqpClientProps) {
    this.username = options.username
    this.secret = options.secret
    this.domain = options.domain
    this.port = options.port
    this.serviceName = options.serviceName

    this.channel = props.channel
    this.renderjobExchange = props.renderjobExchange
    this.rpcReplyQueue = props.rpcReplyQueue
  }

  /**
   * @description Creates a new amqpClient which can be used for consuming queues and RPC Queues, sending Messages and RPC Messages in an async fashion.
   * @param options An amqpClientOptions object, which defines parameters for the connection of the amqpClient to the respective AMQP Server.
   * @returns A new amqpClient instance.
   */
  public static async createClient(
    options: amqpClientOptions
  ): Promise<AMQPClient> {
    // If the rpcReplyQueue has not been set in the amqpClientOptions, we will use the default RPC Reply Queue by RabbitMQ
    // Not being able to send RPC Messages would be better i guess
    const DEFAULT_REPLY_QUEUE = 'amqp.rabbitmq.reply-to'
    const REPLY_QUEUE = options.rpcQueue
      ? options.rpcQueue
      : DEFAULT_REPLY_QUEUE

    // Construct the amqp URL in which we want to connect our amqpClient to
    const url = `amqp://${options.username}:${options.secret}@${options.domain}:${options.port}`

    // Create a Heavyweight connection to RabbitMQ
    const connection = await amqp.connect(url)

    // Create a lightweight virtual Connection to RabbitMQ from the heavyweight connection
    const channel = await connection.createChannel()

    // Subscribe to the signal interruption event, to close the connection gracefully in case of the respective event
    process.once('SIGINT', connection.close.bind(connection))

    // Look for the specified ReplyQueue and create the queue if it does not exist
    const rpcReplyQueue = await channel.assertQueue(REPLY_QUEUE, {
      exclusive: true,
      durable: true
    })

    // Look for the specified Exchange or create it, if it does not exist
    const renderjobExchange = await channel.assertExchange('rrremote', 'topic')

    // Any incoming RPC message on the ReplyQueue should emit an event with the name of the correlationID, so we can always handle the right rpc event
    await channel.consume(
      REPLY_QUEUE,
      msg => channel.emit(msg.properties.correlationId, msg.content),
      { noAck: true }
    )

    await channel.prefetch(1)

    return new AMQPClient(options, {
      channel,
      renderjobExchange,
      rpcReplyQueue
    })
  }

  /**
   * @description Sends a new RPC Message to the routingKey, specified by the rpcEvent object. Also registers once for the correlationID event, so we can resolve the reply Message later.
   * @param rpcEvent An Object which defines a basic structure of the routing Key / Event which has been emitted. TOPIC -> The main Topic of the Event, e.g.: Renderjob, File, etc.; CATEGORY -> The subtopic, e.g.: download, upload, processing, etc.; ACTION -> The subsubtopic, e.g.: finished, started, requested, etc.
   * @param message An object which holds all values inside of it. The Payload which should be send over to the other Service.
   * @returns A Promise which holds the message values from the replying Service.
   */
  public sendRPCMessage(
    rpcEvent: RequireAtLeastOne<
      amqpEventProps,
      'topic' | 'category' | 'action'
    >,
    message: object
  ): Promise<Buffer> {
    // convert the message which should be send into a Buffer
    const inMessage = Buffer.from(JSON.stringify(message))

    // retrieve the routingKey from the rpcEvent
    const { routingKey } = this.generateKeys(rpcEvent, true)

    return new Promise((resolve, reject) => {
      // generate a new correlationId for identifying the right event, when the RPC returns something
      const correlationId = uuidv4()
      
      // set an eventListener on name <correlationId>, so the right sendRPCMessage operation triggers the right resolve method
      // thanks to this, we can call sendRPCMessage(PARAMETERS).then(msg => DO SOMETHING WITH THE MESSAGE) or simply await the message result from the RPC.
      this.channel.once(correlationId, resolve)

      // send out the message to the routingKey with the rrremote exchange
      const success = this.channel.publish(
        this.renderjobExchange.exchange,
        routingKey,
        inMessage,
        {
          correlationId,
          replyTo: this.rpcReplyQueue.queue,
          contentType: 'application/json'
        }
      )

      if (!success) throw new Error('Unable to publish RPC Call')
    })
  }

  /**
   * @description Adds a new Listener on a RPC Queue. It's kind of like addListener(), however the callback function has to return an object which gets send back to the replyToQueue.
   * @param rpcEvent An Object which defines a basic structure of the routing Key / Event which has been emitted. TOPIC -> The main Topic of the Event, e.g.: Renderjob, File, etc.; CATEGORY -> The subtopic, e.g.: download, upload, processing, etc.; ACTION -> The subsubtopic, e.g.: finished, started, requested, etc.
   * @param callback The Function which should be called when an RPC Message hits the specified Queue. It has to return an Object, which gets send back to the RPC Emitter / requesting Service.
   * @returns void
   */
  public async addRPCListener(
    rpcEvent: RequireAtLeastOne<
      amqpEventProps,
      'topic' | 'category' | 'action'
    >,
    callback: (msg: amqp.ConsumeMessage) => Promise<object>
  ) {
    // retrieve queueName and routing key, based on the input rpcEvent
    const { queueName, routingKey } = this.generateKeys(rpcEvent, true)

    // assert the queue, so we don't kill the process by using a queue without checking if it's there
    const q = await this.channel.assertQueue(queueName, {
      durable: true
    })

    // assert the exchange, so we don't kill the process by using an exchange without checking if it's there
    const ex = await this.channel.assertExchange(
      this.renderjobExchange.exchange,
      'topic'
    )

    // bind the queue to the exchange with the routingKey, so the queue can get messages by the exchange with that routingKey
    this.channel.bindQueue(q.queue, ex.exchange, routingKey)

    // setup consumption of the queue if messages are being send into that queue
    this.channel.consume(
      q.queue,
      async msg => {
        // Since we are in a RPC Call, we can define our logic in the addRPCListener callback function and retrieve the returned, arbitrary object from that.
        const cbResult: object = await callback(msg)
        if (!cbResult) throw new Error('Content of RPC Callback not valid')

        // The returned object of the callback function includes the values for the requesting RPC Service.
        // If the requesting Service wants a specific renderjobID, the callback could process the request and send back an object with the structure { renderjobID: <value> }.
        this.replyTo(msg, cbResult)
      },
      { noAck: true }
    )
  }

  /**
   * @description Initiates a replying action to the requesting Service.
   * @param msg The incoming Message from the requesting Service / from the Queue.
   * @param replyMessage The outgoing message to the replyToQueue / requesting Service.
   * @returns boolean - true if sending the message to the replyQueue was successfull, else false.
   */
  private replyTo(msg: amqp.ConsumeMessage, replyMessage: object): boolean {
    // Convert the replyMessage Object into a Buffer
    const message = Buffer.from(JSON.stringify(replyMessage))
    
    // Send the converted replyMessage straight back to the replyToQueue (without an exchange, since we now have direct access to the replyToQueue)
    //TODO maybe we should first check if the queue exists before sending back to the replyTo queue - however, the queue should exist, since initializing an amqpClient involves initializing a replyToQueue
    return this.channel.sendToQueue(msg.properties.replyTo, message, {
      correlationId: msg.properties.correlationId,
      contentType: 'application/json'
    })
  }

  /**
   * @description publishes a message to an Event/routingKey/queue in a send and forget about it fashion.
   * @param event The event which will specify the routingKey and queueName (if needed) for the publish.
   * @param message The message which should be send to the specified event. Holds the values which should be transmitted in a key/value pair fashion.
   * @returns boolean - true if the publish was successfull, else false.
   */
  public publishEvent(event: amqpEventProps, message: object) {
    // retrieve routing key, based on the input event
    const { routingKey } = this.generateKeys(event)

    // Convert the message which should be send into a Buffer
    const inMessage = Buffer.from(JSON.stringify(message))

    // publish the message to the routingKey via the rrremote exchange
    const success = this.channel.publish(
      this.renderjobExchange.exchange,
      routingKey,
      inMessage,
      {
        contentType: 'application/json'
      }
    )

    if (!success) throw new Error('Unable to publish Event')
    return success
  }

  /**
   * @description Adds a Listener on a specific Event/Queue. The Callback function will be invoked, if a message hits the specified Event/Queue.
   * @param event The event which will specify the routingKey and queueName on which the Listener should be attached to.
   * @param callback The callback function which should be invoked if a message hits the specified queue.
   * @returns void
   */
  public async addListener(
    event: RequireAtLeastOne<amqpEventProps, 'topic' | 'category' | 'action'>,
    callback: (msg: amqp.ConsumeMessage) => void
  ) {
    // retrieve queueName and routing key, based on the input event.
    const { queueName, routingKey } = this.generateKeys(event)

    // assert a new queue for listening, based on the queueName, retrieved in the previous step.
    const q = await this.channel.assertQueue(queueName, {
      durable: true
    })

    // assert the rrremote exchange, although we store it as an instancevariable. Just a safety guard.
    const ex = await this.channel.assertExchange(
      this.renderjobExchange.exchange,
      'topic'
    )

    // Bind the new queue to the rrremote exchange with the extracted routingKey, so it can be triggered if a message hits it.
    this.channel.bindQueue(q.queue, ex.exchange, routingKey)

    // setup consumption for that queue with a callback function, in which we can setup individual processes, based on the queue which has been set up.
    this.channel.consume(
      q.queue,
      msg => {
        callback(msg)
      },
      { noAck: false }
    )
  }

  /**
   * @description just the typical ack() method, however we don't have to use the channel directly on this.
   * @param msg The Message which should be acknowledged.
   * @returns void
   */
  public acknowledge(msg: amqp.Message) {
    this.channel.ack(msg)
  }

  /**
   * @description Generates a queueName and a routingKey from the input amqpEventProps object.
   * @param event The event which will specify the routingKey and queueName for any Method which uses the amqpEventProps object.
   * @param rpc Defaults to false. If this flag is set, the topic of the event object will be attached a rpc substring.
   * @returns an Object in an amqpEventProps structure.
   */
  private generateKeys(
    event: RequireAtLeastOne<amqpEventProps, 'topic' | 'category' | 'action'>,
    rpc = false
  ): {
    routingKey: string
    queueName: string
  } {
    // Setup defaults
    const DEFAULT_EVENT_PART = 'ALL'
    const DEFAULT_ROUTING_PART = '*'
    
    // topic, category and action are the input types of amqpEventProps.
    // If this is not set, we want to use defaults.
    // If the RPC flag is enabled, the topic will be concatenated with 'rpc', so we don't confuse 'normal' consumers on the same Event.
    //TODO maybe use uuids somehow instead of 'rpc' when the rpc flag is set, this needs further research.
    let topic = event.topic ? event.topic.toLowerCase() : DEFAULT_ROUTING_PART
    if (rpc) topic = topic + 'rpc'

    let category = event.category
      ? event.category.toLowerCase()
      : DEFAULT_ROUTING_PART

    let action = event.action
      ? event.action.toLowerCase()
      : DEFAULT_ROUTING_PART

    // Concat topic, category and action in a typical topic exchange routingKey fashion, so RabbitMQ can identify where the message should be sent to / the queue should be bound to.
    const routingKey = `${topic}.${category}.${action}`

    // The queueName is concatenated in pascalCase.
    // EXAMPLE: topic: renderjob, category: upload, action: finished will be trnsformed into RenderjobUploadFinished. With rpc flag: RenderjobrpcUploadFinished.
    const queueName = topic
      .toPascalCase()
      .concat(
        category !== DEFAULT_ROUTING_PART
          ? category.toPascalCase()
          : DEFAULT_EVENT_PART,
        action !== DEFAULT_ROUTING_PART
          ? action.toPascalCase()
          : DEFAULT_EVENT_PART,
          this.serviceName
      )

    return {
      routingKey,
      queueName
    }
  }
}

export default AMQPClient
