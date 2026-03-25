# Feature Folder Template

Cada feature vive en `src/features/<nombre>/` y sigue esta estructura:

```
src/features/<nombre>/
├── types.ts           # Tipos de dominio del feature (NO tipos de DB)
├── validations.ts     # Schemas Zod para inputs de formularios y Server Actions
├── actions/           # Server Actions ("use server")
│   └── *.ts
├── components/        # Componentes UI específicos del feature
│   └── *.tsx
├── hooks/             # Client hooks (solo si necesarios)
│   └── *.ts
├── index.ts           # API pública (barrel export)
└── __tests__/         # Tests unitarios y de integración
    └── *.test.ts
```

## Reglas

- **`index.ts` es la única puerta de entrada** — imports externos solo desde aquí
- **`types.ts`** define tipos de dominio, NO replica tipos de DB (usar `Tables<'nombre'>` de `@/lib/supabase/types`)
- **`validations.ts`** usa Zod para validar inputs de formularios y Server Actions
- **Un feature NO importa de otro feature** — si necesitan comunicarse, pasan por `src/shared/`
- **Imports permitidos**: `@/shared/*`, `@/lib/*`, `@/components/ui/*`
- **Imports prohibidos**: `@/features/otro-feature/*`, `@/app/*`

## Límites

- Feature completo: máximo 1500 LOC
- Archivo individual: máximo 300 LOC
- Función individual: máximo 60 LOC

## Test de independencia

Borrar la carpeta de otro feature NO debe romper tu feature. Si rompe, hay un import cruzado que debe corregirse.
