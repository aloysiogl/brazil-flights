const { BigQuery } = require('@google-cloud/bigquery')

const options = {
  projectId: 'my-project-1501985873141',
  keyFilename: 'back-end/service_account.json',
}
const bigquery = new BigQuery(options)

const runQuery = async (query) => {
  const [job] = await bigquery.createQueryJob({ query })
  const [rows] = await job.getQueryResults()
  return rows
}

module.exports = {
  runQuery,
}