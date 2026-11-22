# SAVORUNE Manual Browser Test Plan

This document is the complete execution guide for a human tester or browser-testing agent. Run the scenarios in order because later tests depend on records created earlier.

## 1. Test objective

Validate the complete SAVORUNE rescue lifecycle across all roles:

```text
DONOR posts surplus
→ RECEIVER evaluates and claims it
→ RECEIVER chooses self-collection or opens it to volunteers
→ VOLUNTEER accepts when applicable
→ DONOR reads the handoff PIN to the assigned collector
→ ASSIGNED COLLECTOR enters the PIN and confirms collection
→ ASSIGNED COLLECTOR confirms delivery
→ IMPACT updates only after delivery
```

The test also verifies authentication, role isolation, safety information, matching, capacity, failure recovery, maps, responsive design, and administrator operations.

## 2. Required environment

1. Open a terminal in the project directory.
2. Install packages and validate the application:

   ```cmd
   cd A:\savorune
   npm.cmd install
   npm.cmd run typecheck
   npm.cmd run dev
   ```

3. Open `http://localhost:3000`.
4. Confirm `.env` has valid Clerk keys.
5. Confirm `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` belongs to a billing-enabled Google Cloud project and is authorized for `http://localhost:3000/*`.
6. Keep the development terminal visible and record unexpected server errors.

## 3. Test identities

Use the following genuine Clerk accounts. Passwords must be supplied through the test operator or secure agent secret storage; never commit passwords to this file.

| Session | Role | Email | Expected application identity |
|---|---|---|---|
| A | Administrator | `asishpraneethnamala@gmail.com` | Asish Praneeth Namala |
| B | Donor | `asishpraneethnamala+donor@gmail.com` | Meera Reddy / Tamarind Terrace |
| C | Receiver 1 | `asishpraneethnamala+receiver1@gmail.com` | Ravi Kumar / Hope Harvest Kitchen |
| D | Receiver 2 | `asishpraneethnamala+receiver2@gmail.com` | Sunita Rao / Sunrise Shelter Collective |
| E | Volunteer | `asishpraneethnamala+volunteer@gmail.com` | Asha Nair |

### Device verification

Clerk may display “You’re signing in from a new device.” This is expected when using a new browser profile, private window, or cleared cookie.

1. Open the verification email sent to the corresponding Gmail alias.
2. Enter the code in the same browser where sign-in started.
3. Keep that browser profile open so Clerk retains its trusted-device cookie.
4. Record a failure only if the code is correct and Clerk still refuses the sign-in.

## 4. Browser session layout

Use persistent, separate browser profiles. Avoid Incognito after the initial device verification.

| Browser/profile | Account |
|---|---|
| Chrome Profile A | Administrator |
| Chrome Profile B | Donor |
| Edge Profile C | Receiver 1 |
| Firefox Profile D | Receiver 2 |
| Chrome Profile E or another browser | Volunteer |

Set the volunteer window to approximately `390 × 844` to exercise the mobile workflow. Keep the other windows open simultaneously for polling and conflict tests.

## 5. Evidence requirements

For every scenario record:

- test-case ID;
- pass, fail, or blocked;
- browser and viewport;
- account used;
- relevant donation or pickup ID from the URL;
- screenshot before the action;
- screenshot after the action;
- visible error message for negative tests;
- browser console errors;
- unexpected server-terminal errors.

Never include passwords or handoff PIN values in screenshots, reports, logs, or Git commits. Blur PINs if a donor-screen screenshot is necessary.

---

# 6. Authentication and onboarding

## AUTH-01 — Public access

1. Open `/` while signed out.
2. Confirm the SAVORUNE name and “Every portion deserves a purpose” tagline are visible.
3. Open `/about` and `/impact`.
4. Attempt to open `/dashboard`.

Expected:

- public pages load without authentication;
- `/dashboard` redirects to Clerk sign-in;
- no private donation, pickup instruction, coordinate, user, or PIN appears publicly.

## AUTH-02 — Donor sign-in and onboarding

1. Sign in using Session B.
2. If redirected to onboarding, select `DONOR`.
3. Enter:

   ```text
   Name: Meera Reddy
   Organization: Tamarind Terrace
   Zone: H1 — HITEC City Central
   Default instructions: Collect from the marked service entrance using clean insulated containers.
   ```

4. Submit onboarding.
5. Sign out and sign back in.

Expected:

