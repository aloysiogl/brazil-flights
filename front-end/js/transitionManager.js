const transition = (state, checked) => {
    switch (state) {
        case 'routes':
            ctx.drawRoutes = checked
            break
        case 'airports':
            ctx.drawAirports = checked
            break
        case 'planes':
            ctx.drawPlanes = checked
            break
        default:
            throw 'Checkbox with wrong state'
    }

    // Updating map (in transition)
    updateMap()
}
