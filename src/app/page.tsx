'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [drawStatus, setDrawStatus] = useState('未开始')
  const monaImgRef = useRef<HTMLImageElement | null>(null)

  const FACE_X = 720
  const FACE_Y = 320
  const FACE_WIDTH = 480
  const FACE_HEIGHT = 580
  const CANVAS_WIDTH = 1920
  const CANVAS_HEIGHT = 2861

  useEffect(() => {
    console.log('🖼️ 开始预加载 /mona-lisa.png')
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = '/mona-lisa.png?' + Date.now() // 防缓存
    img.onload = () => {
      console.log("✅ 图片加载成功!", img.naturalWidth, "x", img.naturalHeight)
      monaImgRef.current = img
      setImgLoaded(true)
      setDrawStatus("图片加载完成")
      // 立即测试绘制背景
      testDrawBackground()
    }
    img.onerror = (e) => {
      console.error("❌ 图片加载失败!", e)
      setDrawStatus("图片加载失败")
    }
  }, [])

  const testDrawBackground = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const img = monaImgRef.current
    if (ctx && img && canvas) {
      console.log("🎨 测试绘制背景")
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      setDrawStatus("背景绘制完成")
    }
  }

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsCameraOn(true)
        setDrawStatus("摄像头启动，等待视频就绪")
        setTimeout(drawLoop, 500) // 延迟启动绘制
      }
    } catch (err: any) {
      console.error("摄像头错误:", err)
      setDrawStatus("摄像头权限失败: " + err.message)
    }
  }, [])

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      ;(videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraOn(false)
      setDrawStatus("摄像头已关闭")
    }
  }

  const drawLoop = useCallback(() => {
    if (!isCameraOn || !imgLoaded) {
      console.log("跳过绘制: 摄像头=", isCameraOn, "图片=", imgLoaded)
      return
    }

    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const video = videoRef.current!
    const monaImg = monaImgRef.current!

    if (video.videoWidth === 0) {
      console.log("视频未就绪，跳过")
      requestAnimationFrame(drawLoop)
      return
    }

    console.log("绘制帧:", video.videoWidth, "x", video.videoHeight)

    // 1. 清空 + 背景
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.drawImage(monaImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // 2. 脸部 clip 区
    ctx.save()
    ctx.beginPath()
    ctx.rect(FACE_X, FACE_Y, FACE_WIDTH, FACE_HEIGHT)
    ctx.clip()

    // 3. 视频脸部 (镜像 + 自适应)
    ctx.scale(-1, 1)
    const videoRatio = video.videoHeight / video.videoWidth
    const faceRatio = FACE_HEIGHT / FACE_WIDTH
    let vW = FACE_WIDTH, vH = FACE_WIDTH * videoRatio, vX = 0, vY = (FACE_HEIGHT - vH) / 2
    if (videoRatio < faceRatio) {
      vH = FACE_HEIGHT
      vW = vH / videoRatio
      vY = 0
      vX = (FACE_WIDTH - vW) / 2
    }
    ctx.drawImage(video, -FACE_WIDTH + vX, vY, vW, vH)
    ctx.restore()

    requestAnimationFrame(drawLoop)
  }, [isCameraOn, imgLoaded])

  const capturePhoto = () => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `mona-lisa-swap-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-purple-100 gap-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">🖼️ 名画变脸调试版</h1>
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border max-w-4xl w-full">
        <div className="text-center mb-8">
          <p className="text-lg font-semibold text-gray-800 mb-2">状态: <span className="font-mono bg-blue-100 px-3 py-1 rounded-full">{drawStatus}</span></p>
          <p className="text-sm text-gray-600">F12 Console 查看详细日志</p>
        </div>
        <video ref={videoRef} className="w-64 h-48 rounded-xl shadow-lg mx-auto mb-4 hidden" muted playsInline />
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full max-w-2xl h-auto max-h-96 object-contain rounded-2xl shadow-2xl border-4 border-indigo-300 mx-auto block" />
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <button onClick={testDrawBackground} disabled={!imgLoaded} className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
            🖼️ 测试背景
          </button>
          {!isCameraOn ? (
            <button onClick={startCamera} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg">
              🎥 开启摄像头
            </button>
          ) : (
            <>
              <button onClick={capturePhoto} className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 shadow-lg">
                📸 下载 PNG
              </button>
              <button onClick={stopCamera} className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg">
                ❌ 关闭
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 max-w-md text-center">
        先点击 "测试背景" 确认蒙娜丽莎显示 → 开启摄像头 → 脸自动替换黑洞区
      </p>
    </main>
  )
}