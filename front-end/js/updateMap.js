const drawTrajectories = (airportsPairListWithCounts) => {

}

const filterTrajectoriesByDate = (start, end) => {
    return ctx.routesCounts.filter(({ date }) => start < date && date < end)
}

const updateMap = (start, end) => {
    drawTrajectories(filterTrajectoriesByDate(start, end))
}