- the first completed onboarding opens the donor dashboard;
- the second sign-in skips onboarding;
- admin is not offered as a selectable role.

## AUTH-03 — Receiver onboarding

Repeat separately for Sessions C and D.

Receiver 1:

```text
Name: Ravi Kumar
Organization: Hope Harvest Kitchen
Type: Community Kitchen
Zone: H2 — Madhapur Arts District
Daily capacity: 60 kg
```

Receiver 2:

```text
Name: Sunita Rao
Organization: Sunrise Shelter Collective
Type: Shelter
Zone: H3 — Jubilee Hills Ridge
Daily capacity: 40 kg
```

Expected:

- both accounts open receiver-specific dashboards;
- their organization names and capacities remain separate.

## AUTH-04 — Volunteer onboarding

1. Sign in using Session E.
2. If onboarding appears, select `VOLUNTEER`.
3. Enter:

   ```text
   Name: Asha Nair
   Zone: H3 — Jubilee Hills Ridge
   Availability: Available for evening rescue runs across Hyderabad service zones.
   ```

4. Submit.

Expected: the volunteer sees the pickup workspace, not donor or receiver creation controls.

## AUTH-05 — Administrator sign-in

1. Sign in to Session A using Google.
2. Open `/dashboard`.

Expected:

- the account is `ADMIN` without public onboarding;
- platform analytics and user controls are visible;
- the user cannot accidentally create a second public role profile.

---

# 7. Donor posting and validation

## DON-01 — Publish the primary test donation

Use Session B and start a stopwatch.

1. Open `/donations/new`.
2. Enter:

   ```text
   Title: Veg Biryani and Mirchi Salan
   Category: Cooked Meal
   Diet: Vegetarian
   Quantity: 25 kg
   Estimated servings: 63
   Prepared at: a valid time in the recent past
   Pickup deadline: approximately 3 hours from now
   Storage: Hot held
   Allergen status: Declared
   Allergens: Dairy
   Instructions: Collect from the marked service entrance using clean insulated containers.
   ```

3. Read the handling notice.
4. Check the donor safety acknowledgment.
5. Publish.
6. Stop the stopwatch.

Expected:

- completion takes under 60 seconds after familiarity with the form;
- status is `POSTED`;
- a countdown is shown;
- the response includes eligible-receiver count and best score when eligible;
- the donation appears on the donor dashboard.

Record the donation URL and ID as `PRIMARY_DONATION_ID`.

## DON-02 — Form validation

Repeat submission attempts with one invalid field at a time:

1. quantity below `0.5 kg`;
2. deadline less than 30 minutes away;
3. deadline more than 12 hours away;
4. preparation time in the future;
5. declared allergen status with no selected allergen;
6. selected allergens while status is not declared;
7. phone number inside pickup instructions;
8. email address inside pickup instructions;
9. safety acknowledgment unchecked.

Expected: every invalid request is rejected with a useful message and no donation is created.

## DON-03 — Donor ownership

1. Copy the primary donation URL.
2. Open it as Receiver 1 and Volunteer before claim.
3. Attempt to locate donor cancellation controls.

Expected:

- only the owner donor or administrator can cancel;
- exact instructions remain hidden from an unassigned volunteer;
- the handoff PIN is absent before a pickup exists.

---

# 8. Matching and claim conflict

## MAT-01 — Receiver recommendation

Use Session C.

1. Open `/recommendations`.
2. Locate “Veg Biryani and Mirchi Salan.”
3. Confirm the card shows final score, distance, quantity, timing, and need/suitability factors.
4. Confirm the explanation is understandable without implementation terminology.
5. Open the donation.
6. Confirm deadline, storage, allergens, handling guidance, and safety disclaimer are visible.
7. Confirm private pickup instructions are hidden before claim.

Expected: only eligible, currently posted donations are actionable.

## MAT-02 — Prepare simultaneous claim

1. Open the primary donation in Session C.
2. Open the same donation in Session D before either receiver claims.
3. Keep both pages open.

Expected: both initially see an available donation because both loaded it while posted.

## MAT-03 — Receiver 1 claims

1. In Session C, select the claim action.
2. Review the complete safety information.
3. Check the receiver safety acknowledgment.
4. Confirm the claim.

Expected:

- donation changes to `CLAIMED`;
- a pickup is created with status `UNASSIGNED`;
- collector type is not selected yet;
- claimant now sees authorized pickup instructions;
- claim result does not ask for collector choice in the same request.

