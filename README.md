# Algorithm Design — 4051

Course website for Dr. Marzieh Maleki Majd at IUST.

- Live website: https://rohamizadidoost.github.io/AD4051/
- Admin: https://rohamizadidoost.github.io/AD4051/admin/

## Editing

Open Admin Panel to edit course information, announcements, all 16 TA profiles, homework, quizzes, project, schedule, lectures, and materials. Photos are cropped to square and compressed locally. Save draft stores a private-to-this-browser draft; Publish updates the public site for everyone.

For publishing, create a fine-grained GitHub token restricted to this repository with Contents: Read and write permission. Connect to load the latest version, make changes, and publish. Tokens stay in memory and are never saved in local storage or the repository. GitHub enforces repository write access. Disconnect or close the tab to end the session. Concurrent edits are rejected rather than overwritten. Only put public course content in this public repository.

Alternatively edit `data/site.json` directly in GitHub. For assignment PDFs, upload files to the repository or another host and enter their URLs. Leave unknown dates and URLs blank. Export JSON downloads a backup that can replace `data/site.json` through GitHub.

## Local development

No build step or runtime dependencies. Run `python3 -m http.server 8080` in the repository and open http://localhost:8080. Do not open HTML as file:// because content is loaded with fetch.

GitHub Pages deploys the main branch root. Each navigation route has a real index.html and works on direct visits under the repository subpath.

## Design attribution

The layout, stylesheet, university emblem, and header texture are adapted from https://iust-deeplearning-4041.github.io/ (MIT license, retained in LICENSE). The original university header, fonts, colors, navigation, assignment list styling, and footer are preserved. The scrolling TA strip and content administration are additions for this course. Animation can be paused and respects reduced-motion preferences.

## Browser checks

Install Playwright (`npm install --no-save playwright` and `npx playwright install chromium`), start the local server, then run `node tests/browser.cjs`. Set `TEST_URL` to verify a deployed site. Checks cover every route, mobile navigation, the full TA roster, animation controls, draft persistence, photo processing, preview, and a mocked GitHub publishing contract. GitHub mutations in the browser check are intercepted; tests do not publish real content.

## Semester schedule

The schedule from `AD_4051 (1).xlsx` is imported as 18 weeks, 30 lectures, 14 TA sessions, and 13 homework/quiz windows. Dates retain the Persian calendar month/day values; the source does not explicitly state a calendar year. Merged assessment ranges are displayed as scheduled windows, not assumed deadlines. TA ranges identify their scheduled weeks, not exact class times. The final three weeks have no listed lectures; no exam dates are invented.

The importer reads only the `schedule` sheet and does not publish the workbook or student/grade sheets. To reimport: `python3 scripts/import_schedule.py '/path/to/workbook.xlsx'`. This replaces schedule entries and updates lecture listings and assessment window descriptions. Review the diff before publishing. All imported content remains editable through Admin Panel.
