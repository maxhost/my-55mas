'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload } from 'lucide-react';
import { parseCSV } from '../lib/csv-parser';
import type { ParsedCSV } from '../types';

type Props = {
  onParsed: (data: ParsedCSV) => void;
};

export function CsvUploader({ onParsed }: Props) {
  const t = useTranslations('AdminMigration');
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedCSV | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const parsed = await parseCSV(file);
      setPreview(parsed);
      onParsed(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{t('uploadCsv')}</h2>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary"
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('dropFile')}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {preview && (
        <div className="space-y-2">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{t('rowsDetected', { count: preview.totalRows })}</span>
            <span>{t('delimiter', { delimiter: preview.delimiter })}</span>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.headers.map((h) => (
                    <TableHead key={h} className="whitespace-nowrap text-xs">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.slice(0, 5).map((row, i) => (
                  <TableRow key={i}>
                    {preview.headers.map((h) => (
                      <TableCell key={h} className="max-w-[200px] truncate text-xs">
                        {row[h] || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
