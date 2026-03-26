# Spec: Toast Notifications

## Requisitos

### Infraestructura global

El sistema de toast usa **Sonner** (librería recomendada por shadcn/ui). Un componente
`<Toaster />` se renderiza una vez en `src/app/[locale]/layout.tsx`, disponible en todas
las route groups (admin, public, client, talent, auth).

**Configuración:**
- Posición: `top-right`
- Duración: 4000ms
- `richColors`: sí (verde success, rojo error)
- `closeButton`: sí (dismiss manual + accesibilidad)

### Cuándo usar toast vs inline

| Escenario | Feedback |
|-----------|----------|
| Acción completada (guardar, crear, eliminar) | Toast success |
| Error genérico (DB, red, server) | Toast error |
| Error de validación de campo | Inline (junto al campo) |
| Error dentro de un dialog abierto | Inline en el dialog |
| Loading/progreso (clonando, guardando) | Inline (botón disabled + texto) |

### Patrón de uso en componentes

```tsx
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

// En el componente:
const tc = useTranslations('Common');

// En el handler:
const result = await serverAction(...);
if (result && 'error' in result) {
  toast.error(tc('saveError'));
  return;
}
toast.success(tc('savedSuccess'));
```

### Claves i18n (namespace Common)

| Key | Uso |
|-----|-----|
| `savedSuccess` | Tras guardar contenido, configuración o formulario |
| `saveError` | Cuando falla un guardado genérico |
| `createdSuccess` | Tras crear un recurso (servicio, etc.) |
| `deletedSuccess` | Tras eliminar un recurso |

---

## Criterios de aceptación

- [ ] `<Toaster />` renderizado globalmente en layout de locale
- [ ] Toda acción de guardar muestra toast success o error
- [ ] Crear servicio muestra toast success antes de navegar
- [ ] Eliminar servicio muestra toast success tras cerrar dialog
- [ ] Errores de validación de campo permanecen inline
- [ ] Errores en ConfirmDialog permanecen en el dialog
- [ ] Toasts traducidos en los 5 locales (es, en, ca, fr, pt)
- [ ] Toast no solapa sidebar admin (bottom-right)
- [ ] Toast accesible (aria-live, dismiss con keyboard)
- [ ] `NODE_ENV=production pnpm build` pasa sin errores
- [ ] Tests existentes pasan (`pnpm test:run`)
