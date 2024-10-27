require('dotenv').config()

const { processRoll } = require('../handlers/processRoll')

processRoll({
  Records: [
    {
      body: JSON.stringify({
        channelId: '1191767519866933279',
        message: 'test',
      }),
    },
  ],
})
