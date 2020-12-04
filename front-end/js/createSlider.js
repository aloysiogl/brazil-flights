const makeSlider = () => {
    const HEIGHT = 100
    const AXIS_WIDTH = 22
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
        configureSliderSignalListener(view)

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

const configureSliderSignalListener = view => {
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
    const routesCounts = filteredRoutes({ filterDate: false })
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
