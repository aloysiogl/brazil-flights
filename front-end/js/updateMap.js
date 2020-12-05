const updateMap = () => {
    if (!ctx.drawRoutes && !ctx.drawAirports) {
        drawTrajectories([])
        drawAirportDensity([])
    } else {
        jQuery.get(
            ctx.serverUrl,
            {
                name: 'flights',
                startDate: ctx.filter.startDate,
                endDate: ctx.filter.endDate,
                airlines: JSON.stringify([...ctx.filter.airlines]),
                types: JSON.stringify([...ctx.filter.types]),
                states: JSON.stringify([...ctx.filter.states]),
            },
            response => {
                const traj = response.map(row => {
                    const originAirport = ctx.airportsMap.get(row.origin_airport)
                    const destinationAirport = ctx.airportsMap.get(row.destination_airport)
                    return {
                        origin_airport: row.origin_airport,
                        origin_coordinates: [
                            originAirport.longitude,
                            originAirport.latitude,
                        ],
                        origin_state: originAirport.state,
                        destination_airport: row.destination_airport,
                        destination_coordinates: [
                            destinationAirport.longitude,
                            destinationAirport.latitude,
                        ],
                        destination_state: destinationAirport.state,
                        count: row.count,
                        avg_duration: row.avg_duration,
                        avg_delay: row.avg_delay,
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
            }
        )
    }
}
