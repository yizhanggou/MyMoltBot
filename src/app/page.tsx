'use client'

import { useEffect, useRef, useCallback, useState } from "react"

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [drawStatus, setDrawStatus] = useState("等待加载...")
  const monaImgRef = useRef<HTMLImageElement | null>(null)
  const animationIdRef = useRef<number>(0)

  const FACE_X = 700 // 扩大clip区测试
  const FACE_Y = 300
  const FACE_WIDTH = 520
  const FACE_HEIGHT = 650
  const CANVAS_WIDTH = 1920
  const CANVAS_HEIGHT = 2861

  useEffect(() => {
    const img = new Image()
    img.src = "/mona-lisa.png?" + Date.now()
    img.onload = () => {
      console.log("✅ PNG 蒙娜丽莎加载成功:", img.naturalWidth, "x", img.naturalHeight)
      monaImgRef.current = img
      setImgLoaded(true)
      setDrawStatus("PNG背景加载完成 - 点击开启摄像头")
      testBackground()
    }
    img.onerror = () => setDrawStatus("PNG加载失败")
  }, [])

  const testBackground = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const img = monaImgRef.current
    if (ctx && img && canvas) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.strokeStyle = "#00FF00"
      ctx.lineWidth = 10
      ctx.strokeRect(FACE_X, FACE_Y, FACE_WIDTH, FACE_HEIGHT)
      setDrawStatus("背景+绿框就绪")
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      })
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.play()
        setIsCameraOn(true)
        setDrawStatus("摄像头开启 - 等待视频加载...")
        video.onloadeddata = () => {
          console.log("📹 视频加载:", video.videoWidth, "x", video.videoHeight)
          setDrawStatus("开始实时脸替换")
          drawLoop()
        }
      }
    } catch (err) {
      setDrawStatus("摄像头错误: " + (err as Error).message)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop())
      videoRef.current!.srcObject = null
      setIsCameraOn(false)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = 0
      }
      setDrawStatus("摄像头关闭")
    }
  }

  const drawLoop = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const video = videoRef.current!
    const monaImg = monaImgRef.current!

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.drawImage(monaImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.save()
    ctx.beginPath()
    ctx.rect(FACE_X, FACE_Y, FACE_WIDTH, FACE_HEIGHT)
    ctx.clip()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -FACE_WIDTH, 0, FACE_WIDTH, FACE_HEIGHT)
    ctx.restore()

    console.log("✅ 脸替换绘制完成")

    animationIdRef.current = requestAnimationFrame(drawLoop)
  }

  const saveImage = () => {
    const canvas = canvasRef.current!
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob!)
      const a = document.createElement("a")
      a.href = url
      a.download = "mona-lisa-swap.png"
      a.click()
      URL.revokeObjectURL(url)
    }, "image/png")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-amber-50 to-orange-100 gap-8">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🖼️ 名画变脸</h1>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-4 border-white/50 max-w-4xl w-full text-center">
        <p className="text-xl font-bold mb-8">状态: <span className="bg-green-100 px-4 py-2 rounded-full font-mono">{drawStatus}</span></p>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full max-w-3xl h-auto max-h-[70vh] object-contain rounded-3xl shadow-2xl border-8 border-purple-200 mx-auto block cursor-pointer" />
        <div className="flex flex-wrap gap-6 justify-center mt-12">
          {!isCameraOn ? (
            <button onClick={startCamera} className="px-12 py-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
              🎥 开启摄像头适配脸部
            </button>
          ) : (
            <>
              <button onClick={saveImage} className="px-12 py-6 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
                💾 保存合成图 PNG
              </button>
              <button onClick={stopCamera} className="px-12 py-6 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xl font-bold rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all">
                ❌ 关闭摄像头
              </button>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-8 opacity-80">F12查看Console日志 | 脸自动适配蒙娜丽莎头部透明区 | 高清PNG下载</p>
      </div>
    </main>
  )
}