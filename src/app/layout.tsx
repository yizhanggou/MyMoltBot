import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '名画变脸 - Mona Lisa Face Swap',
  description: '用摄像头脸替换蒙娜丽莎，进行合拍拍照',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}