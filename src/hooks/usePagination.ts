import { useSearchParams } from "react-router";

export const usePagination = <T>({
  items,
  limit,
}: {
  items: T[] | null;
  limit?: number;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const offset = parseInt(searchParams.get("offset") || "0");
  limit = limit || 50;

  const canNavigateNext = items && offset + limit < items.length;
  const navigateNext = canNavigateNext
    ? () => {
        setSearchParams({ offset: `${offset + limit}` });
      }
    : undefined;
  const canNavigatePrevious = items && offset > 0;
  const navigatePrevious = canNavigatePrevious
    ? () => {
        const newOffset = offset - limit > 0 ? offset - limit : 0;
        setSearchParams({ offset: `${newOffset}` });
      }
    : undefined;

  const itemsToDisplay = items ? items.slice(offset, offset + limit) : null;
  return {
    itemsToDisplay,
    navigateNext,
    navigatePrevious,
  };
};
