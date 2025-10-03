import '../styles/globals.css'
import '../styles/modern-cursor.css'
import ModernCursor from '../components/ModernCursor/ModernCursor'

export default function App({ Component, pageProps }) {
  return (
    <>
      <ModernCursor />
      <Component {...pageProps} />
    </>
  )
}