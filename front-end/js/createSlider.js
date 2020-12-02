const makeSlider = () => {
    const HEIGHT = 100
    const AXIS_WIDTH = 49
    const AXIS_HEIGHT = 36

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
        mark: 'area',
        selection: { brush: { type: 'interval', encodings: ['x'] } },
        encoding: {
            x: {
                field: 'date',
                type: 'temporal',
                title: null,
                axis: { grid: false },
            },
            y: {
                field: 'count',
                type: 'quantitative',
                title: 'Count',
                axis: { tickCount: 4, format: '~s' },
            },
            color: { value: 'rgb(71, 69, 67)' },
        },
    }

    // Create element
    sliderG = d3
        .select('#main')
        .append('g')
        .attr('id', 'slider')
    var vlOpts = { autosize: { type: 'fit', contains: 'padding' }, actions: false }
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
            end: endDate
        }

        updateMap(startDate, endDate)
    }, 300)
    view.addSignalListener('brush_date', (_, item) => {
        debounceInterval(item)
    })
}
