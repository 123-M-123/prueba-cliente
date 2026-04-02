'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type Producto = {
  id_producto: string
  titulo: string
  precio: number
  categoria: string
  etiqueta: string
  descripcion: string
  imagen: string
  stock: number
}

type ItemCarrito = Producto & { cantidad: number }

const C = {
  olive:      '#6B6B6B',
  oliveLight: '#8A8A8A',
  oliveDark:  '#4A4A4A',
  gold:       '#9E9E9E',
  goldLight:  '#BDBDBD',
  goldPale:   '#F5F5F5',
  purple:     '#757575',
  purpleLight:'#9E9E9E',
  purplePale: '#F0F0F0',
  tan:        '#8D8D8D',
  tanLight:   '#B0B0B0',
  tanPale:    '#F7F7F7',
  white:      '#FFFFFF',
  offWhite:   '#F2F2F2',
  dark:       '#2C2C2C',
  gray:       '#6B6B6B',
  grayLight:  '#E0E0E0',
} as const

const formatARS = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const IconCarrito = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)

export default function Home() {
  const [productos,       setProductos]       = useState<Producto[]>([])
  const [cargando,        setCargando]        = useState(true)
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null)
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [etiquetaActiva,  setEtiquetaActiva]  = useState('Todas')
  const [modal,           setModal]           = useState<Producto | null>(null)
  const [carrito,         setCarrito]         = useState<ItemCarrito[]>([])
  const [carritoOpen,     setCarritoOpen]     = useState(false)
  const [procesando,      setProcesando]      = useState(false)
  const [notif,           setNotif]           = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/products')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Producto[] = await res.json()
        setProductos(data)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setCargando(false)
      }
    }
    fetchData()
  }, [])

  const categorias = ['Todos', ...Array.from(new Set(productos.map(p => p.categoria)))]

  const etiquetas = [
    'Todas',
    ...Array.from(new Set(
      productos
        .filter(p => categoriaActiva === 'Todos' || p.categoria === categoriaActiva)
        .map(p => p.etiqueta)
    )).sort(),
  ]

  const productosFiltrados = productos.filter(p => {
    const okCat  = categoriaActiva === 'Todos' || p.categoria === categoriaActiva
    const okEtiq = etiquetaActiva  === 'Todas' || p.etiqueta  === etiquetaActiva
    return okCat && okEtiq
  })

  const totalCarrito    = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const cantidadCarrito = carrito.reduce((s, i) => s + i.cantidad, 0)

  const agregarAlCarrito = (p: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id_producto === p.id_producto)
      return existe
        ? prev.map(i => i.id_producto === p.id_producto ? { ...i, cantidad: i.cantidad + 1 } : i)
        : [...prev, { ...p, cantidad: 1 }]
    })
    mostrarNotif(`${p.titulo} agregado ✓`)
  }

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito(prev =>
      prev
        .map(i => i.id_producto === id ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter(i => i.cantidad > 0)
    )
  }

  const quitarDelCarrito = (id: string) =>
    setCarrito(prev => prev.filter(i => i.id_producto !== id))

  const vaciarCarrito = () => setCarrito([])

  const mostrarNotif = (msg: string) => {
    setNotif(msg)
    setTimeout(() => setNotif(''), 2500)
  }

  const handleCategoriaChange = (cat: string) => {
    setCategoriaActiva(cat)
    setEtiquetaActiva('Todas')
  }

  const handleComprar = async () => {
    if (carrito.length === 0) return
    setProcesando(true)
    try {
      const res = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map(i => ({
            id:         i.id_producto,
            title:      i.titulo,
            quantity:   i.cantidad,
            unit_price: i.precio,
          })),
        }),
      })
      const data: { init_point?: string; error?: string } = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        mostrarNotif('Error al iniciar el pago. Intenta de nuevo.')
      }
    } catch {
      mostrarNotif('Error de conexión. Intenta de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div
      suppressHydrationWarning
      style={{
        minHeight: '100vh',
        backgroundClip: 'unset',
        WebkitBackgroundClip: 'unset',
        color: 'rgba(0, 0, 0, 0)',
        backgroundColor: 'var(--color-blue-600)',
      }}
    >

      {/* HEADER */}
      <header style={{
        backgroundColor: C.oliveDark,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem',
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'relative',
        }}>

          {/* REDES — izquierda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href="#"
              style={{ color: C.tanLight, display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', fontSize: '0.75rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              <span>Tu Instagram</span>
            </a>
            <a
              href="#"
              style={{ color: C.tanLight, display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', fontSize: '0.75rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.428a.75.75 0 0 0 .915.915l5.571-1.476A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 0 1-4.953-1.354l-.355-.211-3.667.971.988-3.607-.231-.371A9.725 9.725 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
              <span>Tu WhatsApp</span>
            </a>
          </div>

          {/* LOGO — centro absoluto */}
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            background: C.grayLight, borderRadius: 8,
            padding: '0.4rem 1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 140, height: 44,
          }}>
            <span style={{
              color: C.dark, fontWeight: 700, fontSize: '0.85rem',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>ACÁ TU LOGO</span>
          </div>

          {/* CARRITO — derecha */}
          <button
            onClick={() => setCarritoOpen(true)}
            style={{
              position: 'relative', background: 'transparent',
              border: `1.5px solid ${C.grayLight}`, borderRadius: 8,
              padding: '0.4rem 0.9rem', color: C.grayLight, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.85rem', fontWeight: 600,
            }}
          >
            <IconCarrito size={18} />
            {cantidadCarrito > 0 && (
              <span style={{
                position: 'absolute', top: -8, right: -8,
                background: C.gray, color: '#fff', borderRadius: '50%',
                width: 20, height: 20, fontSize: '0.7rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cantidadCarrito}</span>
            )}
            <span>Carrito</span>
            {cantidadCarrito > 0 && (
              <span style={{ color: C.goldLight, fontSize: '0.75rem' }}>{formatARS(totalCarrito)}</span>
            )}
          </button>

        </div>
      </header>

      {/* HERO */}
      <section style={{
        background: `linear-gradient(135deg, ${C.oliveDark} 0%, ${C.olive} 50%, ${C.tan} 100%)`,
        padding: '3rem 1.5rem', textAlign: 'center',
      }}>
        <p style={{ color: C.goldLight, fontSize: '1rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
          Tené online y actualizada tu tienda de e-commerce con carrito de compras
        </p>
        <h2 style={{ color: C.white, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800, margin: '0 0 0.75rem' }}>
          Integración API con MercadoPago
        </h2>
        <p style={{ color: C.tanLight, fontSize: '1rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Tu tienda online lista para vender. Carrito de compras, filtros por categoría
          y pago integrado con Mercado Pago. Sin complicaciones.
        </p>
      </section>

      {/* MAIN */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Filtro categoría */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gray, marginBottom: '0.6rem' }}>
            Categoría
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categorias.map(cat => (
              <button key={cat} onClick={() => handleCategoriaChange(cat)} style={{
                padding: '0.4rem 1.1rem', borderRadius: 20,
                border: `1.5px solid ${categoriaActiva === cat ? C.olive : C.grayLight}`,
                background: categoriaActiva === cat ? C.olive : C.white,
                color: categoriaActiva === cat ? C.white : C.gray,
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Filtro etiqueta */}
        {categoriaActiva !== 'Todos' && etiquetas.length > 2 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gray, marginBottom: '0.6rem' }}>
              Estilo
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {etiquetas.map(et => (
                <button key={et} onClick={() => setEtiquetaActiva(et)} style={{
                  padding: '0.3rem 0.9rem', borderRadius: 20,
                  border: `1.5px solid ${etiquetaActiva === et ? C.purple : C.grayLight}`,
                  background: etiquetaActiva === et ? C.purplePale : C.white,
                  color: etiquetaActiva === et ? C.purple : C.gray,
                  fontSize: '0.78rem', fontWeight: etiquetaActiva === et ? 700 : 400, cursor: 'pointer',
                }}>{et}</button>
              ))}
            </div>
          </div>
        )}

        {/* Cargando */}
        {cargando && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{
              width: 48, height: 48,
              border: `3px solid ${C.grayLight}`, borderTop: `3px solid ${C.gray}`,
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
            }} />
            <p style={{ color: C.gray }}>Cargando productos…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '1rem 1.5rem', color: '#991b1b', textAlign: 'center' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Contador */}
        {!cargando && !errorMsg && (
          <p style={{ color: C.gray, fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
            {categoriaActiva !== 'Todos' && ` en ${categoriaActiva}`}
            {etiquetaActiva !== 'Todas' && ` · ${etiquetaActiva}`}
          </p>
        )}

        {/* Grilla */}
        {!cargando && !errorMsg && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>
            {productosFiltrados.map(p => (
              <ProductCard
                key={p.id_producto}
                producto={p}
                onVerImagen={() => setModal(p)}
                onAgregar={() => agregarAlCarrito(p)}
              />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && !errorMsg && productosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '2rem' }}>🔍</p>
            <p style={{ color: C.gray }}>No hay productos con ese filtro.</p>
            <button onClick={() => { setCategoriaActiva('Todos'); setEtiquetaActiva('Todas') }} style={{
              marginTop: '1rem', padding: '0.5rem 1.5rem',
              background: C.olive, color: C.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
            }}>Ver todos</button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ background: C.dark, color: C.tanLight, textAlign: 'center', padding: '2rem 1.5rem', marginTop: '3rem' }}>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>
          <span style={{ color: C.goldLight, fontWeight: 700 }}>Marcos Marti Web Design</span> — Consulta planes para micro emprendedores
        </p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', opacity: 0.5 }}>
          © {new Date().getFullYear()} Todos los derechos reservados
        </p>
      </footer>

      {/* MODAL IMAGEN */}
      {modal && (
        <div onClick={() => setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,14,0.88)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.white, borderRadius: 16, overflow: 'hidden',
            maxWidth: 480, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ position: 'relative', aspectRatio: '1', width: '100%' }}>
              <Image src={modal.imagen} alt={modal.titulo} fill sizes="480px" style={{ objectFit: 'cover' }} />
              <button onClick={() => setModal(null)} style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                width: 32, height: 32, color: '#fff', fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem', fontWeight: 700, color: C.dark }}>{modal.titulo}</h3>
              <p style={{ margin: '0 0 0.4rem', color: C.gray, fontSize: '0.85rem' }}>{modal.descripcion}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: C.olive }}>{formatARS(modal.precio)}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setModal(null)} style={{
                    padding: '0.5rem 1rem', border: `1px solid ${C.grayLight}`,
                    borderRadius: 8, background: C.white, color: C.gray, cursor: 'pointer', fontSize: '0.85rem',
                  }}>Cerrar</button>
                  <button onClick={() => { agregarAlCarrito(modal); setModal(null) }} style={{
                    padding: '0.5rem 1.25rem', border: 'none', borderRadius: 8,
                    background: C.purple, color: C.white, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <IconCarrito size={15} /> Agregar
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARRITO PANEL */}
      {carritoOpen && (
        <div onClick={() => setCarritoOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(20,18,14,0.5)', zIndex: 80,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', top: 0, right: 0, height: '100%',
            width: 'min(400px, 100vw)', background: C.white,
            boxShadow: '-4px 0 30px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.grayLight}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: C.oliveDark,
            }}>
              <h3 style={{ margin: 0, color: C.white, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCarrito size={18} /> Carrito ({cantidadCarrito})
              </h3>
              <button onClick={() => setCarritoOpen(false)} style={{
                background: 'transparent', border: 'none', color: C.white,
                cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '0.25rem',
              }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              {carrito.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: '3rem', color: C.gray }}>
                  <IconCarrito size={40} />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                carrito.map(item => (
                  <div key={item.id_producto} style={{
                    display: 'flex', gap: '0.75rem', padding: '0.75rem 0',
                    borderBottom: `1px solid ${C.grayLight}`, alignItems: 'center',
                  }}>
                    <div style={{
                      position: 'relative', width: 60, height: 60,
                      borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: C.grayLight,
                    }}>
                      <Image src={item.imagen} alt={item.titulo} fill sizes="60px" style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 0.2rem', fontSize: '0.82rem', fontWeight: 600, color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.titulo}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: C.olive, fontWeight: 700 }}>
                        {formatARS(item.precio)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <button onClick={() => cambiarCantidad(item.id_producto, -1)} style={btnQtyStyle}>−</button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontSize: '0.85rem' }}>{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.id_producto, 1)} style={btnQtyStyle}>+</button>
                      <button onClick={() => quitarDelCarrito(item.id_producto)} style={{
                        background: 'transparent', border: 'none', color: '#ef4444',
                        cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem 0.3rem', marginLeft: '0.2rem',
                      }}>🗑</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${C.grayLight}`, background: C.tanPale }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700, color: C.dark }}>Total</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: C.olive }}>{formatARS(totalCarrito)}</span>
                </div>
                <button onClick={handleComprar} disabled={procesando} style={{
                  width: '100%', padding: '0.9rem',
                  background: procesando ? C.gray : C.olive,
                  border: 'none', borderRadius: 10, color: C.white,
                  fontWeight: 800, fontSize: '1rem', cursor: procesando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}>
                  <IconCarrito size={18} />
                  {procesando ? 'Redirigiendo…' : 'Pagar con Mercado Pago'}
                </button>
                <button onClick={vaciarCarrito} style={{
                  width: '100%', marginTop: '0.5rem', padding: '0.5rem',
                  background: 'transparent', border: 'none', color: C.gray,
                  fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline',
                }}>Vaciar carrito</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {notif && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: C.dark, color: C.goldLight, padding: '0.6rem 1.4rem',
          borderRadius: 30, fontSize: '0.85rem', fontWeight: 600,
          zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
        }}>
          {notif}
        </div>
      )}
    </div>
  )
}

const btnQtyStyle: React.CSSProperties = {
  width: 26, height: 26,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#F3F0EA', border: '1px solid #D6D0C4', borderRadius: 6,
  cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: '#555', padding: 0,
}

type ProductCardProps = {
  producto: Producto
  onVerImagen: () => void
  onAgregar: () => void
}

function ProductCard({ producto, onVerImagen, onAgregar }: ProductCardProps) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.tanPale, borderRadius: 14, overflow: 'hidden',
        border: `5px solid ${hover ? C.purple : C.grayLight}`,
        boxShadow: hover ? '0 8px 28px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div onClick={onVerImagen} style={{
        position: 'relative', aspectRatio: '1', background: C.grayLight,
        cursor: 'zoom-in', overflow: 'hidden',
      }}>
        <Image
          src={producto.imagen} alt={producto.titulo} fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          style={{ objectFit: 'cover', transition: 'transform 0.35s ease', transform: hover ? 'scale(1.07)' : 'scale(1)' }}
        />
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(44,42,36,0.72)', color: '#e0e0e0',
          fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.55rem',
          borderRadius: 12, letterSpacing: '0.06em',
        }}>{producto.etiqueta}</span>
      </div>

      <div style={{ padding: '0.85rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: '0 0 0.25rem', fontSize: '0.88rem', fontWeight: 600, color: C.dark, lineHeight: 1.3 }}>
          {producto.titulo}
        </p>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: C.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {producto.descripcion}
        </p>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: C.olive }}>
            {formatARS(producto.precio)}
          </span>
          <button onClick={onAgregar} style={{
            padding: '0.4rem 0.9rem',
            background: hover ? C.purple : C.purplePale,
            border: `1.5px solid ${C.purple}`,
            borderRadius: 8, color: hover ? C.white : C.purple,
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            transition: 'all 0.2s',
          }}>
            <IconCarrito size={14} /><span>Agregar</span>
          </button>
        </div>
      </div>
    </div>
  )
}