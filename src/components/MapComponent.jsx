"use client"

import { useEffect, useRef } from "react"

export default function MapComponent({ properties, selectedProperty, setSelectedProperty }) {
  const mapRef = useRef(null)
  const markersRef = useRef({})

  useEffect(() => {
    async function initializeMap() {
      if (typeof window !== "undefined") {
        const L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")
    
        if (!mapRef.current) {
          delete L.Icon.Default.prototype._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
          })
    
          mapRef.current = L.map("map")
    
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapRef.current)
    
          const bounds = L.latLngBounds([])
    
          properties.forEach((property) => {
            const marker = L.marker([property.lat, property.lng])
              .addTo(mapRef.current)
              .bindPopup(`<div class="text-center font-medium">${property.address}</div>`)
    
            marker.on("click", () => {
              setSelectedProperty(property.id)
            })
    
            markersRef.current[property.id] = marker
            bounds.extend([property.lat, property.lng])
          })
    
          // Fit the map to show all markers
          mapRef.current.fitBounds(bounds, { padding: [30, 30] })
        }
    
        // If a property is selected, zoom to it
        if (selectedProperty && markersRef.current[selectedProperty]) {
          markersRef.current[selectedProperty].openPopup()
          const selectedProp = properties.find((p) => p.id === selectedProperty)
          if (selectedProp && mapRef.current) {
            mapRef.current.setView([selectedProp.lat, selectedProp.lng], 14)
          }
        }
      }
    }
    

    initializeMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = {}
      }
    }
  }, [properties, selectedProperty, setSelectedProperty])

  return <div id="map" className="h-full w-full"></div>
}
