'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [error, setError] = useState('')
  const [publicUrl, setPublicUrl] = useState('')
  const monaImgRef = useRef<HTMLImageElement | null>(null)

  // 蒙娜丽莎脸部透明区域坐标 (基于1920x1300图像调整，根据实际抠图精确)
  const FACE_X = 680
  const FACE_Y = 220
  const FACE_WIDTH = 560
  const FACE_HEIGHT = 680
  const CANVAS_WIDTH = 1920
  const CANVAS_HEIGHT = 1300

  useEffect(() => {
    // 预加载蒙娜丽莎图像
    const img = new Image()
    img.src = '/mona-lisa.png'
    img.onload = () => {
      monaImgRef.current = img
    }
    return () => {
      if (monaImgRef.current) {
        monaImgRef.current = null
      }
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsCameraOn(true)
        setError('')
        drawLoop()
      }
    } catch (err: any) {
      setError('无法访问摄像头：' + (err.message || '请检查权限并重试'))
      console.error(err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraOn(false)
    }
  }, [])

  const drawLoop = useCallback(() => {
    if (!isCameraOn) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const video = videoRef.current
    const monaImg = monaImgRef.current

    if (ctx && video && video.videoWidth > 0 && monaImg && canvas) {
      // 清空画布
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // 绘制蒙娜丽莎背景 (缩放适应画布)
      ctx.drawImage(monaImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // 保存状态，裁剪脸部区域，绘制用户视频脸部 (翻转以镜像自拍)
      ctx.save()
      ctx.beginPath()
      ctx.rect(FACE_X, FACE_Y, FACE_WIDTH, FACE_HEIGHT)
      ctx.clip()

      // 视频翻转 (自拍镜像效果)
      ctx.scale(-1, 1)
      ctx.drawImage(video, -FACE_WIDTH, 0, FACE_WIDTH, FACE_HEIGHT)
      ctx.restore()
    }

    requestAnimationFrame(drawLoop)
  }, [isCameraOn])

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `mona-lisa-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }, [])

  useEffect(() => {
    // 检测公网 URL (Codespace)
    if (typeof window !== 'undefined') {
      setPublicUrl(window.location.origin + window.location.pathname)
    }
    return () => stopCamera()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 flex flex-col items-center justify-center p-4 md:p-8">
      <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6 md:mb-12 text-center drop-shadow-lg">
        🖼️ 名画变脸 - 蒙娜丽莎微笑合拍
      </h1>
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-12 border-4 border-white/50">
        <div className="flex flex-col items-center gap-6 md:gap-12">
          <video
            ref={videoRef}
            className="w-64 h-48 md:w-96 md:h-72 rounded-2xl shadow-xl hidden"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full max-w-2xl h-auto max-h-[70vh] md:max-h-[80vh] object-contain rounded-3xl shadow-2xl border-8 border-gradient-to-r from-indigo-300 to-purple-400 mx-auto block cursor-pointer hover:shadow-3xl transition-all duration-300"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 md:mt-12 flex-wrap">
          {!isCameraOn ? (
            <button
              onClick={startCamera}
              className="px-8 py-4 md:px-12 md:py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg md:text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
            >
              🎥 开启摄像头 (前置自拍)
            </button>
          ) : (
            <>
              <button
                onClick={capturePhoto}
                className="px-8 py-4 md:px-12 md:py-5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-lg md:text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
              >
                📸 保存合照 PNG
              </button>
              <button
                onClick={stopCamera}
                className="px-8 py-4 md:px-12 md:py-5 bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-lg md:text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
              >
                ❌ 停止摄像头
              </button>
            </>
          )}
        </div>
        {error && (
          <p className="text-red-600 bg-red-100 p-4 rounded-2xl mt-6 text-center font-semibold border border-red-300">
            {error}
          </p>
        )}
        {publicUrl && (
          <p className="text-xs md:text-sm text-gray-600 text-center mt-6 bg-blue-50 p-3 rounded-xl opacity-90">
            💡 手机访问：{publicUrl} | 调整脸部位置，对准蒙娜丽莎微笑区，完美合拍！
          </p>
        )}
        <p className="text-xs text-gray-500 mt-4 text-center opacity-80 leading-relaxed">
          支持移动端前置摄像头 | 实时镜像预览 | 高清 PNG 下载 | 无需登录
        </p>
      </div>
    </main>
  )
}