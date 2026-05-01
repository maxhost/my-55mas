-- Seed translations EN / PT / FR / CA for form_definitions['talent_registration'].
-- The 'es' locale stays untouched; we merge 4 new locale entries on top of the existing i18n.
-- Disclaimer is the GDPR-compliant legal copy from Movimento 55+ Associação,
-- adapted to each language while preserving legal references.

UPDATE form_definitions
SET i18n = i18n || '{
  "en": {
    "title": "Talent registration",
    "submitLabel": "Sign up",
    "fields": {
      "full_name": {
        "label": "Full name",
        "placeholder": "Anna Smith",
        "errors": {"required": "Name is required"}
      },
      "email": {
        "label": "Email address",
        "placeholder": "you@email.com",
        "errors": {"required": "Email is required", "invalid": "Invalid email"}
      },
      "password": {
        "label": "Password",
        "help": "Minimum 8 characters",
        "errors": {"required": "Password is required", "minLength": "Minimum 8 characters"}
      },
      "phone": {
        "label": "Phone",
        "errors": {"required": "Phone is required", "invalid": "Invalid phone number"}
      },
      "country_id": {
        "label": "Country",
        "placeholder": "Select your country",
        "errors": {"required": "Select a country"}
      },
      "city_id": {
        "label": "City",
        "placeholder": "Select your city",
        "errors": {"required": "Select a city"}
      },
      "address": {
        "label": "Address",
        "placeholder": "Street, number, floor",
        "errors": {"required": "Address is required"}
      },
      "fiscal_id_type_id": {
        "label": "Tax ID type",
        "errors": {"required": "Select a tax ID type"}
      },
      "fiscal_id": {
        "label": "Tax ID",
        "errors": {"required": "Tax ID is required"}
      },
      "services": {
        "label": "Services you offer",
        "help": "You can edit this selection later",
        "placeholder": "Select country and city first",
        "errors": {"required": "Select at least one service"}
      },
      "additional_info": {
        "label": "Additional information",
        "placeholder": "Tell us more about yourself (optional)"
      },
      "disclaimer": {
        "help": "The personal data collected will be processed by Movimento 55+ Associação (\"55+\") as the data controller. The information provided will be treated confidentially and used to manage 55+ services — sharing your contact details with clients and scheduling the requested service — based on pre-contractual procedures. Under applicable legislation, you may at any time request access to your personal data, as well as its rectification, deletion or restriction of processing, data portability, or object to its processing, by written request to 55+ via servico@55mais.pt or to the address Casa do Impacto | TELEVISOR. San Pedro, nº 8, 1200 – 432 Lisboa. Without prejudice to any other administrative or judicial remedy, you have the right to lodge a complaint with the National Data Protection Commission if you consider that the processing carried out by 55+ violates the legal regime in force at any time. For more information about the data processing conditions by 55+, please consult our Privacy and Cookies Policy."
      },
      "terms_accepted": {
        "label": "I have read the Terms and Conditions and the Privacy Policy",
        "errors": {"required": "You must accept the terms to continue"}
      },
      "marketing_consent": {
        "label": "I agree that 55+ may send me marketing communications related to its services (including the newsletter)"
      }
    }
  },
  "pt": {
    "title": "Registo de talento",
    "submitLabel": "Registar-me",
    "fields": {
      "full_name": {
        "label": "Nome completo",
        "placeholder": "Ana Silva Santos",
        "errors": {"required": "O nome é obrigatório"}
      },
      "email": {
        "label": "Correio eletrónico",
        "placeholder": "tu@email.com",
        "errors": {"required": "O email é obrigatório", "invalid": "Email inválido"}
      },
      "password": {
        "label": "Palavra-passe",
        "help": "Mínimo 8 caracteres",
        "errors": {"required": "A palavra-passe é obrigatória", "minLength": "Mínimo 8 caracteres"}
      },
      "phone": {
        "label": "Telefone",
        "errors": {"required": "O telefone é obrigatório", "invalid": "Número de telefone inválido"}
      },
      "country_id": {
        "label": "País",
        "placeholder": "Seleciona o teu país",
        "errors": {"required": "Seleciona um país"}
      },
      "city_id": {
        "label": "Cidade",
        "placeholder": "Seleciona a tua cidade",
        "errors": {"required": "Seleciona uma cidade"}
      },
      "address": {
        "label": "Morada",
        "placeholder": "Rua, número, andar",
        "errors": {"required": "A morada é obrigatória"}
      },
      "fiscal_id_type_id": {
        "label": "Tipo de identificação fiscal",
        "errors": {"required": "Seleciona um tipo de identificação"}
      },
      "fiscal_id": {
        "label": "Identificação fiscal",
        "errors": {"required": "O identificador é obrigatório"}
      },
      "services": {
        "label": "Serviços que ofereces",
        "help": "Podes editar esta seleção mais tarde",
        "placeholder": "Seleciona país e cidade primeiro",
        "errors": {"required": "Seleciona pelo menos um serviço"}
      },
      "additional_info": {
        "label": "Informação adicional",
        "placeholder": "Conta-nos algo mais sobre ti (opcional)"
      },
      "disclaimer": {
        "help": "Os dados pessoais recolhidos serão tratados pelo Movimento 55+ Associação (\"55+\"), como entidade responsável pelo tratamento de dados pessoais. A informação facultada será tratada de forma confidencial e utilizada com a finalidade de gerir os serviços 55+ – facilitar os seus dados de contacto aos clientes, agendar o serviço requerido – com base em procedimentos pré-contratuais. De acordo com a legislação aplicável, poderá solicitar, a qualquer momento, o acesso aos seus dados pessoais, bem como a sua retificação, eliminação ou limitação do seu tratamento, a portabilidade dos seus dados, ou opor-se ao seu tratamento, mediante pedido escrito dirigido à 55+ através de servico@55mais.pt ou para a morada Casa do Impacto | TELEVISOR. San Pedro, nº 8, 1200 – 432 Lisboa. Sem prejuízo de qualquer outro recurso administrativo ou judicial, tem o direito de apresentar uma reclamação junto da Comissão Nacional de Proteção de Dados, caso considere que o tratamento realizado pela 55+ viola o regime jurídico em vigor a cada momento. Para obter mais informação sobre as condições de tratamento de dados por parte da 55+, consulte a nossa Política de Privacidade e Cookies."
      },
      "terms_accepted": {
        "label": "Li os Termos e Condições e a Política de Privacidade",
        "errors": {"required": "Tens de aceitar os termos para continuar"}
      },
      "marketing_consent": {
        "label": "Aceito que a 55+ me envie comunicações de marketing relacionadas com os seus serviços (incluindo a newsletter)"
      }
    }
  },
  "fr": {
    "title": "Inscription des talents",
    "submitLabel": "M''inscrire",
    "fields": {
      "full_name": {
        "label": "Nom complet",
        "placeholder": "Anne Martin Dupont",
        "errors": {"required": "Le nom est obligatoire"}
      },
      "email": {
        "label": "Adresse e-mail",
        "placeholder": "vous@email.com",
        "errors": {"required": "L''email est obligatoire", "invalid": "Email invalide"}
      },
      "password": {
        "label": "Mot de passe",
        "help": "Minimum 8 caractères",
        "errors": {"required": "Le mot de passe est obligatoire", "minLength": "Minimum 8 caractères"}
      },
      "phone": {
        "label": "Téléphone",
        "errors": {"required": "Le téléphone est obligatoire", "invalid": "Numéro de téléphone invalide"}
      },
      "country_id": {
        "label": "Pays",
        "placeholder": "Sélectionne ton pays",
        "errors": {"required": "Sélectionne un pays"}
      },
      "city_id": {
        "label": "Ville",
        "placeholder": "Sélectionne ta ville",
        "errors": {"required": "Sélectionne une ville"}
      },
      "address": {
        "label": "Adresse",
        "placeholder": "Rue, numéro, étage",
        "errors": {"required": "L''adresse est obligatoire"}
      },
      "fiscal_id_type_id": {
        "label": "Type d''identification fiscale",
        "errors": {"required": "Sélectionne un type d''identification"}
      },
      "fiscal_id": {
        "label": "Identification fiscale",
        "errors": {"required": "L''identifiant est obligatoire"}
      },
      "services": {
        "label": "Services que tu proposes",
        "help": "Tu peux modifier cette sélection plus tard",
        "placeholder": "Sélectionne d''abord le pays et la ville",
        "errors": {"required": "Sélectionne au moins un service"}
      },
      "additional_info": {
        "label": "Informations complémentaires",
        "placeholder": "Parle-nous un peu plus de toi (facultatif)"
      },
      "disclaimer": {
        "help": "Les données personnelles collectées seront traitées par Movimento 55+ Associação (\"55+\"), en tant que responsable du traitement des données. Les informations fournies seront traitées de manière confidentielle et utilisées pour gérer les services 55+ – partager tes coordonnées avec les clients, planifier le service demandé – sur la base de procédures précontractuelles. Conformément à la législation applicable, tu peux à tout moment demander l''accès à tes données personnelles, ainsi que leur rectification, suppression ou limitation de traitement, la portabilité de tes données, ou t''opposer à leur traitement, par demande écrite adressée à 55+ via servico@55mais.pt ou à l''adresse Casa do Impacto | TELEVISOR. San Pedro, nº 8, 1200 – 432 Lisboa. Sans préjudice de tout autre recours administratif ou judiciaire, tu as le droit de déposer une plainte auprès de la Commission Nationale de Protection des Données si tu estimes que le traitement effectué par 55+ enfreint le régime juridique en vigueur à tout moment. Pour plus d''informations sur les conditions de traitement des données par 55+, consulte notre Politique de Confidentialité et Cookies."
      },
      "terms_accepted": {
        "label": "J''ai lu les Conditions Générales et la Politique de Confidentialité",
        "errors": {"required": "Tu dois accepter les conditions pour continuer"}
      },
      "marketing_consent": {
        "label": "J''accepte que 55+ puisse m''envoyer des communications marketing relatives à ses services (y compris la newsletter)"
      }
    }
  },
  "ca": {
    "title": "Registre de talent",
    "submitLabel": "Registrar-me",
    "fields": {
      "full_name": {
        "label": "Nom complet",
        "placeholder": "Anna Garcia López",
        "errors": {"required": "El nom és obligatori"}
      },
      "email": {
        "label": "Correu electrònic",
        "placeholder": "tu@email.com",
        "errors": {"required": "El correu és obligatori", "invalid": "Correu invàlid"}
      },
      "password": {
        "label": "Contrasenya",
        "help": "Mínim 8 caràcters",
        "errors": {"required": "La contrasenya és obligatòria", "minLength": "Mínim 8 caràcters"}
      },
      "phone": {
        "label": "Telèfon",
        "errors": {"required": "El telèfon és obligatori", "invalid": "Número de telèfon invàlid"}
      },
      "country_id": {
        "label": "País",
        "placeholder": "Selecciona el teu país",
        "errors": {"required": "Selecciona un país"}
      },
      "city_id": {
        "label": "Ciutat",
        "placeholder": "Selecciona la teva ciutat",
        "errors": {"required": "Selecciona una ciutat"}
      },
      "address": {
        "label": "Adreça",
        "placeholder": "Carrer, número, pis",
        "errors": {"required": "L''adreça és obligatòria"}
      },
      "fiscal_id_type_id": {
        "label": "Tipus d''identificació fiscal",
        "errors": {"required": "Selecciona un tipus d''identificació"}
      },
      "fiscal_id": {
        "label": "Identificació fiscal",
        "errors": {"required": "L''identificador és obligatori"}
      },
      "services": {
        "label": "Serveis que ofereixes",
        "help": "Pots editar aquesta selecció més tard",
        "placeholder": "Selecciona país i ciutat primer",
        "errors": {"required": "Selecciona almenys un servei"}
      },
      "additional_info": {
        "label": "Informació addicional",
        "placeholder": "Explica''ns alguna cosa més sobre tu (opcional)"
      },
      "disclaimer": {
        "help": "Les dades personals recopilades seran tractades per Movimento 55+ Associação (\"55+\"), com a entitat responsable del tractament de dades personals. La informació facilitada es tractarà de forma confidencial i s''utilitzarà amb la finalitat de gestionar els serveis 55+ – facilitar les teves dades de contacte als clients, programar el servei requerit – sobre la base de procediments precontractuals. D''acord amb la legislació aplicable, podràs sol·licitar, en qualsevol moment, l''accés a les teves dades personals, així com la seva rectificació, supressió o limitació del seu tractament, la portabilitat de les teves dades, o oposar-te al seu tractament, mitjançant sol·licitud escrita adreçada a 55+ a través de servico@55mais.pt o a l''adreça Casa do Impacto | TELEVISOR. San Pedro, nº 8, 1200 – 432 Lisboa. Sense perjudici de qualsevol altre recurs administratiu o judicial, tens dret a presentar una reclamació davant la Comissió Nacional de Protecció de Dades, si consideres que el tractament realitzat per 55+ vulnera el règim jurídic vigent en cada moment. Per obtenir més informació sobre les condicions de tractament de dades per part de 55+, consulta la nostra Política de Privacitat i Galetes."
      },
      "terms_accepted": {
        "label": "He llegit els Termes i Condicions i la Política de Privacitat",
        "errors": {"required": "Has d''acceptar els termes per continuar"}
      },
      "marketing_consent": {
        "label": "Accepto que 55+ pugui enviar-me comunicacions de màrqueting relacionades amb els seus serveis (inclòs el butlletí informatiu)"
      }
    }
  }
}'::jsonb
WHERE form_key = 'talent_registration';
