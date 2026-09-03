import { test, expect, type Page } from "@playwright/test";
import { zipSync, strToU8 } from "fflate";

// Test-only people and responses. Every external request is intercepted; these
// tests never submit archives or generation requests to a real provider.
const account = (username = "alexexample") => ({
  username,
  accountId: username,
  accountDisplayName:
    username === "alexexample" ? "Alex Example" : "Sam Example",
  createdAt: "2020-01-01",
  email: "",
  createdVia: "web",
  fromArchive: true,
});
function archive(username = "alexexample") {
  const tweets = [
    { full_text: "I enjoy making tiny useful things and going for walks." },
    {
      full_text: "@friend A good walk solves almost anything.",
      in_reply_to_user_id: "friend",
    },
    { full_text: "RT @friend: More time for small projects." },
  ].map((tweet, index) => ({
    tweet: {
      ...tweet,
      id: `${username === "alexexample" ? 100 : 200}${index}`,
      id_str: `${username === "alexexample" ? 100 : 200}${index}`,
      created_at: `2026-08-0${index + 1}T12:00:00Z`,
      favorite_count: "1",
      retweet_count: "0",
      favorited: false,
      retweeted: false,
      truncated: false,
      lang: "en",
      source: "web",
      tweet_media: [],
      raw_json: "",
    },
  }));
  return Buffer.from(
    zipSync({
      "data/account.js": strToU8(
        `window.YTD.account.part0 = ${JSON.stringify([{ account: account(username) }])}`,
      ),
      "data/profile.js": strToU8(
        `window.YTD.profile.part0 = ${JSON.stringify([{ profile: { description: { bio: "A fictional test person.", website: "", location: "" }, avatarMediaUrl: "", headerMediaUrl: "" } }])}`,
      ),
      "data/tweets.js": strToU8(
        `window.YTD.tweets.part0 = ${JSON.stringify(tweets)}`,
      ),
    }),
  );
}
async function importArchive(page: Page, username = "alexexample") {
  await chooseFile(page, `${username}.zip`, archive(username));
  await expect(page.locator(".account-context")).toContainText(`@${username}`);
  await page.keyboard.press("Escape");
  await expect(page.locator(".mobile-sidebar-content")).toHaveCount(0);
}
async function chooseFile(page: Page, name: string, buffer: Buffer) {
  const upload = page
    .getByRole("button", { name: "Import my archive ↗", exact: true })
    .filter({ visible: true });
  if (!(await upload.count())) await openNavigation(page);
  const chooser = page.waitForEvent("filechooser");
  await upload.first().click();
  await (await chooser).setFiles({ name, mimeType: "application/zip", buffer });
}
async function openNavigation(page: Page) {
  const toggle = page.getByRole("button", { name: "Open navigation" });
  if (
    (await toggle.isVisible()) &&
    !(await page.locator(".mobile-sidebar-content").isVisible())
  ) {
    await toggle.click();
    await expect(page.locator(".mobile-sidebar-content")).toBeVisible();
  }
}
async function navigate(page: Page, name: string) {
  await openNavigation(page);
  await page
    .getByRole("link", { name, exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.locator(".mobile-sidebar-content")).toHaveCount(0);
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as Window & { copiedText?: string }).copiedText = text;
        },
      },
    });
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4173") return route.continue();
    if (url.hostname.endsWith("supabase.co"))
      return route.fulfill({ json: [] });
    return route.abort();
  });
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      document.fonts.check('500 35px "Fraunces Variable"'),
    ),
  ).toBe(true);
  await expect(
    page.getByRole("heading", { name: "What’s their deal?" }),
  ).toBeVisible();
});

