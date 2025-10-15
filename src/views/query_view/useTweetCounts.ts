import { useMemo } from "react";
import type { Tweet } from "../../types";

export const useTweetCounts = (tweets: Tweet[] | undefined) => {
  const tweetCounts = useMemo(() => {
    if (!tweets) return [];

    // Group tweets by month
    const monthCounts = new Map<string, number>();
    let minDate = new Date();
    let maxDate = new Date(0);

    tweets.forEach((tweet) => {
      const date = new Date(tweet.created_at);
      if (date < minDate) minDate = date;
      if (date > maxDate) maxDate = date;

      // Group by month (YYYY-MM format)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    // Create array of all months in range
    const counts: { date: string; count: number }[] = [];
    if (tweets.length > 0) {
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

      while (current <= end) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        counts.push({
          date: `${monthKey}-01`, // Use first day of month for date input compatibility
          count: monthCounts.get(monthKey) || 0,
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return counts;
  }, [tweets]);

  return tweetCounts;
};
