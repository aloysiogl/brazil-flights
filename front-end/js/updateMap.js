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
                    const originAirport = ctx.airportsMap.get(
                        row.origin_airport
                    )
                    const destinationAirport = ctx.airportsMap.get(
                        row.destination_airport
                    )
                    return {
                        origin_coordinates: [
                            originAirport.longitude,
                            originAirport.latitude,
                        ],
                        origin_state: originAirport.state,
                        destination_coordinates: [
                            destinationAirport.longitude,
                            destinationAirport.latitude,
                        ],
                        destination_state: destinationAirport.state,
                        ...row,
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
