import React, { Component } from "react"
import { VegaLite } from "react-vega"

import values from "./data/world-100m.json"

class Map extends Component {
  constructor(props) {
    super(props)

    this.state = {
      spec: {
        width: 1080,
        height: 720,
        data: [
          {
            name: "world",
            format: {
              type: "topojson",
              feature: "countries",
            },
            values,
          },
          {
            name: "graticule",
          },
        ],
        signals: [
          { name: "tx", update: "width / 2" },
          { name: "ty", update: "height / 2" },
          {
            name: "scale",
            value: 150,
            on: [
              {
                events: { type: "wheel", consume: true },
                update:
                  "clamp(scale * pow(1.0005, -event.deltaY * pow(16, event.deltaMode)), 150, 3000)",
              },
            ],
          },
          {
            name: "angles",
            value: [0, 0],
            on: [
              {
                events: "mousedown",
                update: "[rotateX, centerY]",
              },
            ],
          },
          {
            name: "cloned",
            value: null,
            on: [
              {
                events: "mousedown",
                update: "copy('projection')",
              },
            ],
          },
          {
            name: "start",
            value: null,
            on: [
              {
                events: "mousedown",
                update: "invert(cloned, xy())",
              },
            ],
          },
          {
            name: "drag",
            value: null,
            on: [
              {
                events: "[mousedown, window:mouseup] > window:mousemove",
                update: "invert(cloned, xy())",
              },
            ],
          },
          {
            name: "delta",
            value: null,
            on: [
              {
                events: { signal: "drag" },
                update: "[drag[0] - start[0], start[1] - drag[1]]",
              },
            ],
          },
          {
            name: "rotateX",
            value: 0,
            on: [
              {
                events: { signal: "delta" },
                update: "angles[0] + delta[0]",
              },
            ],
          },
          {
            name: "centerY",
            value: 0,
            on: [
              {
                events: { signal: "delta" },
                update: "clamp(angles[1] + delta[1], -60, 60)",
              },
            ],
          },
        ],

        projections: [
          {
            name: "projection",
            type: "orthographic",
            scale: { signal: "scale" },
            rotate: [{ signal: "rotateX" }, 0, 0],
            center: [0, { signal: "centerY" }],
            translate: [{ signal: "tx" }, { signal: "ty" }],
          },
        ],

        marks: [
          {
            type: "shape",
            from: { data: "world" },
            encode: {
              enter: {
                strokeWidth: { value: 0.5 },
                stroke: { value: "#bbb" },
                fill: { value: "#121212" },
              },
            },
            transform: [{ type: "geoshape", projection: "projection" }],
          },
        ],
      },
    }
  }

  render() {
    return (
      <div className="flex justify-center bg-black-90">
        <VegaLite spec={this.state.spec} />
      </div>
    )
  }
}

export default Map
