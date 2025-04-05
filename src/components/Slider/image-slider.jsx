"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Pause, Play, ZoomIn, ZoomOut, X } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import the lightbox and plugins
const Lightbox = dynamic(() => import("yet-another-react-lightbox"), { ssr: false })
const Zoom = dynamic(() => import("yet-another-react-lightbox/plugins/zoom").then(mod => mod.default), { ssr: false })
const Thumbnails = dynamic(() => import("yet-another-react-lightbox/plugins/thumbnails").then(mod => mod.default), { ssr: false })

// Import Lightbox styles
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import { getSanityImageUrl } from "@/sanity/lib/image";

export default function ImageSlider({
  images,
  alt,
  className = "w-full md:w-[401px] h-[291px]",
  autoSlideInterval = Math.random() * 2000 + 1500,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageUrls, setImageUrls] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const autoSlideTimerRef = useRef(null)

  useEffect(() => {
    async function loadImages() {
      setIsLoading(true)

      if (!images || images.length === 0) {
        setImageUrls([])
        setIsLoading(false)
        return
      }

      try {
        const urls = await Promise.all(
          images.map(async (image) => {
            try {
              return await getSanityImageUrl(image)
            } catch (error) {
              console.error("Error loading image:", error)
              return ""
            }
          })
        )

        setImageUrls(urls.filter((url) => url))
      } catch (error) {
        console.error("Error loading images:", error)
        setImageUrls([])
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [images])

  const startAutoSlide = useCallback(() => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current)
    }

    if (imageUrls.length <= 1 || lightboxOpen) return

    autoSlideTimerRef.current = setInterval(() => {
      if (!isPaused && !lightboxOpen) {
        setCurrentIndex((prevIndex) =>
          prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
        )
      }
    }, autoSlideInterval)

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current)
      }
    }
  }, [autoSlideInterval, imageUrls.length, isPaused, lightboxOpen])

  useEffect(() => {
    const cleanup = startAutoSlide()
    return cleanup
  }, [startAutoSlide, imageUrls])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    )
  }

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    setIsPaused(true)
  }

  const lightboxImages = imageUrls.map((url) => ({ src: url, alt }))

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center rounded-md`}>
        <div className="animate-pulse text-gray-500">Loading images...</div>
      </div>
    )
  }

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className={`${className} relative rounded-md overflow-hidden`}>
        <Image src="/placeholder.svg?height=291&width=401" alt="Image not available" fill className="object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white font-medium">
          Image not available
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`${className} relative rounded-md overflow-hidden group cursor-pointer shadow-md`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative w-full h-full" onClick={() => openLightbox(currentIndex)}>
          {imageUrls.map((url, index) => (
            <Image
              key={index}
              src={url}
              alt={`${alt} - Image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 401px"
              className={`
                object-cover transition-opacity duration-700 ease-in-out
                ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"}
                absolute top-0 left-0
              `}
            />
          ))}
        </div>

        {imageUrls.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <button
              className="absolute top-2 right-2 bg-black bg-opacity-30 hover:bg-opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
              onClick={(e) => {
                e.stopPropagation()
                setIsPaused(!isPaused)
              }}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {imageUrls.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all focus:outline-none ${
                    index === currentIndex ? "bg-white scale-125" : "bg-white bg-opacity-50"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          {currentIndex + 1} / {imageUrls.length}
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => {
            setLightboxOpen(false)
            setIsPaused(false)
          }}
          slides={lightboxImages}
          index={lightboxIndex}
          plugins={[Zoom, Thumbnails]}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 1.5,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            keyboardMoveDistance: 50,
            wheelZoomDistanceFactor: 100,
            pinchZoomDistanceFactor: 100,
          }}
          thumbnails={{
            position: "bottom",
            width: 120,
            height: 80,
            border: 1,
            borderRadius: 4,
            padding: 4,
            gap: 8,
          }}
          carousel={{
            finite: false,
            preload: 2,
            padding: { left: 16, right: 16 },
            spacing: 30,
          }}
          render={{
            iconZoomIn: () => <ZoomIn />,
            iconZoomOut: () => <ZoomOut />,
            iconClose: () => <X />,
          }}
        />
      )}
    </>
  )
}