import { useCallback, useEffect, useRef, useState } from 'react'
import { NUDGE } from '../data/alignment'
import '../App.css'

type Facing = 'side' | 'front' | 'back'

type Garment = {
  id: string
  name: string
  detail: string
  price: string
  img: string
  backImg: string
  sideImg: string
  colors: string[]
}

const GARMENTS: Garment[] = [
  { id: 'white-hoodie', name: 'Cloud Hoodie', detail: 'Ivory — heavyweight cotton', price: '€120', img: 'garments/white-hoodie.png', backImg: 'garments/white-hoodie-back.png', sideImg: 'garments/white-hoodie-side.png', colors: ['#f2f0ea', '#1a1a17', '#7a7566'] },
  { id: 'black-coat', name: 'Tailored Overcoat', detail: 'Noir — Italian wool', price: '€340', img: 'garments/black-coat.png', backImg: 'garments/black-coat-back.png', sideImg: 'garments/black-coat-side.png', colors: ['#1a1a17', '#4a4238', '#8b8778'] },
  { id: 'green-jacket', name: 'Field Jacket', detail: 'Forest — brushed canvas', price: '€210', img: 'garments/green-jacket.png', backImg: 'garments/green-jacket-back.png', sideImg: 'garments/green-jacket-side.png', colors: ['#2e4034', '#1a1a17', '#6b5b3e'] },
  { id: 'navy-puffer', name: 'Down Puffer', detail: 'Navy — recycled fill', price: '€260', img: 'garments/navy-puffer.png', backImg: 'garments/navy-puffer-back.png', sideImg: 'garments/navy-puffer-side.png', colors: ['#232c48', '#1a1a17', '#5c6b8a'] },
  { id: 'cream-sweater', name: 'Cable Knit', detail: 'Ecru — merino blend', price: '€145', img: 'garments/cream-sweater.png', backImg: 'garments/cream-sweater-back.png', sideImg: 'garments/cream-sweater-side.png', colors: ['#efe7d6', '#c9b99a', '#7a7566'] },
  { id: 'grey-hoodie', name: 'Zip Hoodie', detail: 'Charcoal — loopback fleece', price: '€130', img: 'garments/grey-hoodie.png', backImg: 'garments/grey-hoodie-back.png', sideImg: 'garments/grey-hoodie-side.png', colors: ['#3a3a38', '#1a1a17', '#8b8778'] },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const SPIN_MS = 1600

// container rotateY for each resting face (faces live at side=90°, front=0°, back=180°)
const FACING_ANGLE: Record<Facing, number> = { side: -90, front: 0, back: -180 }

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function Home() {
  const [active, setActive] = useState(0)
  const [facing, setFacing] = useState<Record<string, Facing>>({})
  const [spinId, setSpinId] = useState<string | null>(null)
  const [angle, setAngle] = useState(0)
  const rafRef = useRef<number>(0)

  // detail modal state
  const [detail, setDetail] = useState<number | null>(null)
  const [detailFace, setDetailFace] = useState<Facing>('front')
  const [size, setSize] = useState('M')
  const [colorIdx, setColorIdx] = useState(0)
  const [cart, setCart] = useState(0)
  const [added, setAdded] = useState(false)
  const [modalSpin, setModalSpin] = useState(false)
  const [modalAngle, setModalAngle] = useState(0)
  const modalRaf = useRef<number>(0)

  const facingOf = useCallback((id: string): Facing => facing[id] ?? 'side', [facing])

  const spin = useCallback(
    (id: string) => {
      cancelAnimationFrame(rafRef.current)
      const from = FACING_ANGLE[facingOf(id)]
      setSpinId(id)
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / SPIN_MS)
        setAngle(from + easeInOutCubic(t) * 360)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setTimeout(() => {
            setSpinId(null)
            setAngle(0)
          }, 120)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [facingOf],
  )

  const spinModal = useCallback((fromDeg: number) => {
    cancelAnimationFrame(modalRaf.current)
    setModalSpin(true)
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SPIN_MS)
      setModalAngle(fromDeg + easeInOutCubic(t) * 360)
      if (t < 1) {
        modalRaf.current = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          setModalSpin(false)
          setModalAngle(0)
        }, 120)
      }
    }
    modalRaf.current = requestAnimationFrame(tick)
  }, [])

  const openDetail = useCallback(
    (i: number) => {
      setActive(i)
      setDetail(i)
      setDetailFace('front')
      setSize('M')
      setColorIdx(0)
      setAdded(false)
      // little 360 on open, like the rotation video in the reel
      setTimeout(() => spinModal(FACING_ANGLE.front), 250)
    },
    [spinModal],
  )

  // intro spin on the first garment (+ ?item=N opens that product, handy for deep links)
  useEffect(() => {
    const t = setTimeout(() => spin(GARMENTS[0].id), 700)
    const q = new URLSearchParams(window.location.search).get('item')
    if (q !== null) {
      const i = Math.min(GARMENTS.length - 1, Math.max(0, parseInt(q, 10) || 0))
      openDetail(i)
    }
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape closes the modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetail(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const current = GARMENTS[active]
  const brightnessFor = (deg: number) => 1 - 0.28 * Math.abs(Math.sin((deg * Math.PI) / 180))
  const ny = (path: string) => ((NUDGE[path.split('/').pop() ?? ''] ?? 0) * 100).toFixed(2)

  const dg = detail !== null ? GARMENTS[detail] : null

  return (
    <div className="min-h-screen bg-[#f4f1e8] text-[#1a1a17] font-body overflow-hidden flex flex-col select-none">
      {/* Header */}
      <header className="grid grid-cols-3 items-center px-6 md:px-10 pt-6">
        <nav className="flex gap-6 text-[11px] tracking-[0.22em] uppercase text-[#6d6a5e]">
          <span className="cursor-pointer hover:text-[#1a1a17] transition-colors">Menu</span>
          <span className="cursor-pointer hover:text-[#1a1a17] transition-colors hidden md:inline">Lookbook</span>
        </nav>
        <div className="flex flex-col items-center gap-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
            <path d="M12 2C7 7 4 11 4 15a8 8 0 0016 0c0-4-3-8-8-13z" stroke="#1a1a17" strokeWidth="1.4" />
            <path d="M12 22V8" stroke="#1a1a17" strokeWidth="1.4" />
          </svg>
          <h1 className="font-display text-xl md:text-2xl tracking-[0.42em] uppercase pl-2">Atelier&nbsp;Noir</h1>
        </div>
        <nav className="flex justify-end gap-6 text-[11px] tracking-[0.22em] uppercase text-[#6d6a5e]">
          <span className="cursor-pointer hover:text-[#1a1a17] transition-colors hidden md:inline">Search</span>
          <span className="cursor-pointer hover:text-[#1a1a17] transition-colors">Cart ({cart})</span>
        </nav>
      </header>

      {/* Caption above rail */}
      <p className="text-center mt-10 text-[10px] tracking-[0.34em] uppercase text-[#8b8778]">
        New Season — Fall/Winter 26
      </p>

      {/* Single rail, all garments in one serial row */}
      <main className="flex-1 flex flex-col justify-center">
        <div className="rail-scroll overflow-x-auto">
          <div className="relative mx-auto w-max px-[3vw]">
            <div className="rail-line absolute left-[1.5vw] right-[1.5vw] h-[2px] bg-[#a8a292] rounded-full" />
            <div className="rail-cap absolute left-[1.5vw] w-[10px] h-[10px] rounded-full border-2 border-[#a8a292] bg-[#f4f1e8] -translate-x-1/2" />
            <div className="rail-cap absolute right-[1.5vw] w-[10px] h-[10px] rounded-full border-2 border-[#a8a292] bg-[#f4f1e8] translate-x-1/2" />

            <div className="flex items-start gap-[1vw]">
              {GARMENTS.map((g, i) => {
                const isSpinning = spinId === g.id
                const deg = isSpinning ? angle : 0
                const restDeg = FACING_ANGLE[facingOf(g.id)]
                return (
                  <div
                    key={g.id}
                    className="garment-w relative shrink-0"
                    onMouseLeave={() =>
                      setFacing((f) => (f[g.id] && f[g.id] !== 'side' ? { ...f, [g.id]: 'side' } : f))
                    }
                    onClick={() => openDetail(i)}
                  >
                    <div
                      className="sway"
                      style={{ animationDelay: `${i * 0.45}s`, animationDuration: `${3.4 + (i % 3) * 0.5}s` }}
                    >
                      <div className="persp">
                        <div
                          className="flip-inner"
                          style={
                            isSpinning
                              ? { transform: `rotateY(${deg}deg)`, transition: 'none' }
                              : { transform: `rotateY(${restDeg}deg)` }
                          }
                        >
                          <img
                            src={g.img}
                            alt={g.name}
                            draggable={false}
                            className="flip-face w-full h-auto"
                            style={{
                              transform: `translateY(${ny(g.img)}%)`,
                              filter: isSpinning ? `brightness(${brightnessFor(deg)})` : undefined,
                            }}
                          />
                          <img
                            src={g.sideImg}
                            alt={`${g.name} — side`}
                            draggable={false}
                            className="flip-face flip-side-face w-full h-auto"
                            style={{
                              transform: `rotateY(90deg) translateY(${ny(g.sideImg)}%)`,
                              filter: isSpinning ? `brightness(${brightnessFor(deg)})` : undefined,
                            }}
                          />
                          <img
                            src={g.backImg}
                            alt={`${g.name} — back`}
                            draggable={false}
                            className="flip-face flip-back-face w-full h-auto"
                            style={{
                              transform: `rotateY(180deg) translateY(${ny(g.backImg)}%)`,
                              filter: isSpinning ? `brightness(${brightnessFor(deg)})` : undefined,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* directional hover zones: left half → back view, right half → front view */}
                    <div
                      className="absolute inset-y-0 left-0 w-1/2 z-10"
                      onMouseEnter={() => {
                        setActive(i)
                        setFacing((f) => ({ ...f, [g.id]: 'back' }))
                      }}
                    />
                    <div
                      className="absolute inset-y-0 right-0 w-1/2 z-10"
                      onMouseEnter={() => {
                        setActive(i)
                        setFacing((f) => ({ ...f, [g.id]: 'front' }))
                      }}
                    />

                    {/* floor shadow */}
                    <div className="mx-auto mt-[-12px] h-[9px] w-[52%] rounded-[50%] bg-[#1a1a17]/10 blur-[6px]" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-[10px] tracking-[0.3em] uppercase text-[#a39e8d]">
          ← hover left for back · hover right for front · click for details →
        </p>
      </main>

      {/* Product info */}
      <footer className="pb-8 flex flex-col items-center gap-2">
        <div key={current.id} className="fade-in flex flex-col items-center">
          <p className="font-display text-lg md:text-xl tracking-[0.18em] uppercase">{current.name}</p>
          <p className="text-[11px] tracking-[0.24em] uppercase text-[#8b8778] mt-1">{current.detail}</p>
          <p className="text-sm mt-2 tracking-[0.14em]">{current.price}</p>
        </div>
        <div className="flex items-center gap-3 mt-3">
          {GARMENTS.map((g, i) => (
            <button
              key={g.id}
              aria-label={g.name}
              onClick={(e) => {
                e.stopPropagation()
                setActive(i)
                spin(g.id)
              }}
              className={`h-[5px] rounded-full transition-all ${
                active === i ? 'w-7 bg-[#1a1a17]' : 'w-[5px] bg-[#c9c4b2] hover:bg-[#8b8778]'
              }`}
            />
          ))}
        </div>
      </footer>

      {/* ── Product detail modal ── */}
      {dg && (
        <div
          className="fixed inset-0 z-50 bg-[#1a1a17]/35 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="modal-in relative bg-[#f4f1e8] w-full max-w-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 max-h-[88dvh] overflow-y-auto">
            {/* rotating garment */}
            <div className="flex items-center justify-center py-4 md:py-8 bg-[#edeae0]">
              <div className="persp w-[150px] md:w-[220px]">
                <div
                  className="flip-inner"
                  style={
                    modalSpin
                      ? { transform: `rotateY(${modalAngle}deg)`, transition: 'none' }
                      : { transform: `rotateY(${FACING_ANGLE[detailFace]}deg)` }
                  }
                >
                  <img src={dg.img} alt={dg.name} draggable={false} className="flip-face w-full h-auto" />
                  <img src={dg.sideImg} alt="" draggable={false} className="flip-face flip-side-face w-full h-auto" style={{ transform: 'rotateY(90deg)' }} />
                  <img src={dg.backImg} alt="" draggable={false} className="flip-face flip-back-face w-full h-auto" style={{ transform: 'rotateY(180deg)' }} />
                </div>
              </div>
            </div>

            {/* info */}
            <div className="p-5 md:p-8 flex flex-col justify-center gap-4 md:gap-5">
              <div>
                <h2 className="font-display text-2xl tracking-[0.14em] uppercase">{dg.name}</h2>
                <p className="text-[11px] tracking-[0.24em] uppercase text-[#8b8778] mt-1">{dg.detail}</p>
                <p className="text-lg mt-3 tracking-[0.1em]">{dg.price}</p>
              </div>

              {/* face switcher */}
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#8b8778] mb-2">View</p>
                <div className="flex gap-2">
                  {(['front', 'side', 'back'] as Facing[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDetailFace(f)}
                      className={`px-4 py-1.5 text-[10px] tracking-[0.24em] uppercase border transition-all ${
                        detailFace === f
                          ? 'border-[#1a1a17] bg-[#1a1a17] text-[#f4f1e8]'
                          : 'border-[#c9c4b2] text-[#6d6a5e] hover:border-[#1a1a17]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  <button
                    onClick={() => spinModal(FACING_ANGLE[detailFace])}
                    className="px-4 py-1.5 text-[10px] tracking-[0.24em] uppercase border border-[#c9c4b2] text-[#6d6a5e] hover:border-[#1a1a17] transition-all"
                  >
                    360°
                  </button>
                </div>
              </div>

              {/* colors */}
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#8b8778] mb-2">Colour</p>
                <div className="flex gap-3">
                  {dg.colors.map((c, ci) => (
                    <button
                      key={c}
                      aria-label={`colour ${ci + 1}`}
                      onClick={() => setColorIdx(ci)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        colorIdx === ci ? 'border-[#1a1a17] scale-110' : 'border-[#c9c4b2]'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* sizes */}
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#8b8778] mb-2">Size</p>
                <div className="flex gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`w-10 h-10 text-[11px] tracking-[0.14em] border transition-all ${
                        size === s
                          ? 'border-[#1a1a17] bg-[#1a1a17] text-[#f4f1e8]'
                          : 'border-[#c9c4b2] text-[#6d6a5e] hover:border-[#1a1a17]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setCart((c) => c + 1)
                  setAdded(true)
                  setTimeout(() => setAdded(false), 1600)
                }}
                className={`mt-2 py-3.5 text-[11px] tracking-[0.32em] uppercase transition-all ${
                  added ? 'bg-[#3d5a3a] text-[#f4f1e8]' : 'bg-[#1a1a17] text-[#f4f1e8] hover:bg-[#33332c]'
                }`}
              >
                {added ? 'Added to cart ✓' : 'Add to cart'}
              </button>
            </div>
            </div>

            <button
              onClick={() => setDetail(null)}
              aria-label="Close"
              style={{ transform: 'translateZ(0)' }}
              className="absolute top-2 right-2 z-30 w-9 h-9 flex items-center justify-center bg-[#f4f1e8] border border-[#c9c4b2] text-sm text-[#6d6a5e] hover:text-[#1a1a17] hover:border-[#1a1a17] transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
