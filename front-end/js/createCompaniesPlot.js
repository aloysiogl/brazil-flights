const makeCompaniesPlot = () => {
    const HEIGHT = 230
    const WIDTH = ctx.w / 2 - 40
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const BARS_COLOR = 'rgba(9, 255, 243, .75)'
    const LABEL_COLOR = 'lightgray'

    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        width: WIDTH,
        height: HEIGHT,
        data: { name: 'data', values: getAirlinesData() },
        mark: {
            type: 'bar',
            cornerRadiusEnd: { expr: 1 },
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        encoding: {
            y: {
                field: 'airline',
                type: 'nominal',
                title: null,
                axis: {
                    labelAngle: 0,
                    labelColor: LABEL_COLOR,
                },
                scale: {
                    paddingInner: 0.8,
                    paddingOuter: 0.8,
                },
                sort: '-x',
            },
            x: {
                field: 'count',
                type: 'quantitative',
                title: 'Nº of Flights',
                axis: {
                    format: '~s',
                    titleColor: LABEL_COLOR,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            },
            tooltip: { field: 'name', type: 'nominal' },
            color: { value: BARS_COLOR },
        },
    }

    // Create element
    sliderG = d3.select('#plots').append('g').attr('id', 'companies')
    var vlOpts = { actions: false }
    vegaEmbed('#plots #companies', vlSpec, vlOpts).then(({ _, view }) => {
        ctx.updateAirlines = () => {
            const airlinesData = getAirlinesData()

            const changeSet = vega
                .changeset()
                .remove(() => true)
                .insert(airlinesData)
            view.change('data', changeSet).run()
        }
    })
}

const getAirlinesData = () => {
    const { startDate: start, endDate: end, states } = ctx.filter

    const routesCounts = ctx.airlinesCounts.filter(
        ({ origin_airport, destination_airport, date }) => {
            var stateOk = states.size == 0
            if (!stateOk) {
                const originState = ctx.airportsMap.get(origin_airport).state
                const destinationState = ctx.airportsMap.get(
                    destination_airport
                ).state
                stateOk =
                    states.has(originState) && states.has(destinationState)
            }

            const dateOk = !start || !end || start < date && date < end

            return stateOk && dateOk
        }
    )

    var airlinesData = new Map()
    routesCounts.forEach(({ airline, count }) => {
        const cur = airlinesData.has(airline) ? airlinesData.get(airline) : 0
        airlinesData.set(airline, cur + parseInt(count))
    })
    airlinesData = Array.from(airlinesData.entries()).map(([key, value]) => ({
        airline: key,
        count: value,
        name: ctx.airlinesMap.get(key).name,
    }))

    return airlinesData
}
