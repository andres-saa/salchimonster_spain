<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ToastContainer />
    <siteDialog />
    <CartBar />
    <MenuSearchModal></MenuSearchModal>
  </div>
</template>

<script setup>
import { onMounted } from '#imports'
import { useRoute, useRouter } from '#imports'
import { useSitesStore, useUserStore, usecartStore } from '#imports'
import { useSedeFromSubdomain } from '#imports'
import { URI } from './service/conection'

const siteStore = useSitesStore()
const userStore = useUserStore()
const cartStore = usecartStore()
const sede = useSedeFromSubdomain()
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  let siteLoadedFromHash = false
  const hash = route.query.hash
  
  // ======================================================
  // 0) CAPTURA DE PARÁMETROS EXTERNOS
  // ======================================================
  const qInsertedBy = route.query.inserted_by
  const qToken = route.query.token
  const qiframe = route.query.iframe

  // ✅ VALIDACIÓN IFRAME (1 o 0):
  // Comparamos explícitamente con '1'. Si es '1' será true, si es '0' u otra cosa será false.
  const isIframe = qiframe === '1'

  // CAMBIO: Ahora usamos '&&' para exigir que ambos existan
  if (qInsertedBy && qToken) {
    console.log('🔗 Credenciales completas detectadas.', { inserted_by: qInsertedBy, token: qToken, iframe: isIframe })
    
    userStore.user = {
      ...userStore.user,
      inserted_by: qInsertedBy,
      token: qToken,
      iframe: isIframe // ✅ Guardamos un Boolean real, no el string '1'/'0'
    }
  }

  // ======================================================
  // 1) CARGA POR HASH (Desde el Dispatcher)
  // ======================================================
  if (hash) {
    try {
      console.log('🔄 Hash detectado, recuperando sesión...')
      const response = await fetch(`${URI}/data/${hash}`)

      if (response.ok) {
        const jsonResponse = await response.json()
        const restoredData = jsonResponse?.data || {}

        // A) Restaurar Sede
        if (restoredData.site_location) {
          siteStore.location.site = restoredData.site_location
          siteStore.initStatusWatcher()
          siteLoadedFromHash = true
        }

        // B) Restaurar Usuario
        if (restoredData.user) {
          userStore.user = {
            ...userStore.user,
            ...restoredData.user,
            // Si el hash trae un valor de iframe, decidimos si el de la URL (isIframe) tiene prioridad
            // Usualmente el parámetro de URL fresco manda sobre el hash antiguo:
            iframe: isIframe || restoredData.user.iframe 
          }
        }

        // ... (Lógica de Location omitida para brevedad, se mantiene igual) ...
        // ... (Copia tu bloque de Location/Costo aquí) ...

        // C) Restaurar Carrito
        if (restoredData.cart) {
          const cartItems = Array.isArray(restoredData.cart)
            ? restoredData.cart
            : (restoredData.cart.items || [])

          if (cartItems.length > 0) {
            cartStore.cart = Array.isArray(restoredData.cart) ? restoredData.cart : restoredData.cart
          }
        }

        // D) Restaurar Cupón
        if (restoredData.discount) {
          cartStore.applyCoupon(restoredData.discount)
        }
        if (restoredData.coupon_ui && cartStore.setCouponUi) {
          cartStore.setCouponUi(restoredData.coupon_ui)
        }

        // E) Limpiar la URL
        const queryToClean = { ...route.query, hash: undefined }
        
        if (qInsertedBy && qToken) {
           queryToClean.inserted_by = undefined
           queryToClean.token = undefined
        }

        // ✅ LIMPIEZA ROBUSTA DE IFRAME:
        // Usamos '!== undefined' para asegurarnos de limpiar incluso si viene ?iframe=0
        if (qiframe !== undefined) {
           queryToClean.iframe = undefined
        }

        router.replace({ query: queryToClean })

      } else {
        console.warn('⚠️ El hash no retornó datos válidos o ya expiró.')
      }
    } catch (err) {
      console.error('❌ Error crítico restaurando datos por hash:', err)
    }
  }

  // ======================================================
  // 2) CARGA NORMAL (Por Subdominio)
  // ======================================================
  if (!siteLoadedFromHash) {
    try {
      const currentSede = typeof sede === 'string' ? sede : sede?.value

      if (currentSede) {
        const response = await fetch(`${URI}/sites/subdomain/${currentSede}`)
        if (response.ok) {
          const data = await response.json()
          const siteData = data?.[0] || data

          if (siteData) {
            siteStore.location.site = siteData
            siteStore.initStatusWatcher()
          }
        }
      }
      
      // Limpieza de params en carga normal
      const queryToClean = { ...route.query }
      let needsClean = false

      if (qInsertedBy && qToken) {
          queryToClean.inserted_by = undefined
          queryToClean.token = undefined
          needsClean = true
      }

      // ✅ También limpiamos el iframe en la carga normal si es necesario
      if (qiframe !== undefined) {
          queryToClean.iframe = undefined
          needsClean = true
      }

      if (needsClean) {
          router.replace({ query: queryToClean })
      }

    } catch (err) {
      console.error('Error cargando sede desde subdominio:', err)
    }
  }
})
</script>