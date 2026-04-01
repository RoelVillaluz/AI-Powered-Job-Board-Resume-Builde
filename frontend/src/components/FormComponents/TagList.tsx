type TagItem = {
  id?: string | number;
  label: string;
};

type TagListProps<T> = {
  items: T[];
  itemName: string;
  getLabel: (item: T) => string;
  getKey?: (item: T, index: number) => string | number;
  onRemove: (index: number) => void;
  emptyText?: string;
};

/**
 * Generic TagList component
 * -------------------------
 * Renders a list of removable "tag" items (chips) using a consistent UI.
 *
 * Designed to be reusable across different data types (e.g. certifications,
 * pre-screening questions, simple skill lists) by delegating how each item
 * is displayed via `getLabel`.
 *
 * @template T - The type of each item in the list
 *
 * @param items - The array of items to render
 * @param itemName - Display name for the list (e.g. "Certifications")
 * @param getLabel - Function that returns a string label for each item
 * @param getKey - Optional function to generate a unique key per item
 *                 (falls back to index if not provided)
 * @param onRemove - Callback fired when a tag's remove button is clicked
 *                   Receives the index of the item
 * @param emptyText - Optional message shown when the list is empty
 *
 * @example
 * // Simple string list (certifications)
 * <TagList
 *   items={certifications}
 *   itemName="Certifications"
 *   getLabel={(c) => c}
 *   onRemove={removeCertification}
 * />
 *
 * @example
 * // Object list (questions)
 * <TagList
 *   items={questions}
 *   itemName="Questions"
 *   getLabel={(q) => q.question}
 *   onRemove={removeQuestion}
 * />
 */
export const TagList = <T,>({
  items,
  itemName,
  getLabel,
  getKey,
  onRemove,
  emptyText,
}: TagListProps<T>) => {
  if (!items.length) {
    return emptyText ? <p className="text-muted">{emptyText}</p> : null;
  }

  return (
    <div className="flex flex-col items-start w-full" role="list">
        <p className="text-muted">
            {itemName} ({items.length})
        </p>
        <ul style={{ marginTop: '0.5rem' }}>
            {items.map((item, index) => {
                const label = getLabel(item);

                return (
                <div
                    key={getKey?.(item, index) ?? index}
                    className="skill-tag"
                    role="listitem"
                >
                    <span className="skill-tag__icon">•</span>
                    <span className="skill-tag__name">{label}</span>

                    <button
                        type="button"
                        className="skill-tag__remove"
                        onClick={() => onRemove(index)}
                        aria-label={`Remove ${label}`}
                    >
                    <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                );
            })}
        </ul>
    </div>
  );
};