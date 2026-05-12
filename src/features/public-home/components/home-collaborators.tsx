import { getTranslations } from 'next-intl/server';
import {
  CollaboratorMarquee,
  type CollaboratorLogo,
} from '@/shared/components/marketing/collaborator-marquee';

// Logos live in public/brand/collaborators/. Order matches the original.
// Swapped for a Supabase query in fase 4 if we want admin-editable logos.
const LOGOS: CollaboratorLogo[] = [
  { key: 'ashoka', src: '/brand/collaborators/ashoka.png', alt: 'Ashoka', width: 160, height: 64 },
  { key: 'b-value', src: '/brand/collaborators/b-value.png', alt: 'B-Value', width: 160, height: 64 },
  { key: 'ship2b', src: '/brand/collaborators/ship2b.png', alt: 'Ship2B Foundation', width: 160, height: 64 },
  {
    key: 'fundacion-juan-entrecanales',
    src: '/brand/collaborators/fundacion-juan-entrecanales.png',
    alt: 'Fundación Juan Entrecanales de Azcárate',
    width: 160,
    height: 64,
  },
  {
    key: 'fundacion-sabadell',
    src: '/brand/collaborators/fundacion-sabadell.png',
    alt: 'Fundación Banco Sabadell',
    width: 160,
    height: 64,
  },
  {
    key: 'barcelona-activa',
    src: '/brand/collaborators/barcelona-activa.png',
    alt: 'Ajuntament de Barcelona — Barcelona Activa',
    width: 160,
    height: 64,
  },
  {
    key: 'diputacion-malaga',
    src: '/brand/collaborators/diputacion-malaga.jpg',
    alt: 'Diputación Provincial de Málaga',
    width: 160,
    height: 64,
  },
  { key: 'la-noria', src: '/brand/collaborators/la-noria.png', alt: 'La Noria', width: 160, height: 64 },
  {
    key: 'sabadell-seguros',
    src: '/brand/collaborators/sabadell-seguros.jpg',
    alt: 'Sabadell Seguros, Pensiones y Vida',
    width: 160,
    height: 64,
  },
];

export async function HomeCollaborators() {
  const t = await getTranslations('home.collaborators');
  return (
    <CollaboratorMarquee
      title={t('title')}
      logos={LOGOS}
      ctaLabel={t('cta')}
      ctaHref="/colaboradores"
    />
  );
}
