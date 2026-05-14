'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, ArrowUp, ArrowDown, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { buildReviewPhotoPublicUrl } from '@/shared/lib/reviews/photo-storage';
import { uploadReviewPhoto } from '../actions/upload-review-photo';
import { removeReviewPhoto } from '../actions/remove-review-photo';
import type { ReviewInput } from '../types';

type Props = {
  review: ReviewInput;
  locale: string;
  isPrimary: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (next: ReviewInput) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function ReviewRow({
  review,
  locale,
  isPrimary,
  canMoveUp,
  canMoveDown,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminReviews');
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();
  const [photoBase, setPhotoBase] = useState(review.author_photo);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !review.id) return;
    const fd = new FormData();
    fd.set('reviewId', review.id);
    fd.set('file', file);
    startUpload(async () => {
      const result = await uploadReviewPhoto(fd);
      if ('error' in result) return;
      setPhotoBase(result.data.photoBase);
      onChange({ ...review, author_photo: result.data.photoBase });
      if (fileRef.current) fileRef.current.value = '';
    });
  };

  const handleRemovePhoto = () => {
    if (!review.id) return;
    startUpload(async () => {
      const result = await removeReviewPhoto({ reviewId: review.id! });
      if ('error' in result) return;
      setPhotoBase(null);
      onChange({ ...review, author_photo: null });
    });
  };

  const photoUrl = buildReviewPhotoPublicUrl(photoBase);
  const currentText = review.translations[locale] ?? '';

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={review.author_name}
              className="size-20 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="size-20 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border">
              {t('noPhoto')}
            </div>
          )}
          <div className="mt-2 flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!review.id || isUploading}
              onClick={() => fileRef.current?.click()}
              title={!review.id ? t('savePhotoHint') : undefined}
            >
              <Upload className="size-3" />
            </Button>
            {photoBase && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={handleRemovePhoto}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Right-side fields */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {isPrimary && (
            <>
              <div className="space-y-1">
                <Label>{t('authorName')}</Label>
                <Input
                  value={review.author_name}
                  onChange={(e) =>
                    onChange({ ...review, author_name: e.target.value })
                  }
                  maxLength={200}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('stars')}</Label>
                <Input
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={review.stars}
                  onChange={(e) =>
                    onChange({
                      ...review,
                      stars: Number(e.target.value) || 0.5,
                    })
                  }
                />
              </div>
            </>
          )}
          <div className="space-y-1 md:col-span-2">
            <Label>
              {t('text')} ({locale.toUpperCase()})
            </Label>
            <Textarea
              rows={3}
              value={currentText}
              maxLength={2000}
              onChange={(e) =>
                onChange({
                  ...review,
                  translations: {
                    ...review.translations,
                    [locale]: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>

        {/* Actions column */}
        <div className="shrink-0 flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label={t('moveUp')}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label={t('moveDown')}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={t('remove')}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      {isPrimary && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={review.is_active}
            onChange={(e) =>
              onChange({ ...review, is_active: e.target.checked })
            }
            className="size-4"
          />
          {t('isActive')}
        </label>
      )}
    </div>
  );
}
