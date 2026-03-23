import React, { useEffect, useMemo, useState } from "react"

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"

import "leaflet/dist/leaflet.css"

import RAW_COMMUNITY_AREAS from "../../../data/raw/community-areas.geojson"

function YearSelect({ filterVal, setFilterVal }) {
  const startYear = 2026
  const years = [...Array(11).keys()].map((increment) => startYear - increment)

  return (
    <>
      <label htmlFor="yearSelect" className="fs-3">
        Filter by year:{" "}
      </label>
      <select
        id="yearSelect"
        className="form-select form-select-lg mb-3"
        value={filterVal}
        onChange={(e) => setFilterVal(Number(e.target.value))}
      >
        {years.map((year) => (
          <option value={year} key={year}>
            {year}
          </option>
        ))}
      </select>
    </>
  )
}

export default function RestaurantPermitMap() {
  const communityAreaColors = ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"]

  const [currentYearData, setCurrentYearData] = useState([])
  const [year, setYear] = useState(2026)

  const yearlyDataEndpoint = `/map-data/?year=${year}`

  useEffect(() => {
    fetch(yearlyDataEndpoint)
      .then((res) => res.json())
      .then((data) => {
        setCurrentYearData(data)
        console.log(data)
      })
      .catch((err) => {
        console.error("Failed to fetch map data:", err)
        setCurrentYearData([])
      })
  }, [yearlyDataEndpoint])

  const totalPermits = useMemo(() => {
    return currentYearData.reduce((sum, area) => sum + area.num_permits, 0)
  }, [currentYearData])

  const maxNumPermits = useMemo(() => {
    if (!currentYearData.length) return 0
    return Math.max(...currentYearData.map((area) => area.num_permits))
  }, [currentYearData])

  const geoJsonData = useMemo(() => {
    return {
      ...RAW_COMMUNITY_AREAS,
      features: RAW_COMMUNITY_AREAS.features.map((feature) => {
        const areaId = Number(feature.properties.area_num_1)
        const matchedArea = currentYearData.find(
          (area) => Number(area.area_id) === areaId
        )

        return {
          ...feature,
          properties: {
            ...feature.properties,
            area_id: areaId,
            name: matchedArea?.name || feature.properties.community,
            num_permits: matchedArea?.num_permits || 0,
          },
        }
      }),
    }
  }, [currentYearData])

  function getColor(numPermits) {
    if (totalPermits === 0 || numPermits === 0) {
      return communityAreaColors[0]
    }

    const percentageOfPermits = numPermits / totalPermits

    if (percentageOfPermits >= 0.1) return communityAreaColors[3]
    if (percentageOfPermits >= 0.05) return communityAreaColors[2]
    if (percentageOfPermits > 0) return communityAreaColors[1]

    return communityAreaColors[0]
  }

  function setAreaInteraction(feature, layer) {
    const { name, num_permits } = feature.properties

    layer.setStyle({
      fillColor: getColor(num_permits),
      fillOpacity: 0.7,
      color: "#666",
      weight: 1,
      opacity: 1,
    })

    layer.bindPopup(`
      <strong>${name}</strong><br />
      Permits in ${year}: ${num_permits}
    `)

    layer.on({
      mouseover: () => {
        layer.setStyle({
          weight: 2,
          color: "#222",
          fillOpacity: 0.9,
        })
        layer.openPopup()
      },
      mouseout: () => {
        layer.setStyle({
          fillColor: getColor(num_permits),
          fillOpacity: 0.7,
          color: "#666",
          weight: 1,
          opacity: 1,
        })
        layer.closePopup()
      },
      click: () => {
        layer.openPopup()
      },
    })
  }

  return (
    <>
      <YearSelect filterVal={year} setFilterVal={setYear} />

      <p className="fs-4">
        Restaurant permits issued this year: {totalPermits}
      </p>

      <p className="fs-4">
        Maximum number of restaurant permits in a single area: {maxNumPermits}
      </p>

      <MapContainer
        id="restaurant-map"
        center={[41.88, -87.62]}
        zoom={10}
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
        />
        {currentYearData.length > 0 ? (
          <GeoJSON
            data={geoJsonData}
            onEachFeature={setAreaInteraction}
            key={year}
          />
        ) : null}
      </MapContainer>
    </>
  )
}