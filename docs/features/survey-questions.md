# Feature: Preguntas Estadísticas (Survey Questions)

## Propósito

Sistema CRUD para crear preguntas estadísticas dinámicas que se usarán en el formulario de registro de talentos (fase futura). Las respuestas se almacenan en `talent_analytics` (key-value).

## Tablas

- `survey_questions` — Definición de preguntas (key, tipo de respuesta, opciones)
- `survey_question_translations` — Labels, descripciones, option_labels por locale

## Tipos de respuesta

| response_type | Renderiza | Options |
|---------------|-----------|---------|
| `text` | Input text | No |
| `scale_1_5` | Radio 1-5 | Implícitas |
| `scale_1_10` | Radio 1-10 | Implícitas |
| `single_select` | Dropdown/radio custom | Sí (array) |
| `yes_no` | Radio Sí/No | Implícitas |

## Relación con talent_analytics

`survey_questions.key` mapea a `talent_analytics.key`. Sin FK directa — convención de naming compartida.

## Admin UI

Una sola página con locale tabs + lista de cards editables inline + "Agregar pregunta" + "Guardar".

## Consideraciones de producción

- Key es read-only después de creación (evita huérfanos en talent_analytics)
- options requeridas solo para single_select
- Traducciones incompletas → fallback al key
