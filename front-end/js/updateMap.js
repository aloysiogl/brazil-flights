const flightsQuery = () => {
    const {
        startDate: start,
        endDate: end,
        states,
        airlines,
        types,
    } = ctx.filter
    filterDate = start || end
    filterState = states.size > 0
    filterAirline = airlines.size > 0
    filterType = types.size > 0

    return `SELECT
                r.origin_airport,
                r.origin_state,
                r.origin_latitude,
                r.origin_longitude,
                r.destination_airport,
                r.destination_state,
                r.destination_latitude,
                r.destination_longitude,
                SUM(r.count) as count,
                SUM(r.count * r.duration) / SUM(r.count) as duration,
                SUM(r.count * r.delay) / SUM(r.count) as delay
            FROM
                \`inf552-project.routes.routes\` r
            WHERE
                1 = 1
                ${
                    filterDate
                        ? `AND "${start}" <= r.date AND r.date <= "${end}"`
                        : ''
                }
                ${
                    filterAirline
                        ? `AND r.airline IN ("${Array.from(airlines).join(
                              '","'
                          )}")`
                        : ''
                }
                ${
                    filterType
                        ? `AND r.type IN (${Array.from(types).join()})`
                        : ''
                }
                ${
                    filterState
                        ? `AND r.origin_state IN ("${Array.from(states).join(
                              '","'
                          )}")`
                        : ''
                }
                ${
                    filterState
                        ? `AND r.destination_state IN ("${Array.from(
                              states
                          ).join('","')}")`
                        : ''
                }
            GROUP BY
                r.origin_airport,
                r.origin_state,
                r.origin_latitude,
                r.origin_longitude,
                r.destination_airport,
                r.destination_state,
                r.destination_latitude,
                r.destination_longitude`
}

const updateMap = () => {
    if (!ctx.drawRoutes && !ctx.drawAirports) {
        drawTrajectories([])
        drawAirportDensity([])
    } else {
        const request = ctx.bigquery.jobs.query({
            projectId: ctx.projectId,
            query: flightsQuery(),
            useLegacySql: false,
        })
        request.execute(response => {
            const traj = response.rows.map(({ f: row }) => {
                var route = {}
                response.schema.fields.forEach(({ name, type }, i) => {
                    switch (type) {
                        case 'FLOAT':
                            route[name] = row[i].v ? parseFloat(row[i].v) : null
                            break
                        case 'INTEGER':
                            route[name] = row[i].v ? parseInt(row[i].v) : null
                            break
                        default:
                            route[name] = row[i].v
                            break
                    }
                })
                return route
            })

            if (ctx.drawRoutes) {
                drawTrajectories(traj)
            } else {
                drawTrajectories([])
            }

            if (ctx.drawAirports) {
                drawAirportDensity(traj)
            } else {
                drawAirportDensity([])
            }
        })
    }
}