Record the pickup URL and ID as `VOLUNTEER_PICKUP_ID`.

## MAT-04 — Receiver 2 loses the conflict

1. In Session D, use the page opened before Receiver 1 claimed.
2. Attempt to claim it.

Expected:

- the request is rejected as already claimed;
- no second active claim or pickup is created;
- refreshing removes the donation from available recommendations.

---

# 9. Volunteer collection path

## VOL-01 — Receiver opens the pickup

Use Session C.

1. Open `/pickups/VOLUNTEER_PICKUP_ID`.
2. Confirm status is `UNASSIGNED` and no collector is selected.
3. Confirm two choices are visible:
   - `Receiver Self-Collect`
   - `Open to Volunteers`
4. Select `Open to Volunteers`.

Expected:

- collector type becomes `VOLUNTEER`;
- status remains `UNASSIGNED` until a volunteer accepts;
- the pickup becomes visible in the volunteer workspace;
- Receiver 1 cannot subsequently mark it self-collect after acceptance.

## VOL-02 — Volunteer sees and accepts

Use Session E.

1. Open `/pickups`.
2. Locate the open pickup.
3. Confirm deadline, quantity, donor zone, and receiver name are visible.
4. Confirm exact private instructions are hidden before acceptance.
5. Open the pickup.
6. Select `Accept Pickup`.

Expected:

- status becomes `ACCEPTED`;
- volunteer becomes the assigned collector;
- private pickup instructions become visible only after acceptance;
- another volunteer could no longer accept the same pickup.

## PIN-01 — Verify PIN visibility

The PIN has two different interfaces and two different responsibilities.

### Donor responsibility

1. In Session B, open the primary donation detail page.
2. Find `Handoff Verification PIN`.
3. Confirm a six-digit number is visible.
4. Do not paste the PIN into chat, screenshots, console, logs, or the test report.
5. The donor verbally reads this PIN to the assigned collector only after the collector arrives and the donor is ready to hand over food.

### Collector responsibility

1. In Session E, open `/pickups/VOLUNTEER_PICKUP_ID`.
2. Find `Enter 6-Digit Handoff PIN` under `Confirm Food Collection at Donor Kitchen`.
3. Confirm the PIN itself is not displayed to the volunteer.

Expected:

- donor owner and administrator may retrieve the PIN through authorized donation detail;
- receiver and volunteer responses do not reveal it;
- assigned collector receives only an input field.

## PIN-02 — Incorrect PIN

Use Session E.

1. Enter `000000`, unless that happens to be the real PIN; if so use `111111`.
2. Select `Confirm Food Collection`.

Expected:

- request is rejected;
- remaining attempts are shown;
- pickup stays `ACCEPTED`;
- donation stays `CLAIMED`;
- no impact metric changes.

Do not intentionally exhaust all attempts during the main happy-path run.

## PIN-03 — Correct PIN and collection

1. Ask the donor tester for the real PIN displayed in Session B.
2. Enter it in the collector field in Session E.
3. Select `Confirm Food Collection`.

Expected:

- pickup becomes `COLLECTED`;
- donation becomes `COLLECTED`;
- collection timestamp is recorded;
- PIN is cleared and cannot be reused;
- lifecycle history records collection without containing the PIN value.

## VOL-03 — Confirm delivery

Use Session E.

1. On the collected pickup, select `Confirm Safe Delivery Handover`.
2. Confirm the operation.

Expected:

- pickup becomes `DELIVERED`;
- donation becomes `DELIVERED`;
- claim becomes completed;
- delivery timestamp appears;
- repeated delivery is rejected.

---

# 10. Impact verification

## IMP-01 — Delivered-only calculation

1. Record platform impact before delivery.
2. Complete `VOL-03`.
3. Refresh `/impact`.

Expected:

- delivered donation count increases by one;
- rescued kilograms increase by `25 kg`;
- estimated meals reflect `25 × 1000 ÷ 400` and display as a rounded whole number;
- waste avoided is labeled as an estimate;
- methodology states that only delivered donations count;
- CO₂e remains absent unless an administrator configured a cited factor.

## IMP-02 — Incomplete records do not count

Create or retain one donation in each state where practical: `POSTED`, `CLAIMED`, `COLLECTED`, `EXPIRED`, and `CANCELLED`.

Expected: none changes delivered impact totals.

---

# 11. Receiver self-collection path

## SELF-01 — Create and claim a second donation

