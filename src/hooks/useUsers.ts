import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { mapKeysDeep, snakeToCamelCase } from "../utils";

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
