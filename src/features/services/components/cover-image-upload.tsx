'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  buildCoverPublicUrl,
  type CoverSize,
} from '../lib/cover-image-storage';
import { uploadServiceCover } from '../actions/upload-service-cover';
import { removeServiceCover } from '../actions/remove-service-cover';

type Props = {
  serviceId: string;
  initialCoverBase: string | null;
};

const PREVIEW_SIZE: CoverSize = 'card';

export function CoverImageUpload({ serviceId, initialCoverBase }: Props) {
  const t = useTranslations('AdminServices.cover');
  const tc = useTranslations('Common');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [coverBase, setCoverBase] = useState<string | null>(initialCoverBase);
  // Used to bust the <img> cache when the same base path is overwritten
  // (replace flow: serviceId and size stay constant; query param forces
  // the browser to re-fetch the new WebP).
  const [cacheKey, setCacheKey] = useState<number>(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'upload' | 'remove' | null>(null);

  // Reset local state if parent gets fresh data (e.g. after router.refresh).
  useEffect(() => {
    setCoverBase(initialCoverBase);
  }, [initialCoverBase]);

  const previewUrl = coverBase ? buildCoverPublicUrl(coverBase, PREVIEW_SIZE) : null;
  const previewWithCacheBuster = previewUrl ? `${previewUrl}?v=${cacheKey}` : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('serviceId', serviceId);
    fd.set('file', file);
    setAction('upload');
    startTransition(async () => {
      const res = await uploadServiceCover(fd);
      setAction(null);
      if ('error' in res) {
        toast.error(res.error.message || tc('saveError'));
        return;
      }
      setCoverBase(res.data.coverBase);
      setCacheKey(Date.now());
      toast.success(tc('savedSuccess'));
      router.refresh();
    });
    // Reset input so re-uploading the same filename triggers the change.
    e.target.value = '';
  };

  const handleRemove = () => {
    if (!coverBase) return;
    setAction('remove');
    startTransition(async () => {
      const res = await removeServiceCover({ serviceId });
      setAction(null);
      if ('error' in res) {
        toast.error(res.error.message || tc('saveError'));
        return;
      }
      setCoverBase(null);
      toast.success(tc('deletedSuccess'));
      router.refresh();
    });
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <Label className="text-base font-semibold">{t('title')}</Label>
          <p className="mt-1 text-xs text-muted-foreground">{t('help')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-44 w-full overflow-hidden rounded-md border border-dashed border-border bg-muted sm:w-72">
          {previewWithCacheBuster ? (
            // Plain <img> intentionally: next/image needs static dimensions
            // and our base path varies per service. Performance is fine —
            // WebP at 800w is ~30-60 KB.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewWithCacheBuster}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs italic text-muted-foreground">
              {t('empty')}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleFileChange}
            disabled={isPending}
          />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            {isPending && action === 'upload'
              ? t('uploading')
              : coverBase
              ? t('replace')
              : t('upload')}
          </Button>
          {coverBase && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending && action === 'remove' ? t('removing') : t('remove')}
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground">{t('sizeHint')}</p>
        </div>
      </div>
    </section>
  );
}
