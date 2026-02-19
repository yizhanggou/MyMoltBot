'use client'

import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [status, setStatus] = useState('加载中...')
  const monaImgRef = useRef<HTMLImageElement>(null)

  const FACE_X = 700
  const FACE_Y = 300
  const FACE_WIDTH = 520
  const FACE_HEIGHT = 650
  const CANVAS_WIDTH = 1920
  const CANVAS_HEIGHT = 2861

  useEffect(() => {
    const img = new Image()
    img.src = '/mona-lisa.png'
    img.onload = () => {
      monaImgRef.current = img
      setImgLoaded(true)
      setStatus('背景加载完成，点击开启摄像头')
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.play()
        setIsCameraOn(true)
        setStatus('摄像头开启，脸部适配中...')
        video.onloadeddata = drawLoop
      }
    } catch (err) {
      setStatus('摄像头权限错误: ' + err)
    }
  }

  const drawLoop = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const video = videoRef.current
    const monaImg = monaImgRef.current
    if (!ctx || !video || !monaImg || !canvas || !imgLoaded || !isCameraOn) return requestAnimationFrame(drawLoop)

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.drawImage(monaImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.save()
    ctx.beginPath()
    ctx.rect(FACE_X, FACE_Y, FACE_WIDTH, FACE_HEIGHT)
    ctx.clip()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -FACE_WIDTH, 0, FACE_WIDTH, FACE_HEIGHT)
    ctx.restore()

    requestAnimationFrame(drawLoop)
  }

  const saveImage = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement('a')
      link.download = 'mona-lisa-swap.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraOn(false)
      setStatus('摄像头关闭')
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'linear-gradient(to br, #fef3c7, #fed7aa)' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', background: 'linear-gradient(to r, #9333ea, #ec4899)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>🖼️ 名画变脸</h1>
      <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '2rem', padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '4px solid rgba(255,255,255,0.5)', maxWidth: '80vw', textAlign: 'center' }}>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>状态: <span style={{ background: '#dcfce7', padding: '0.5rem 1rem', borderRadius: '2rem', fontFamily: 'monospace' }}>{status}</span></p>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ width: '100%', maxWidth: '800px', height: 'auto', maxHeight: '70vh', objectFit: 'contain', borderRadius: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '8px solid #e9d5ff', cursor: 'pointer', display: 'block', margin: '0 auto' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', marginTop: '3rem' }}>
          {!isCameraOn ? (
            <button onClick={startCamera} style={{ padding: '1.5rem 3rem', background: 'linear-gradient(to r, #10b981, #059669)', color: 'white', fontSize: '1.25rem', fontWeight: 'bold', borderRadius: '2rem', boxShadow: '0 10px 25px rgba(16,185,129,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e: any) => e.target.style.transform = 'scale(1.05)'} onMouseOut={(e: any) => e.target.style.transform = 'scale(1)'}>
              🎥 开启摄像头适配脸部
            </button>
          ) : (
            <>
              <button onClick={saveImage} style={{ padding: '1.5rem 3rem', background: 'linear-gradient(to r, #8b5cf6, #d946ef)', color: 'white', fontSize: '1.25rem', fontWeight: 'bold', borderRadius: '2rem', boxShadow: '0 10px 25px rgba(139,92,246,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e: any) => e.target.style.transform = 'scale(1.05)'} onMouseOut={(e: any) => e.target.style.transform = 'scale(1)'}>
                💾 保存合成图 PNG
              </button>
              <button onClick={stopCamera} style={{ padding: '1.5rem 3rem', background: 'linear-gradient(to r, #ef4444, #dc2626)', color: 'white', fontSize: '1.25rem', fontWeight: 'bold', borderRadius: '2rem', boxShadow: '0 10px 25px rgba(239,68,68,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e: any) => e.target.style.transform = 'scale(1.05)'} onMouseOut={(e: any) => e.target.style.transform = 'scale(1)'}>
                ❌ 关闭摄像头
              </button>
            </>
          )}
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2rem', opacity: 0.8 }}>F12查看Console日志 | 脸自动适配蒙娜丽莎头部透明区 | 高清PNG下载</p>
      </div>
    </main>
  )
}