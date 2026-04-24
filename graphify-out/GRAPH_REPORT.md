# Graph Report - C:\Users\ieq3q\carvver  (2026-04-24)

## Corpus Check
- 118 files · ~8,195,071 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 718 nodes · 1011 edges · 69 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]

## God Nodes (most connected - your core abstractions)
1. `normalizeText()` - 19 edges
2. `getSignedInProfile()` - 16 edges
3. `fetchOrderDetail()` - 14 edges
4. `saveFreelancerServiceListing()` - 11 edges
5. `buildPhilippinesLocationLabel()` - 11 edges
6. `getPublicUrl()` - 10 edges
7. `normalizePayoutReleaseRequest()` - 8 edges
8. `submitFreelancerOrderDelivery()` - 8 edges
9. `normalizeServicePost()` - 8 edges
10. `useCart()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `SignIn()` --calls--> `resolveFeaturedCategoryIntent()`  [INFERRED]
  C:\Users\ieq3q\carvver\src\components\Auth\pages\sign-in.jsx → C:\Users\ieq3q\carvver\src\lib\featuredCategoryIntent.js
- `SignUpSuccess()` --calls--> `resolveFeaturedCategoryIntent()`  [INFERRED]
  C:\Users\ieq3q\carvver\src\components\Auth\pages\sign-up-success.jsx → C:\Users\ieq3q\carvver\src\lib\featuredCategoryIntent.js
- `SignUp()` --calls--> `resolveFeaturedCategoryIntent()`  [INFERRED]
  C:\Users\ieq3q\carvver\src\components\Auth\pages\sign-up.jsx → C:\Users\ieq3q\carvver\src\lib\featuredCategoryIntent.js
- `resolveAuthenticatedProfile()` --calls--> `resolveProfileRole()`  [INFERRED]
  C:\Users\ieq3q\carvver\src\components\Backend\authRouteState.js → C:\Users\ieq3q\carvver\src\lib\customerOnboarding.js
- `useCart()` --calls--> `DashBar()`  [INFERRED]
  C:\Users\ieq3q\carvver\src\components\Dashboard\hooks\useCart.js → C:\Users\ieq3q\carvver\src\components\Dashboard\layout\dashbar.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (49): CustomerRequestDetail(), FreelancerOrders(), acceptRequestProposal(), buildDeliveryAssetError(), buildProfileInitials(), buildProfileName(), confirmOrderCompletion(), createFreelancerOrderUpdate() (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (29): finalizeSuccessfulCheckoutSession(), updateCheckoutSession(), extractBearerToken(), buildDisplayName(), buildReceiptPdf(), buildSessionResponse(), drawReceiptText(), enforceReceiptPdfAscii() (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (17): deriveInitialValues(), deriveInitialValues(), coercePhilippinesLocation(), filterLocationOptions(), findBarangay(), findCity(), findRegion(), getBarangaysByRegionCity() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (26): deriveProfileNames(), ensureProfileForSession(), getAvatarUrl(), getProfile(), getProfileById(), getSession(), readResolvedAdminEmail(), requestEmailChange() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (17): getPublicServiceMediaUrl(), formatPeso(), getPublicServiceMediaUrl(), ServiceResultCard(), CustomerOrders(), getPublicServiceMediaUrl(), getPublicUrl(), fetchAchievementUnlockMap() (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (20): BrowseCategories(), CustomerFreelancerProfile(), CustomerServiceDetail(), formatPeso(), packagesMatchCartItem(), FavBook(), FavCard(), getCategoryIcon() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (19): DashboardFreelancer(), FreelancerBrowseRequests(), FreelancerProfile(), FreelancerRequestDetail(), FreelancerSettings(), getFileExtension(), sanitizeFileName(), uploadAvatarFile() (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (16): buildCategoryPath(), clearFeaturedCategoryIntent(), getFeaturedCategoryFromSearch(), getFeaturedCategoryIntent(), getIntentStorage(), normalizeFeaturedCategory(), persistFeaturedCategoryFromSearch(), resolveFeaturedCategoryIntent() (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (26): buildServicePayload(), createFreelancerServiceListing(), deleteFreelancerDraft(), ensureFreelancerPayoutDestinationReady(), fetchFreelancerListingForEdit(), fetchOwnedServices(), fetchServiceMedia(), fetchServicePackages() (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (19): buildAbsoluteUrl(), buildShareLinks(), NewsFeedPageContent(), buildPhilippinesLocationLabel(), buildFreelancerTasks(), buildCounterpartMeta(), buildDisplayName(), buildInitials() (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (8): CartLineItem(), CartPage(), CustomerPayment(), PaymentOverview(), resolvePaymentCopy(), resolvePaymentTitle(), formatPeso(), ListingResultCard()

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (9): getCustomerDisplayName(), getCustomerInitials(), getCustomerRealName(), formatPeso(), normalizeRelation(), RecommendedServiceCard(), Profile(), ProfileAchievements() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (11): DashBar(), NotificationPreviewItem(), FreelancerDashBar(), NotificationPreviewItem(), NotificationRow(), NotifPage(), formatNotificationTime(), normalizeStoredNotification() (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (6): CustomerSettings(), fetchBillingHistory(), fetchBillingProfile(), normalizeBillingHistory(), normalizeBillingProfile(), useCustomerAccountSettings()

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (14): DashboardCustomer(), buildCalendarDays(), createDateFromValue(), formatDateKey(), formatDeadlineValue(), formatMonthLabel(), getTodayDateValue(), PostRequest() (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (9): formatConversationStarted(), formatFileSize(), MessageBubble(), MessagesWorkspace(), MessageThreadButton(), enrichAttachmentMessages(), fetchThreadMessages(), formatConversationTime() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (15): clearCustomerWelcomeDestination(), clearDestination(), clearFreelancerWelcomeDestination(), getCustomerWelcomeDestination(), getDestination(), getFreelancerWelcomeDestination(), hasOwn(), isBrowser() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (5): AppRoutes(), BrandPageShell(), HomePage(), useCustomerBrandShell(), useRouteShellFamily()

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (2): ServiceCard(), getCategoryIcon()

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.2
Nodes (2): FoundersBand(), getFounderInitials()

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (3): DashboardFrame(), EmptySurface(), cn()

### Community 22 - "Community 22"
Cohesion: 0.31
Nodes (3): calculateFreelancerNet(), calculatePlatformFee(), roundCurrency()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (6): buildBadge(), buildCustomerAchievementMetrics(), buildOrderMetrics(), buildReviewMetrics(), buildSavedMetrics(), makeAchievement()

### Community 24 - "Community 24"
Cohesion: 0.36
Nodes (4): buildAcceptedDeliveryAssetTypes(), formatFulfillmentLabel(), formatPayoutState(), FreelancerOrderDetail()

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.38
Nodes (3): CustomerOrderDetail(), formatFulfillmentLabel(), formatPayoutState()

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 0.47
Nodes (3): AdminReview(), formatFulfillmentLabel(), formatPayoutState()

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 0.6
Nodes (5): navigateToHomeSection(), navigateToPublicRoute(), resolveBehavior(), scrollToSectionId(), scrollWindowToTop()

### Community 33 - "Community 33"
Cohesion: 0.8
Nodes (4): buildSmokeReceiptPdf(), drawReceiptText(), enforceReceiptPdfAscii(), toReceiptPdfText()

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 0.5
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 0.5
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (2): HomeTwo(), wrap()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (2): formatPeso(), FreelancerListingPreview()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (1): createClient()

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 45`** (2 nodes): `vite.config.js`, `getManualChunkName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `AdminRoute()`, `AdminRoute.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `CustomerRoute.jsx`, `CustomerRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `CustomerWelcomeRoute.jsx`, `CustomerWelcomeRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `FreelancerRoute.jsx`, `FreelancerRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `FreelancerWelcomeRoute.jsx`, `FreelancerWelcomeRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `ProtectedRoute.jsx`, `ProtectedRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `customer_messages.jsx`, `CustomerMessages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `dashboard_aboutUs.jsx`, `DashboardAboutUs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `freelancer_messages.jsx`, `FreelancerMessages()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `home_backdrop.jsx`, `HomeBackdrop()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `home.jsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `home_one.jsx`, `HomeOne()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `splash_screen.jsx`, `SplashScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `cartSync.js`, `emitCartUpdated()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `countries.js`, `filterCountries()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `profileSync.js`, `emitProfileUpdated()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `main.jsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `customerBadgeMedia.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `customerProfileConfig.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `types.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `buildPhilippinesLocationLabel()` connect `Community 9` to `Community 0`, `Community 2`, `Community 5`, `Community 6`, `Community 11`, `Community 23`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **Why does `getPublicUrl()` connect `Community 4` to `Community 10`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `normalizeProposal()` connect `Community 0` to `Community 9`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `buildPhilippinesLocationLabel()` (e.g. with `buildFreelancerTasks()` and `normalizeRequest()`) actually correct?**
  _`buildPhilippinesLocationLabel()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._