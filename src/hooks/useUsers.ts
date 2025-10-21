import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
const supabaseUrl = "https://fabxmporizzqflnftavs.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYnhtcG9yaXp6cWZsbmZ0YXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIyNDQ5MTIsImV4cCI6MjAzNzgyMDkxMn0.UIEJiUNkLsW28tBHmG-RQDW-I5JNlJLt62CSk9D_qG8";
const supabase = createClient(supabaseUrl, supabaseKey);

function snakeToCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

const mapKeysDeep = (obj: Json, fn: (key: string) => string): Json =>
  Array.isArray(obj)
    ? obj.map((item) => mapKeysDeep(item, fn))
    : obj && typeof obj === "object"
      ? Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [fn(k), mapKeysDeep(v, fn)])
        )
      : obj;

type CAAccount = {
  accountId: string;
  createdVia: string;
  username: string;
  createdAt: string;
  accountDisplayName: string;
  numTweets: number;
  numFollowing: number;
  numFollowers: number;
  numLikes: number;
  updatedAt: string;
  profile: {
    accountId: string;
    bio: string;
    website: string;
    location: string;
    avatarMediaUrl: string;
    headerMediaUrl: string;
    archiveUploadId: string;
    updatedAt: string;
  };
};

type Result = CAAccount[];

export const useCommunityArchiveAccounts = () => {
  const [accounts, setAccounts] = useState<null | Result>(null);
  useEffect(() => {
    async function getAccounts() {
      const { data } = await supabase
        .schema("public")
        .from("account")
        .select("*, profile(*)")
        .order("num_followers", { ascending: false });

      console.log(data);
      // field names in the community archive are in snake case, while the twitter archive uses camel case
      setAccounts(
        data ? (mapKeysDeep(data, snakeToCamelCase) as Result) : null
      );
    }
    getAccounts();
  }, []);

  return accounts;
};