1. In Session B, create:

   ```text
   Title: Dal Rice and Seasonal Sabzi
   Category: Cooked Meal
   Diet: Vegetarian
   Quantity: 12 kg
   Servings: 30
   Deadline: approximately 3 hours from now
   Storage: Hot held
   Allergen status: Unknown
   ```

2. Claim it in Session C.
3. Record the new pickup ID as `SELF_PICKUP_ID`.

## SELF-02 — Select self-collection

1. In Session C, open `/pickups/SELF_PICKUP_ID`.
2. Select `Receiver Self-Collect`.

Expected:

- collector type becomes `RECEIVER`;
- pickup becomes `ACCEPTED` immediately;
- pickup never appears as an open volunteer pickup;
- Receiver 1 is now the assigned collector.

## SELF-03 — Receiver enters the PIN

This path still requires the donor handoff PIN.

1. In Session B, open the second donation and locate its six-digit PIN.
2. At simulated handover, the donor reads the PIN to the receiver representative.
3. In Session C, open `/pickups/SELF_PICKUP_ID`.
4. Enter the PIN in `Enter 6-Digit Handoff PIN`.
5. Select `Confirm Food Collection`.

Expected:

- receiver cannot confirm collection without the valid PIN;
- pickup and donation become `COLLECTED` after a correct PIN;
- PIN is cleared.

## SELF-04 — Receiver confirms delivery

1. In Session C, select `Confirm Safe Delivery Handover`.

Expected: donation and pickup become `DELIVERED`, and impact increases by the second donation’s quantity.

---

# 12. Withdrawal, cancellation, expiry, and recovery

## REC-01 — Volunteer withdrawal before collection

1. Create and claim a third valid donation.
2. Open it to volunteers.
3. Accept it in Session E.
4. Before collection, select `I can no longer complete this pickup`.
5. Enter a reason and confirm withdrawal.

Expected:

- volunteer assignment is removed;
- pickup returns to the open volunteer board when still valid;
- handoff PIN rotates;
- old PIN no longer works;
- reason appears in lifecycle history.

## REC-02 — Donor cancellation

1. Create another posted donation in Session B.
2. Cancel it with a meaningful reason.

Expected:

- donation becomes `CANCELLED`;
- it disappears from receiver recommendations;
- another role cannot cancel a donor-owned record by editing the URL or calling the action.

## REC-03 — Food unsuitable

When a pickup failure action is available, report `FOOD_UNSUITABLE` before collection.

Expected: donation becomes cancelled and is never re-offered.

## REC-04 — Expiry

1. Create a donation with the shortest permitted deadline.
2. Leave it unclaimed until the deadline passes, or use the authorized internal expiry job in a controlled test environment.
3. Refresh the donation and recommendations.

Expected:

- status becomes `EXPIRED`;
- it cannot be claimed;
- it is never returned to `POSTED`;
- expired PINs are cleared;
- impact does not change.

---

# 13. Eligibility edge cases

## ELG-01 — Capacity rejection

Create a donation larger than a receiver’s remaining daily capacity.

Expected:

- receiver is ineligible;
- direct claim attempt is rejected server-side;
- explanation states requested quantity and remaining capacity;
- capacity never goes below zero.

## ELG-02 — Diet rejection

Create a non-vegetarian donation and inspect it as Receiver 2, whose policy is vegetarian-only.

Expected: Receiver 2 is excluded with a dietary-policy explanation.

## ELG-03 — Allergen rejection

Create a donation declaring peanuts and inspect it as Receiver 2, whose profile avoids peanuts.

Expected: Receiver 2 is excluded with an allergen explanation.

## ELG-04 — Unknown allergen rejection

For a receiver with declared allergen avoidances, create a donation with unknown allergen status.

Expected: the receiver is excluded rather than silently treated as safe.

## ELG-05 — No eligible receivers

Create a valid but very large donation that no receiver can accommodate.

Expected:

- donation is still created as `POSTED`;
- donor sees aggregate exclusion categories and counts;
- receiver names and private capacities are not leaked;
- the interface does not claim that a receiver was matched.

---

# 14. Administrator tests

## ADM-01 — Platform monitoring

Use Session A.

1. Open `/dashboard`.
2. Confirm counts for users and donation statuses.
3. Confirm stuck or failed pickup sections use current records.
4. Confirm platform impact matches the delivered records from earlier scenarios.

## ADM-02 — Suspend and reactivate

