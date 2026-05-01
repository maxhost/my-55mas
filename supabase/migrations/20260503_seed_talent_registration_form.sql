-- Seed initial data for the talent_registration form:
-- 1) fiscal_id_types catalog + country associations
-- 2) form_definitions['talent_registration'] schema + i18n (ES initial; other locales empty until admin UI lands)
-- 3) form_definition_countries for all currently active countries

-- 1. fiscal_id_types
INSERT INTO fiscal_id_types (code, sort_order, i18n) VALUES
  ('NIF', 1, '{"es": {"label": "NIF", "help": "Número de Identificación Fiscal"}, "pt": {"label": "NIF", "help": "Número de Identificação Fiscal"}, "en": {"label": "NIF", "help": "Tax identification number"}}'::jsonb),
  ('NIE', 2, '{"es": {"label": "NIE", "help": "Número de Identidad de Extranjero"}, "en": {"label": "NIE", "help": "Foreign resident ID"}}'::jsonb),
  ('CUIT', 3, '{"es": {"label": "CUIT", "help": "Clave Única de Identificación Tributaria"}}'::jsonb),
  ('CUIL', 4, '{"es": {"label": "CUIL", "help": "Código Único de Identificación Laboral"}}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO fiscal_id_type_countries (fiscal_id_type_id, country_id)
SELECT t.id, c.id FROM fiscal_id_types t, countries c
WHERE (t.code = 'NIF' AND c.code IN ('ES','PT'))
   OR (t.code = 'NIE' AND c.code = 'ES')
   OR (t.code IN ('CUIT','CUIL') AND c.code = 'AR')
ON CONFLICT DO NOTHING;

-- 2. form_definitions['talent_registration'].schema (field keys + flags)
UPDATE form_definitions
SET schema = '{
  "fields": [
    {"key": "full_name", "type": "text", "required": true},
    {"key": "email", "type": "email", "required": true},
    {"key": "password", "type": "password", "required": true},
    {"key": "phone", "type": "tel", "required": true},
    {"key": "country_id", "type": "select", "required": true},
    {"key": "city_id", "type": "select", "required": true},
    {"key": "address", "type": "address", "required": true},
    {"key": "fiscal_id_type_id", "type": "select", "required": true},
    {"key": "fiscal_id", "type": "text", "required": true},
    {"key": "services", "type": "multiselect", "required": true},
    {"key": "additional_info", "type": "textarea", "required": false},
    {"key": "disclaimer", "type": "display", "required": false},
    {"key": "terms_accepted", "type": "checkbox", "required": true},
    {"key": "marketing_consent", "type": "checkbox", "required": false}
  ]
}'::jsonb
WHERE form_key = 'talent_registration';

-- 2b. form_definitions['talent_registration'].i18n with ES strings
UPDATE form_definitions
SET i18n = '{
  "es": {
    "title": "Registro de talento",
    "submitLabel": "Registrarme",
    "fields": {
      "full_name": {
        "label": "Nombre completo",
        "placeholder": "Ana García López",
        "errors": {"required": "El nombre es obligatorio"}
      },
      "email": {
        "label": "Correo electrónico",
        "placeholder": "tu@email.com",
        "errors": {"required": "El email es obligatorio", "invalid": "Email inválido"}
      },
      "password": {
        "label": "Contraseña",
        "help": "Mínimo 8 caracteres",
        "errors": {"required": "La contraseña es obligatoria", "minLength": "Mínimo 8 caracteres"}
      },
      "phone": {
        "label": "Teléfono",
        "errors": {"required": "El teléfono es obligatorio", "invalid": "Número de teléfono inválido"}
      },
      "country_id": {
        "label": "País",
        "placeholder": "Selecciona tu país",
        "errors": {"required": "Selecciona un país"}
      },
      "city_id": {
        "label": "Ciudad",
        "placeholder": "Selecciona tu ciudad",
        "errors": {"required": "Selecciona una ciudad"}
      },
      "address": {
        "label": "Dirección",
        "placeholder": "Calle, número, piso",
        "errors": {"required": "La dirección es obligatoria"}
      },
      "fiscal_id_type_id": {
        "label": "Tipo de identificación fiscal",
        "errors": {"required": "Selecciona un tipo de identificación"}
      },
      "fiscal_id": {
        "label": "Identificación fiscal",
        "errors": {"required": "El identificador es obligatorio"}
      },
      "services": {
        "label": "Servicios que ofreces",
        "help": "Puedes editar esta selección después",
        "placeholder": "Selecciona país y ciudad primero",
        "errors": {"required": "Selecciona al menos un servicio"}
      },
      "additional_info": {
        "label": "Información adicional",
        "placeholder": "Cuéntanos algo más sobre ti (opcional)"
      },
      "disclaimer": {
        "help": "Los datos personales recopilados serán tratados por Movimento 55+ Associação (\"55+\"), como entidad responsable del tratamiento de datos personales. La información facilitada será tratada de forma confidencial y utilizada con la finalidad de gestionar los servicios 55+ – facilitar sus datos de contacto a los clientes, programar el servicio requerido – en base a procedimientos precontractuales. De acuerdo con la legislación aplicable, usted podrá solicitar, en cualquier momento, el acceso a sus datos personales, así como su rectificación, supresión o limitación de su tratamiento, la portabilidad de sus datos, u oponerse a su tratamiento, mediante solicitud escrita dirigida a 55+ a través de servico@55mais.pt o a la dirección Casa do Impacto | TELEVISOR. San Pedro, nº 8, 1200 – 432 Lisboa. Sin perjuicio de cualquier otro recurso administrativo o judicial, usted tiene derecho a presentar una reclamación ante la Comisión Nacional de Protección de Datos, si considera que el tratamiento realizado por 55+ vulnera el régimen jurídico vigente en cada momento. Para obtener más información sobre las condiciones de tratamiento de datos por parte de 55+, consulte nuestra Política de Privacidad y Cookies."
      },
      "terms_accepted": {
        "label": "He leído los Términos y Condiciones y la Política de Privacidad",
        "errors": {"required": "Debes aceptar los términos para continuar"}
      },
      "marketing_consent": {
        "label": "Acepto que 55+ pueda enviarme comunicaciones de marketing relacionadas con sus servicios (incluido el boletín informativo)"
      }
    }
  }
}'::jsonb
WHERE form_key = 'talent_registration';

-- 3. Activar el form en todos los countries activos
INSERT INTO form_definition_countries (form_id, country_id)
SELECT (SELECT id FROM form_definitions WHERE form_key='talent_registration'), c.id
FROM countries c WHERE c.is_active = true
ON CONFLICT DO NOTHING;
