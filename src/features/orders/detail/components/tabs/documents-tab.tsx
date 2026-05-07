'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DocumentsTabHints, OrderDocumentEntry } from '@/features/orders/detail/types';

type Props = {
  documents: OrderDocumentEntry[];
  hints: DocumentsTabHints;
  locale: string;
};

const EMPTY_PLACEHOLDER = '—';

function formatUploadedAt(value: string | null, locale: string): string {
  if (!value) return EMPTY_PLACEHOLDER;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_PLACEHOLDER;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function handleDownload(url: string): void {
  if (typeof window === 'undefined') return;
  window.open(url, '_blank');
}

export function DocumentsTab({ documents, hints, locale }: Props): JSX.Element {
  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{hints.empty}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{hints.emptyHelp}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{hints.columnDocument}</TableHead>
            <TableHead>{hints.columnUploadedAt}</TableHead>
            <TableHead className="text-right">{hints.columnAction}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc, index) => (
            <TableRow key={`${doc.question_key}-${index}`}>
              <TableCell className="font-medium">{doc.question_label}</TableCell>
              <TableCell>{formatUploadedAt(doc.uploaded_at, locale)}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.url)}
                >
                  {hints.download}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
