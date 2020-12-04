const filteredTrajectories = () => {
    const { startDate: start, endDate: end, states } = ctx.filter

    const routesMap = new Map()
    const filterAirline = ctx.filter.airlines.size > 0
    const filterType = ctx.filter.types.size > 0
    const routesCounts = filterAirline ? ctx.airlinesCounts : ctx.routesCounts

    routesCounts
        .filter(({ date, origin_airport, destination_airport, airline, type }) => {
            // Filter by date
            const dateOk = !start || !end || start < date && date < end

            // Filter by airline
            const airlineOk = !filterAirline || ctx.filter.airlines.has(airline)

            // Filter by type
            const typeOk = !filterType || ctx.filter.types.has(type)

            // Filter by state
            var stateOk = states.size == 0
            if (!stateOk) {
                const originState = ctx.airportsMap.get(origin_airport).state
                const destinationState = ctx.airportsMap.get(
                    destination_airport
                ).state
                stateOk =
                    states.has(originState) && states.has(destinationState)
            }

            return dateOk && stateOk && airlineOk && typeOk
        })
        .forEach(({ origin_airport, destination_airport, count }) => {
            const key = origin_airport + destination_airport
            routesMap.set(
                key,
                (routesMap.has(key) ? routesMap.get(key) : 0) + parseInt(count)
            )
        })

    return Array.from(routesMap.entries()).map(([key, value]) => ({
        origin_airport: key.substring(0, 4),
        destination_airport: key.substring(4, 8),
        count: value,
    }))
}

const updateMap = () => {
    switch (ctx.currentDropdownState){
        case "routes":
            drawTrajectories(filteredTrajectories())
            break;
        case "airports":
            drawAirportDensity(filteredTrajectories())
            break;
        case "hybrid":
            drawAirportDensity(filteredTrajectories())
            drawTrajectories(filteredTrajectories())
            break;
        default:
            throw "Tried to update map with invalid mode"
    }
}
