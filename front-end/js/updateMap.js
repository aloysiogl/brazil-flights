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
