import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReviewsTabHints, TalentReviewByService } from '@/features/talents/detail/types';

type Props = {
  reviews: TalentReviewByService[];
  hints: ReviewsTabHints;
};

const EMPTY_PLACEHOLDER = '—';

function formatRating(
  ratingAvg: number,
  ratingCount: number,
  reviewsCountTemplate: string,
): string {
  if (ratingCount === 0) {
    return `★ ${EMPTY_PLACEHOLDER}`;
  }
  const countLabel = reviewsCountTemplate.replace('[count]', String(ratingCount));
  return `★ ${ratingAvg.toFixed(1)} ${countLabel}`;
}

export function ReviewsTab({ reviews, hints }: Props): JSX.Element {
  if (reviews.length === 0) {
    return <p className="text-muted-foreground py-12 text-center">{hints.empty}</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{hints.columnService}</TableHead>
            <TableHead>{hints.columnRating}</TableHead>
            <TableHead className="text-right">{hints.columnCompletedOrders}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.service_id}>
              <TableCell className="font-medium">
                {review.service_name ?? EMPTY_PLACEHOLDER}
              </TableCell>
              <TableCell>
                {formatRating(review.ratingAvg, review.ratingCount, hints.reviewsCount)}
              </TableCell>
              <TableCell className="text-right">{review.completedOrdersCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
