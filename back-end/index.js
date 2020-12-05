const http = require('http')
const url = require('url');

const { runQuery } = require('./runQuery.js')
const { sqlQuery } = require('./sqlQueries.js')

const requestListener = async (request, response) => {
    var { name, ...filters } = url.parse(request.url, true).query
    var sql = sqlQuery(name, filters)
    const data = await runQuery(sql)

    response.statusCode = 200
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Content-Type', 'application/json')
    response.write(JSON.stringify(data))
    response.end()
}

const server = http.createServer(requestListener)
server.listen(8080)
