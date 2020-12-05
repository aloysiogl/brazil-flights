const makeTypesPlot = () => {
    const HEIGHT = 260 - 4
    const WIDTH = ctx.w / 2
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const BARS_COLOR = 'rgba(9, 255, 243, .75)'
    const LABEL_COLOR = 'lightgray'

    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        width: WIDTH,
        height: HEIGHT,
        autosize: {
            type: 'fit',
            contains: 'padding',
        },
        data: { name: 'data', values: getTypesData() },
        mark: {
            type: 'bar',
            cornerRadiusEnd: { expr: 1 },
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        selection: {
            highlight: { type: 'single', empty: 'none', on: 'mouseover' },
            select: { type: 'multi', toggle: 'true' },
        },
        encoding: {
            x: {
                field: 'name',
                type: 'nominal',
                title: null,
                sort: '-y',
                axis: {
                    labelAngle: 0,
                    labelColor: LABEL_COLOR,
                },
                scale: {
                    paddingInner: 0.6,
                    paddingOuter: 0.6,
                },
            },
            y: {
                field: 'count',
                type: 'quantitative',
                title: 'Nº of Flights',
                scale: { type: 'log' },
                axis: {
                    format: '~s',
                    titleColor: LABEL_COLOR,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            },
            color: { value: BARS_COLOR },
            fillOpacity: {
                condition: [
                    { selection: 'highlight', value: 1 },
                    { selection: 'select', value: 0.75 },
                ],
                value: 0.3,
            },
        },
    }

    // Create element
    sliderG = d3.select('#plots').append('g').attr('id', 'types')
    var vlOpts = { actions: false }
    vegaEmbed('#plots #types', vlSpec, vlOpts).then(({ _, view }) => {
        configureTypesSignalListener(view)

        ctx.updateTypes = () => {
            const newData = getTypesData()
            const newDataMap = new Map(newData.map(data => [data.type, data]))
            const curData = view.data('data')
            const curDataMap = new Map(curData.map(data => [data.type, data]))

            // Types that weren't showing before
            const insert = newData.filter(({ type }) => !curDataMap.has(type))

            // Types that won't show anymore
            const remove = curData.filter(({ type }) => {
                if (!newDataMap.has(type)) {
                    // Remove from filter
                    if (ctx.filter.types.has(type)) {
                        ctx.filter.types.delete(type)
                    }
                    return true
                }
                return false
            })

            // Fix vgsig indices to be used later
            insert.forEach(({ type }) => {
                ctx.typesVgSidCnt += 1
                ctx.typesVgSid.set(type, ctx.typesVgSidCnt)
            })

            // Modify types that are already in the plot
            const changeSet = vega.changeset().remove(remove).insert(insert)
            curData
                .filter(({ type }) => newDataMap.has(type))
                .forEach(cur => {
                    changeSet.modify(
                        cur,
                        'count',
                        newDataMap.get(cur.type).count
                    )
                })

            view.change('data', changeSet).run()
        }
    })
}

const configureTypesSignalListener = view => {
    view.addSignalListener('select_tuple', (_, item) => {
        if (item) {
            // The only way I found to get their respective airlines was building their vgsid when data changes
            const type = Array.from(ctx.typesVgSid.entries()).filter(
                ([_, vgsid]) => vgsid == item.values[0]
            )[0][0]
            if (ctx.filter.types.has(type)) {
                ctx.filter.types.delete(type)
            } else {
                ctx.filter.types.add(type)
            }
        }

        updateMap()
        ctx.updateSlider()
        ctx.updateAirlines()
    })
}

const getTypesData = () => {
    var routesCounts = filteredRoutes({ filterType: false })
    var typesData = new Map()
    routesCounts.forEach(({ type, count }) => {
        const cur = typesData.has(type) ? typesData.get(type) : 0
        typesData.set(type, cur + parseInt(count))
    })

    const names = {
        1: ['Domestic', 'mixed'],
        2: ['Domestic', 'freighter'],
        3: ['International', 'mixed'],
        4: ['International', 'freighter'],
        5: ['Not', 'informed'],
        6: ['Sub', 'regional'],
        7: ['Postal', 'network'],
        8: 'Regional',
        9: 'Special',
    }

    typesData = Array.from(typesData.entries()).map(([key, value]) => ({
        type: key,
        count: value,
        name: names[key],
    }))
    typesData.sort(({ count: count1 }, { count: count2 }) =>
        count1 < count2 ? 1 : -1
    )

    // Limit number of bars in graph
    typesData = typesData.slice(0, 6)

    // Build this to use on selection later
    if (!ctx.typesVgSidCnt) {
        ctx.typesVgSidCnt = 0
        ctx.typesVgSid = new Map(
            typesData.map(({ type }) => {
                ctx.typesVgSidCnt += 1
                return [type, ctx.typesVgSidCnt]
            })
        )
    }

    return typesData
}
