const filteredRoutes = ({
    filterDate = true,
    filterState = true,
    filterAirline = true,
    filterType = true,
} = {}) => {
    const {
        startDate: start,
        endDate: end,
        states,
        airlines,
        types,
    } = ctx.filter
    filterDate = filterDate && (start || end)
    filterState = filterState && states.size > 0
    filterAirline = filterAirline && airlines.size > 0
    filterType = filterType && types.size > 0

    var routesCounts = [...ctx.routesCounts]
    if (filterDate || filterState || filterAirline || filterType) {
        routesCounts = routesCounts.filter(
            ({ date, origin_airport, destination_airport, airline, type }) => {
                // Filter by date
                const dateOk = !filterDate || (start < date && date < end)

                // Filter by airline
                const airlineOk = !filterAirline || airlines.has(airline)

                // Filter by type
                const typeOk = !filterType || types.has(type)

                // Filter by state
                var stateOk = !filterState
                if (!stateOk) {
                    const originState = ctx.airportsMap.get(origin_airport)
                        .state
                    const destinationState = ctx.airportsMap.get(
                        destination_airport
                    ).state
                    stateOk =
                        states.has(originState) && states.has(destinationState)
                }

                return dateOk && stateOk && airlineOk && typeOk
            }
        )
    }

    return routesCounts
}
