const {
  SQSClient,
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
} = require('@aws-sdk/client-sqs')
const { Client, GatewayIntentBits } = require('discord.js')
const { Success } = require('../utils/response')

const TOKEN = process.env.BOT_TOKEN
const GLOBAL_LOG = process.env.BOT_GLOBAL_LOG

exports.processRoll = async ({ Records }) => {
  if (!Records || Records.length === 0) return Success()

  const sqs = new SQSClient({ region: 'sa-east-1' })

  const client = new Client({ intents: [GatewayIntentBits.Guilds] })
  client.login(TOKEN)

  const rolls = Records.map(({ body }) => JSON.parse(body))

  await new Promise(resolve => {
    client.on('ready', resolve)
  })

  const logChannel = client.channels.cache.find(({ id }) => id === GLOBAL_LOG)

  if (!logChannel) {
    console.error(`Global log channel not found: ${GLOBAL_LOG}`)
  }

  for (const record of Records) {
    const { channelId, message } = JSON.parse(record.body)

    const channel = client.channels.cache.find(({ id }) => id === channelId)

    const log = {}

    if (channel) {
      log.result = await channel.send(message)
      log.resultLog = await logChannel.send(message)
    } else {
      console.error(`Channel ${channelId} not found`)
      logChannel.send(`Channel ${channelId} not found\n${message}`)
    }

    log.delete = await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: process.env.SQS_URL,
        ReceiptHandle: record.receiptHandle,
      })
    )

    console.log(log)
  }

  await client.destroy()

  return Success()
}
