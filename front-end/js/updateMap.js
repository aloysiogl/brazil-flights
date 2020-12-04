const filteredTrajectories = () => {
    const routesCounts = filteredRoutes()
    const routesMap = new Map()
    routesCounts.forEach(({ origin_airport, destination_airport, count }) => {
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
    const traj = filteredTrajectories()
    switch (ctx.currentDropdownState) {
        case "routes":
            drawTrajectories(traj)
            break;
        case "airports":
            drawAirportDensity(traj)
            break;
        case "hybrid":
            drawAirportDensity(traj)
            drawTrajectories(traj)
            break;
        default:
            throw "Tried to update map with invalid mode"
    }
}
