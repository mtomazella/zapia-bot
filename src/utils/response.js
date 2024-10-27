const createResponse = ({ headers, statusCode, body }) => ({
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    ...headers,
  },
  statusCode,
  body: body !== undefined ? JSON.stringify(body) : undefined,
})

exports.Success = body => createResponse({ statusCode: 200, body })

exports.Created = body => createResponse({ statusCode: 201, body })

exports.BadRequest = body =>
  createResponse({
    statusCode: 400,
    body: body ?? { error: 'Invalid payload' },
  })

exports.Unauthorized = body => createResponse({ statusCode: 401, body })

exports.NotFound = body => createResponse({ statusCode: 404, body })

exports.InternalServerError = body =>
  createResponse({
    statusCode: 500,
    body: body ?? { error: 'There was an error processing your request' },
  })