test("community archive picker shows loading failures and allows retry", async ({
  page,
}) => {
  await page.route("**/rest/v1/account?**", (route) =>
    route.fulfill({
      json: [
        {
          account_id: "communityexample",
          username: "communityexample",
          num_tweets: 5,
          num_followers: 0,
          profile: null,
        },
      ],
    }),
  );
  let attempts = 0;
  await page.route("**/rest/v1/tweets?**", (route) => {
    attempts++;
    return route.fulfill({ status: 503, json: { message: "Test failure" } });
  });
  await page
    .getByRole("button", { name: "Choose someone ↗", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Load @communityexample, latest 10,000 posts",
    })
    .click();
  await expect(page.getByRole("alert")).toContainText("couldn’t be loaded");
  await page
    .getByRole("button", {
      name: "Load @communityexample, latest 10,000 posts",
    })
    .click();
  await expect.poll(() => attempts).toBe(2);
  await expect(page.getByRole("alert")).toContainText("couldn’t be loaded");
  await noOverflow(page);
});

test("empty state, theme persistence, and keyboard-accessible navigation", async ({
  page,
}, testInfo) => {
  await expect(
    page.getByRole("button", { name: /Ask Distill/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("#root > .radix-themes")).toHaveCSS(
    "background-color",
    "rgb(238, 232, 248)",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Choose someone ↗", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Who are you curious about?",
  );
  await page
    .getByRole("textbox", { name: "Search Community Archive users" })
    .fill("nobody");
  await expect(page.getByRole("dialog")).toContainText("No usernames match");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigate(page, "Past questions");
  await expect(
    page.getByText("No questions yet.", { exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("empty-light.png"),
    fullPage: true,
  });
});

test("archive selection stays in sync across screens, removal, and reload", async ({
  page,
}) => {
  await importArchive(page);
  await importArchive(page, "samexample");
  await openNavigation(page);
  await page
    .getByRole("button", { name: "Change person: @samexample" })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("button", { name: "Select @alexexample", exact: true })
    .click();
  // Choosing a person in the mobile drawer must not switch back on navigation.
  await page
    .getByRole("link", { name: "Make an avatar", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.locator(".account-context")).toContainText("@alexexample");
  await page.reload();
  await expect(page.locator(".account-context")).toContainText("@alexexample");
  await openNavigation(page);
  await page
    .getByRole("button", { name: "Change person: @alexexample" })
    .filter({ visible: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Remove @alexexample archive" })
    .click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.locator(".account-context")).toContainText("@samexample");
  await noOverflow(page);
});

test("questions, post filters, sources, saved answers and deletion", async ({
  page,
}, testInfo) => {
  await importArchive(page);
  let calls = 0;
  let requestBody = "";
  await page.route(
    "https://tweet-analysis-worker.raymond-a96.workers.dev/**",
    async (route) => {
      calls++;
      requestBody = route.request().postData() ?? "";
      await route.fulfill({
        json: {
          choices: [
            {
              message: {
                content:
                  "## A practical dreamer.\n\nAlex likes making useful things and taking walks. [1000](https://x.com/i/status/1000)\n\nA small impression, not a complete picture.",
              },
            },
          ],
          model: "mock-model",
          provider: "mock-provider",
          usage: { total_tokens: 42, prompt_tokens: 32, completion_tokens: 10 },
        },
      });
    },
  );
  await page.getByRole("button", { name: "Which posts?" }).click();
  await expect(
    page.getByRole("region", { name: "Choose posts" }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "Include replies" }).uncheck();
  await page.getByRole("checkbox", { name: "Include reposts" }).uncheck();
  await expect(page.locator(".scope-row")).toContainText("1 of 3 posts");
  await page.getByRole("button", { name: "Which posts?" }).click();
  await page
    .getByRole("button", { name: "What are they like?", exact: true })
    .click();
  expect(calls).toBe(0); // Suggestions fill the composer; only Ask submits.
  await expect(
    page.getByRole("textbox", { name: "Your question" }),
  ).not.toBeEmpty();
  await page.getByRole("button", { name: /Ask Distill/ }).click();
  await expect(
    page.getByRole("heading", { name: "A practical dreamer." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy answer" }).click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { copiedText?: string }).copiedText,
    ),
  ).toContain("A practical dreamer.");
  expect(calls).toBe(1);
  expect(requestBody).toContain("I enjoy making tiny useful things");
  expect(requestBody).not.toContain("RT @friend");
  expect(requestBody).not.toContain("@friend A good walk");
  await page.getByRole("button", { name: /The tweets behind this/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /Posts sent/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "I enjoy making tiny useful things",
  );
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /The tweets behind this/ }),
  ).toBeFocused();
  await noOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("answer-dark.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.screenshot({
    path: testInfo.outputPath("answer-light.png"),
    fullPage: true,
  });
  await navigate(page, "Past questions");
  await page.locator(".history-list a").click();
  await expect(
    page.getByRole("heading", { name: "A practical dreamer." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A practical dreamer." }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete this question" }).click();
  await expect(
    page.getByText("No questions yet.", { exact: true }),
  ).toBeVisible();
});

test("avatar generation, prompt reuse, rerender and per-person history", async ({
  page,
}, testInfo) => {
  await importArchive(page);
  const image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
  let textCalls = 0;
  let imageCalls = 0;
  await page.route(
    "https://tweet-analysis-worker.raymond-a96.workers.dev/**",
    async (route) => {
      const isImage = !!route.request().postDataJSON().params.modalities;
      if (isImage) imageCalls++;
      else textCalls++;
      await route.fulfill({
        json: {
          choices: [
            {
              message: {
                content:
                  "A playful green portrait inspired by walks and making things.",
                ...(isImage ? { images: [{ image_url: { url: image } }] } : {}),
              },
            },
          ],
          model: "mock-model",
          provider: "mock-provider",
          usage: { total_tokens: 42, prompt_tokens: 32, completion_tokens: 10 },
        },
      });
    },
  );
  await navigate(page, "Make an avatar");
  await expect(page.getByText("Nothing generated yet.")).toBeVisible();
  await page.getByRole("button", { name: "Generate avatar ↗" }).click();
  await expect(
    page.getByRole("img", { name: "Generated avatar for @alexexample" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show generated prompt" }).click();
  await expect(
    page.getByText(
      "A playful green portrait inspired by walks and making things.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Re-render image", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Previous avatars" }),
  ).toBeVisible();
  expect(textCalls).toBe(1);
  expect(imageCalls).toBe(2);
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("avatar-dark.png"),
    fullPage: true,
  });
  await navigate(page, "Ask something");
  await importArchive(page, "samexample");
  await navigate(page, "Make an avatar");
  await expect(page.getByText("Nothing generated yet.")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Generated avatar for @alexexample" }),
  ).toHaveCount(0);
});

test("invalid import and failed question are recoverable", async ({ page }) => {
  await chooseFile(page, "broken.zip", Buffer.from("not a zip"));
  await expect(page.getByRole("alert")).toContainText("couldn’t be imported");
  await importArchive(page);
  await page.route(
    "https://tweet-analysis-worker.raymond-a96.workers.dev/**",
    (route) =>
      route.fulfill({ status: 503, body: "Test provider unavailable" }),
  );
  await page
    .getByRole("textbox", { name: "Your question" })
    .fill("What do they enjoy?");
  await page.getByRole("button", { name: /Ask Distill/ }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Test provider unavailable",
  );
  await expect(page.getByRole("button", { name: /Ask Distill/ })).toBeEnabled();
});

test("month ranges, model selection, and browsing one person's tweets", async ({
  page,
}, testInfo) => {
  await importArchive(page);
  await importArchive(page, "samexample");
  await page.getByRole("button", { name: "Which posts?" }).click();
  await page.getByRole("radio", { name: "Choose dates" }).check();
  await page.getByLabel("From month").fill("2026-08");
  await page.getByLabel("Through month").fill("2026-08");
  await expect(page.locator(".scope-row")).toContainText(
    "3 of 3 posts · Selected dates",
  );
  await page.getByText("AI model", { exact: true }).click();
  await page.getByRole("combobox", { name: "Question model" }).click();
  await page.getByRole("option", { name: /Gemini.*Vertex/i }).click();
  await expect(
    page.getByText("Up to 7,500 posts with this model.", { exact: false }),
  ).toBeVisible();
  await noOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("filters-dark.png"),
    fullPage: true,
  });
  await page.locator(".account-context a").first().click();
  await page.getByRole("textbox", { name: "Search tweets" }).fill("walk");
  await expect(page).toHaveURL(/account_id=samexample/);
  await expect(page).toHaveURL(/search=walk/);
  await noOverflow(page);
});
