import {
  contentTypeLabels,
  type ContentItemType,
} from "@/lib/library/content-library";

type ContentTypeBadgeProps = {
  type: ContentItemType;
};

export function ContentTypeBadge({ type }: ContentTypeBadgeProps) {
  return (
    <span
      className="content-type-badge inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold"
      data-content-type={type}
    >
      <span aria-hidden="true" className="content-type-dot" />
      {contentTypeLabels[type]}
    </span>
  );
}
