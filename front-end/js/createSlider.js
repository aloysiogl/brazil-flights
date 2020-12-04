const makeSlider = () => {
    const HEIGHT = 100
    const AXIS_WIDTH = 10
    const AXIS_HEIGHT = 36
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const LINE_COLOR = 'rgba(9, 255, 243, .75)'
    const LABEL_COLOR = 'lightgray'

    // Vega-lite spec for the slider graph
    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: { name: 'data', values: getSliderData() },
        width: ctx.w - AXIS_WIDTH,
        height: HEIGHT - AXIS_HEIGHT,
        mark: 'line',
        selection: {
            brush: { type: 'interval', bind: 'scales', encodings: ['x'] },
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        encoding: {
            x: {
                field: 'date',
                type: 'temporal',
                title: null,
                axis: {
                    grid: false,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            },
            y: {
                field: 'count',
                type: 'quantitative',
                title: null,
                axis: {
                    tickCount: 4,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    labels: false,
                    ticks: false,
                },
            },
            color: { value: LINE_COLOR },
        },
    }

    // Create element
    sliderG = d3.select('#interactiveMap').append('g').attr('id', 'slider')
    var vlOpts = { actions: false }
    vegaEmbed('#slider', vlSpec, vlOpts).then(({ _, view }) => {
        configureEventListener(view)

        ctx.updateSlider = () => {
            const sliderData = getSliderData()

            const changeSet = vega
                .changeset()
                .remove(() => true)
                .insert(sliderData)
            view.change('data', changeSet).run()
        }
    })
}

const configureEventListener = view => {
    // Listen to changes in interval, with a 300 ms debounce
    const debounceInterval = this._.debounce(item => {
        ctx.filter.startDate = item
            ? new Date(item[0]).toISOString().substring(0, 10)
            : null
        ctx.filter.endDate = item
            ? new Date(item[1]).toISOString().substring(0, 10)
            : null

        updateMap()
        ctx.updateAirlines()
        ctx.updateTypes()
    }, 300)
    view.addSignalListener('brush_date', (_, item) => {
        debounceInterval(item)
    })
}

const getSliderData = () => {
    const filterAirlines = ctx.filter.airlines.size > 0
    const filterStates = ctx.filter.states.size > 0

    var routesCounts = filterAirlines ? ctx.airlinesCounts : ctx.routesCounts
    if (filterAirlines || filterStates) {
        routesCounts = routesCounts.filter(
            ({ origin_airport, destination_airport, airline }) => {
                var stateOk = !filterStates
                if (!stateOk) {
                    const originState = ctx.airportsMap.get(origin_airport)
                        .state
                    const destinationState = ctx.airportsMap.get(
                        destination_airport
                    ).state
                    stateOk =
                        ctx.filter.states.has(originState) &&
                        ctx.filter.states.has(destinationState)
                }

                const airlineOk =
                    !filterAirlines || ctx.filter.airlines.has(airline)

                return stateOk && airlineOk
            }
        )
    }

    var sliderData = new Map()
    routesCounts.forEach(route => {
        const cur = sliderData.has(route.date) ? sliderData.get(route.date) : 0
        sliderData.set(route.date, cur + parseInt(route.count))
    })
    sliderData = Array.from(sliderData.entries()).map(([key, value]) => ({
        date: key,
        count: value,
    }))

    return sliderData
}
