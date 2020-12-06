const updateMap = () => {
    if (!ctx.drawRoutes && !ctx.drawAirports && !ctx.drawPlanes) {
        drawTrajectories([])
        drawAirportDensity([])
        drawPlanes([])
    } else {
        d3.select('#spinner_map').attr('class', 'loader loader-small spinner_map')
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
                        origin_city: originAirport.city,
                        origin_country: originAirport.country,
                        origin_name: originAirport.name,
                        destination_coordinates: [
                            destinationAirport.longitude,
                            destinationAirport.latitude,
                        ],
                        destination_state: destinationAirport.state,
                        destination_city: destinationAirport.city,
                        destination_country: destinationAirport.country,
                        destination_name: destinationAirport.name,
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

                if (ctx.drawPlanes) {
                    drawPlanes(traj)
                } else {
                    drawPlanes([])
                }

                ctx.sectionsLoaded += 1
                if (ctx.sectionsLoaded == 4) {
                    d3.select('#main_spinner').attr('class', 'hidden')
                    d3.select('#main').attr('class', 'main')
                    d3.select('#instructions').attr('style', 'display: block')
                }
                d3.select('#spinner_map').attr('class', 'hidden')
            }
        )
    }
}
