'use client'

import { useEffect, useRef, useState } from "react"
import html2canvas from "html2canvas"

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [status, setStatus] = useState("加载中...")

  // 蒙娜丽莎头透明区位置 (基于1920x2861图片比例调整)
  const VIDEO_TOP = "18%"  // 头部Y偏移
  const VIDEO_LEFT = "32%" // 头部X偏移
  const VIDEO_WIDTH = "36%" // 头宽比例
  const VIDEO_HEIGHT = "32%" // 头高比例

  useEffect(() => {
    setStatus("准备就绪，点击开启摄像头")
  }, [])

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
        setStatus("摄像头开启，脸已适配蒙娜丽莎头部，点击保存")
      }
    } catch (err) {
      setStatus("摄像头权限错误: " + (err as Error).message)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop())
      videoRef.current!.srcObject = null
      setIsCameraOn(false)
      setStatus("摄像头关闭")
    }
  }

  const saveImage = async () => {
    const container = containerRef.current
    if (container && isCameraOn) {
      try {
        setStatus("生成合成图中...")
        const canvas = await html2canvas(container, {
          backgroundColor: null,
          scale: 2, // 高清2x
          useCORS: true,
          allowTaint: true
        })
        const link = document.createElement("a")
        link.download = "mona-lisa-swap.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
        setStatus("合成图已下载！")
      } catch (err) {
        setStatus("保存失败: " + (err as Error).message)
      }
    }
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem', 
      background: 'linear-gradient(to br, #fef3c7, #fed7aa)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '3.5rem', 
        fontWeight: 'bold', 
        background: 'linear-gradient(to r, #9333ea, #ec4899)', 
        WebkitBackgroundClip: 'text', 
        backgroundClip: 'text', 
        color: 'transparent',
        marginBottom: '2rem'
      }}>
        🖼️ 名画变脸
      </h1>
      <div ref={containerRef} style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '900px', 
        height: 'auto', 
        aspectRatio: '1920/2861',
        background: 'rgba(255,255,255,0.9)', 
        backdropFilter: 'blur(20px)', 
        borderRadius: '2rem', 
        padding: '2rem', 
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', 
        border: '4px solid rgba(255,255,255,0.5)',
        overflow: 'hidden'
      }}>
        <img 
          src="/mona-lisa.png" 
          alt="蒙娜丽莎 (脸部透明)" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block',
            borderRadius: '1.5rem'
          }} 
        />
        {isCameraOn && (
          <video 
            ref={videoRef}
            style={{ 
              position: 'absolute',
              top: VIDEO_TOP,
              left: VIDEO_LEFT,
              width: VIDEO_WIDTH,
              height: VIDEO_HEIGHT,
              objectFit: 'cover',
              transform: 'scaleX(-1)', // 镜像自拍
              borderRadius: '50%',
              border: '3px solid #10b981',
              boxShadow: '0 10px 30px rgba(16,185,129,0.5)'
            }} 
            autoPlay 
            muted 
            playsInline
          />
        )}
      </div>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '1.5rem', 
        justifyContent: 'center', 
        marginTop: '3rem' 
      }}>
        {!isCameraOn ? (
          <button 
            onClick={startCamera} 
            style={{ 
              padding: '1.5rem 3rem', 
              background: 'linear-gradient(to r, #10b981, #059669)', 
              color: 'white', 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              borderRadius: '2rem', 
              boxShadow: '0 10px 25px rgba(16,185,129,0.4)', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            🎥 开启摄像头适配脸部
          </button>
        ) : (
          <>
            <button 
              onClick={saveImage} 
              style={{ 
                padding: '1.5rem 3rem', 
                background: 'linear-gradient(to r, #8b5cf6, #d946ef)', 
                color: 'white', 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                borderRadius: '2rem', 
                boxShadow: '0 10px 25px rgba(139,92,246,0.4)', 
                border: 'none', 
                cursor: 'pointer' 
              }}
            >
              💾 保存合成图 PNG
            </button>
            <button 
              onClick={stopCamera} 
              style={{ 
                padding: '1.5rem 3rem', 
                background: 'linear-gradient(to r, #ef4444, #dc2626)', 
                color: 'white', 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                borderRadius: '2rem', 
                boxShadow: '0 10px 25px rgba(239,68,68,0.4)', 
                border: 'none', 
                cursor: 'pointer' 
              }}
            >
              ❌ 关闭摄像头
            </button>
          </>
        )}
      </div>
      <p style={{ 
        fontSize: '0.875rem', 
        color: '#6b7280', 
        marginTop: '2rem', 
        opacity: 0.8,
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        摄像头开启后，脸自动适配蒙娜丽莎头部透明区 | 点击保存下载高清PNG合照
      </p>
    </main>
  )
}