1. Suspend a non-admin test user.
2. Attempt a protected workflow as that user.
3. Reactivate the user.
4. Retry.

Expected:

- suspended user is denied protected operations;
- reactivated user regains only their original role permissions.

## ADM-03 — Impact assumptions

1. Review grams-per-meal.
2. Change it only in a disposable test run.
3. Confirm estimated meal totals recalculate while recorded kilograms do not.
4. Leave CO₂e empty unless a real cited factor is supplied.

---

# 15. Maps and fallback

## MAP-01 — Google Maps enabled

1. Open onboarding or another screen containing the zone map.
2. Select H1, H2, and H3 in sequence.
3. Click visible zone circles.

Expected:

- map loads without billing, key, or referrer errors;
- selected zone is visually emphasized;
- information windows show synthetic zone labels;
- no personal address is displayed.

## MAP-02 — Map unavailable fallback

1. In a disposable local run, remove `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
2. Restart the development server.
3. Open onboarding.

Expected:

- a readable zone-list fallback appears;
- onboarding and core rescue workflows remain usable;
- restore the key after testing.

---

# 16. Authorization and privacy

## SEC-01 — Cross-role page access

Try donor, receiver, volunteer, and administrator routes from each role.

Expected:

- unauthorized actions are hidden in the interface;
- direct API or URL attempts return `401` or `403`;
- hiding a button is not the only protection.

## SEC-02 — Pickup-detail privacy

For one open and one assigned pickup, verify:

- unassigned volunteer sees only zone-level information;
- assigned volunteer sees operational instructions;
- unrelated volunteer receives forbidden access;
- claimant receiver sees their pickup;
- unrelated receiver cannot open it;
- donor sees only pickups belonging to their donations;
- administrator can inspect platform records;
- list endpoints never expose handoff PINs.

## SEC-03 — PIN attempt lock

Run only after the main happy path is complete.

1. Create a disposable pickup.
2. Enter an incorrect PIN repeatedly until the configured limit is reached.

Expected:

- each failed attempt decrements the remaining count;
- final failure locks PIN verification;
- status remains unchanged;
- administrator intervention is required;
- the real PIN is never returned in the error.

---

# 17. Responsive and usability checks

Run the donor post, receiver claim, volunteer accept, PIN entry, collection, and delivery actions at:

```text
360 × 800
390 × 844
768 × 1024
1440 × 900
```

Expected:

- no horizontal page scrolling;
- no clipped dialogs or inaccessible buttons;
- labels remain readable;
- countdowns and statuses have text, not color alone;
- keyboard focus is visible;
- forms work without a mouse;
- mobile PIN input opens a numeric keyboard;
- buttons remain large enough to tap reliably.

---

# 18. Final regression pass

After all tests:

1. Stop the development server.
2. Run:

   ```cmd
   npm.cmd run typecheck
   npm.cmd run build
   ```

3. Confirm the build includes:

   ```text
   /api/pickups/[id]
   /api/pickups/[id]/assign
   /api/pickups/[id]/status
   ```

4. Restart and smoke-test landing, sign-in, dashboard, donations, recommendations, pickups, and impact.
5. Confirm browser console contains no application errors.
6. Confirm Git does not stage `.env`, local runtime data, logs, `.next`, or test credentials.

## 19. Completion report template

```text
Environment:
Commit tested:
Tester/agent:
Date and timezone:
Browsers and versions:

Passed:
Failed:
Blocked:
Not run:

Critical defects:
High defects:
Medium defects:
Low defects:

Primary donation ID:
Volunteer pickup ID:
Self-collection pickup ID:

Donor → receiver claim: PASS/FAIL
Double-claim prevention: PASS/FAIL
Volunteer acceptance: PASS/FAIL
Incorrect PIN rejection: PASS/FAIL
Correct PIN collection: PASS/FAIL
Delivery completion: PASS/FAIL
Receiver self-collection with PIN: PASS/FAIL
Delivered-only impact: PASS/FAIL
Role isolation: PASS/FAIL
Responsive checks: PASS/FAIL
Production build: PASS/FAIL

Release recommendation: READY / READY WITH CONDITIONS / NOT READY
Notes:
```

## 20. Known architecture note

The current hackathon runtime uses the local JSON operational store, while the repository also contains Neon/Drizzle schema and real-user bootstrap records. Manual testing must state which persistence path was tested. Do not report Neon-backed end-to-end persistence as passed until route handlers use Drizzle repositories for their operational reads and writes.
