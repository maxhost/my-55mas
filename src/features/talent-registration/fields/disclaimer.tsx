type Props = {
  content: string;
};

export function DisclaimerField({ content }: Props) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
      {content}
    </div>
  );
}
