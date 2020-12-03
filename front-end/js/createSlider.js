const makeSlider = () => {
    const HEIGHT = 100
    const AXIS_WIDTH = 14
    const AXIS_HEIGHT = 36
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const LINE_COLOR = 'rgba(9, 255, 243, .75)'
    const LABEL_COLOR = 'lightgray'

    // Create map with dates and counts
    var weeksCounts = new Map()
    ctx.routesCounts.forEach(({ date, count }) => {
        const cur = weeksCounts.has(date) ? weeksCounts.get(date) : 0
        weeksCounts.set(date, cur + parseInt(count))
    })
    weeksCounts = Array.from(weeksCounts.entries()).map(([key, value]) => ({
        date: key,
        count: value,
    }))

    // Vega-lite spec for the slider graph
    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        data: { values: weeksCounts },
        width: ctx.w - AXIS_WIDTH,
        height: HEIGHT - AXIS_HEIGHT,
        mark: 'line',
        selection: {
            brush: { type: 'interval', encodings: ['x'] },
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
    })
}

const configureEventListener = view => {
    // Listen to changes in interval, with a 300 ms debounce
    const debounceInterval = this._.debounce(item => {
        const startDate = item ? item[0].toISOString().substring(0, 10) : null
        const endDate = item ? item[1].toISOString().substring(0, 10) : null

        ctx.currentDateSelection = {
            start: startDate,
            end: endDate,
        }

        updateMap(startDate, endDate)
    }, 300)
    view.addSignalListener('brush_date', (_, item) => {
        debounceInterval(item)
    })
}
