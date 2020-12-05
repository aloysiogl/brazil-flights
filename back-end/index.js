const { BigQuery } = require('@google-cloud/bigquery')

const options = {
    projectId: 'my-project-1501985873141',
    keyFilename: 'service_account.json',
}
const bigquery = new BigQuery(options)

async function query() {
    const query = `SELECT
                  r.origin_airport,
                  r.destination_airport,
                  SUM(r.count) as count,
                  SUM(r.duration) / SUM(r.count) as avg_duration,
                  SUM(r.delay) / SUM(r.count) as avg_delay
                FROM
                  \`inf552-project.routes.routes2\` r
                GROUP BY
                  r.origin_airport,
                  r.destination_airport`

    const options = {
        query: query,
    }

    const [job] = await bigquery.createQueryJob(options)
    console.log(`Job ${job.id} started.`)

    const [rows] = await job.getQueryResults()

    console.log('Rows:')
    rows.forEach(row => console.log(row))
}

query()
