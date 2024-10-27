const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs')
const { SQS_MESSAGE_GROUP_ID } = require('../constants')
const {
  Created,
  InternalServerError,
  BadRequest,
} = require('../utils/response')
const { omit } = require('lodash')

exports.sendRoll = async event => {
  try {
    const sqs = new SQSClient({ region: 'sa-east-1' })

    const {
      destinationKey,
      result,
      player,
      space,
      situation,
      detailedResult,
      controls = [],
    } = JSON.parse(event.body ?? '{}') ?? {}

    if (!destinationKey || !result) {
      return BadRequest()
    }

    let [guildId, channelId] = destinationKey.split('/')
    if (channelId === undefined) {
      channelId = guildId
      guildId = undefined
    }

    const message = [undefined, []]

    if (player) message[0] = `> **${player}**`
    if (space) message[1][0] = space
    if (situation) message[1][1] = situation
    if (message[1].length === 0) message[1] = undefined
    else {
      message[1] = `${message[1].filter(e => !!e).join(' - ')}`
      if (controls.length > 0)
        message[1] += ` (${controls.map(({ name }) => name).join(', ')})`
      message[1] = `> **${message[1]}**`
    }
    if (detailedResult) message[2] = `> *${detailedResult}*`
    message[3] = `> ### ${result}`

    const MessageBody = {
      channelId,
      message: message.filter(e => !!e).join('\n'),
    }

    /** @type {import('@aws-sdk/client-sqs').SendMessageCommandInput} */
    const command = {
      QueueUrl: process.env.SQS_URL,
      MessageGroupId: SQS_MESSAGE_GROUP_ID,
      MessageBody: JSON.stringify(MessageBody),
      MessageDeduplicationId: Date.now().toString(),
    }

    await sqs.send(new SendMessageCommand(command)).catch(error => {
      console.error(error)
      throw { type: 'SQS', error }
    })

    console.log(command)
    return Created(omit(command, 'QueueUrl'))
  } catch (err) {
    console.error(err)
    return InternalServerError({ error: err })
  }
}
