import React, { Component } from "react"
import { VegaLite } from "react-vega"

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      data: {
        values: [
          { a: "A", b: 1 },
          { a: "B", b: 2 },
        ],
      },
      spec: {
        mark: "bar",
        encoding: {
          x: { field: "a", type: "ordinal" },
          y: { field: "b", type: "quantitative" },
        },
        data: { name: "values" },
      },
    }
  }

  render() {
    return <VegaLite spec={this.state.spec} data={this.state.data} />
  }
}

export default App
