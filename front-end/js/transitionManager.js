const transition = (toState) => {
    // Clear dropdown selection
    document.activeElement.blur()

    // Updating state
    const fromState = ctx.currentDropdownState
    ctx.currentDropdownState = toState

    // Do out trasition
    switch (toState) {
        case "routes":
            drawAirportDensity([])
            break;
        case "airports":
            drawTrajectories([])
            break;
        case "hybrid":
            break;
        default:
            throw "Selection box tried to select a non existing mode"
    }

    // Updating map (in transition)
    updateMap()
}