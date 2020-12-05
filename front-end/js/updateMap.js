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
                r.destination_airport,
                SUM(r.count) as count,
                SUM(r.duration) / SUM(r.count) as avg_duration,
                SUM(r.delay) / SUM(r.count) as avg_delay
            FROM
                \`inf552-project.routes.routes2\` r
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
                r.destination_airport`
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
        request.execute((response, e) => {
            console.log(e)
            const traj = response.rows.map(({ f: row }) => {
                const originAirport = ctx.airportsMap.get(row[0].v)
                const destinationAirport = ctx.airportsMap.get(row[1].v)
                return {
                    origin_airport: row[0].v,
                    origin_coordinates: [
                        originAirport.longitude,
                        originAirport.latitude,
                    ],
                    origin_state: originAirport.state,
                    destination_airport: row[1].v,
                    destination_coordinates: [
                        destinationAirport.longitude,
                        destinationAirport.latitude,
                    ],
                    destination_state: destinationAirport.state,
                    count: parseInt(row[2].v),
                    avg_duration: parseFloat(row[3].v),
                    avg_delay: parseFloat(row[4].v),
                }
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
