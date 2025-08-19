"use client"

import { useEffect, useRef } from "react"

export function ThreeJSBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let scene: any, camera: any, renderer: any, geometry: any, material: any, mesh: any
    let animationId: number

    const init = async () => {
      // Dynamic import for Three.js to avoid SSR issues
      const THREE = await import("three")

      if (!mountRef.current) return

      // Scene setup
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0)
      mountRef.current.appendChild(renderer.domElement)

      // Create floating geometric shapes
      const shapes = []
      for (let i = 0; i < 50; i++) {
        const geometries = [
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.SphereGeometry(0.3, 8, 6),
          new THREE.ConeGeometry(0.3, 0.8, 6),
          new THREE.OctahedronGeometry(0.4),
        ]

        const colors = [0x8b5cf6, 0x3b82f6, 0x06b6d4, 0x10b981, 0xf59e0b]

        geometry = geometries[Math.floor(Math.random() * geometries.length)]
        material = new THREE.MeshBasicMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true,
          opacity: 0.3,
          wireframe: Math.random() > 0.5,
        })

        mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = (Math.random() - 0.5) * 20
        mesh.position.y = (Math.random() - 0.5) * 20
        mesh.position.z = (Math.random() - 0.5) * 20
        mesh.rotation.x = Math.random() * Math.PI
        mesh.rotation.y = Math.random() * Math.PI
        mesh.userData = {
          rotationSpeed: {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02,
          },
          floatSpeed: Math.random() * 0.01 + 0.005,
          floatOffset: Math.random() * Math.PI * 2,
        }

        scene.add(mesh)
        shapes.push(mesh)
      }

      camera.position.z = 10

      // Animation loop
      const animate = () => {
        animationId = requestAnimationFrame(animate)

        shapes.forEach((shape, index) => {
          // Rotation
          shape.rotation.x += shape.userData.rotationSpeed.x
          shape.rotation.y += shape.userData.rotationSpeed.y
          shape.rotation.z += shape.userData.rotationSpeed.z

          // Floating motion
          shape.position.y += Math.sin(Date.now() * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.01
        })

        // Camera movement
        camera.position.x = Math.sin(Date.now() * 0.0005) * 2
        camera.position.y = Math.cos(Date.now() * 0.0003) * 1

        renderer.render(scene, camera)
      }

      animate()
    }

    init()

    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none z-0" />
}
