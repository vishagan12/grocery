--
-- =====================================================================
-- Seed File: supabase/seed-thanglish-aliases.sql
-- Description: Precomputed Thanglish and colloquial search aliases for products.
-- Generated: 2026-10-30T16:47:04.268Z
-- Zero live DB connection used during generation.
-- =====================================================================

BEGIN;

UPDATE public.products SET search_aliases = 'ponni poni boiled boiledh rice rrice arisi arrisi ponny pony puzhungal arisi pulungal arisi puzungal arisi puzhungal arrisi boiled rice boiledh rice boiled rrice pulungal arrisi' WHERE id = 'ponni-boiled-rice';
UPDATE public.products SET search_aliases = 'india indhia gate gathe basmati basmathi rice rrice arisi arrisi' WHERE id = 'india-gate-basmati';
UPDATE public.products SET search_aliases = 'special idli idhli rice rrice arisi arrisi idli arisi idhli arisi idli arrisi idly rice idhly rice idly rrice itli arisi ithli arisi itli arrisi' WHERE id = 'idli-rice';
UPDATE public.products SET search_aliases = 'aashirvaad aashirvaadh ashirvad aashirrvaad whole wheat wheath atta aththa ata gothumai gotumai godhumai godumai' WHERE id = 'aashirvaad-atta';
UPDATE public.products SET search_aliases = 'tata thatha iodized iodhizedh salt salth uppu upu' WHERE id = 'tata-salt';
UPDATE public.products SET search_aliases = 'udhaiyam udaiyam toor thoor tur toorr dal dhal yellow yelow lentils lenthils paruppu parupu parruppu parrupu toor dal thoor dal toor dhal tur dal toorr dal thuvaram paruppu tuvaram paruppu thuvaram parupu thuvarram parruppu tuvaram parupu tuvarram parrupu' WHERE id = 'udhaiyam-toor-dal';
UPDATE public.products SET search_aliases = 'urad uradh urrad dal dhal white whithe whole paruppu parupu parruppu parrupu urad dal uradh dhal urrad dal ulutham paruppu ulutam paruppu ulutham parupu ulutham parruppu ulundu ulundhu' WHERE id = 'urad-dal';
UPDATE public.products SET search_aliases = 'yellow yelow moong mung dal dhal paruppu parupu parruppu parrupu' WHERE id = 'moong-dal';
UPDATE public.products SET search_aliases = 'roasted roasthed roastedh rroasted gram grram pottukadalai poththukadalai pottukadhalai potukadalai pottukkadalai' WHERE id = 'pottukadalai';
UPDATE public.products SET search_aliases = 'aachi achi pure purre turmeric thurmeric turrmerric powder powdher powderr manjal manchal manjal thool manjal tool manjal thul turmeric powder thurmeric powder turmeric powdher turrmerric powderr' WHERE id = 'aachi-turmeric-powder';
UPDATE public.products SET search_aliases = 'gold goldh winner winer winnerr sunflower sunflowerr oil ennai enai yennai yenai' WHERE id = 'gold-winner-oil';
UPDATE public.products SET search_aliases = 'idhayam idayam sesame gingelly gingely oil nallennai nalenai gingelly oil gingely oil sesame oil' WHERE id = 'idhayam-gingelly-oil';
UPDATE public.products SET search_aliases = 'grb grrb pure purre cow ghee ghi nei ney' WHERE id = 'grb-ghee';
UPDATE public.products SET search_aliases = 'klf kklf pure purre coconut coconuth oil ennai enai yennai yenai thengai ennai tengai ennai thengai enai coconut oil coconuth oil thengai tengai' WHERE id = 'coconut-oil';
UPDATE public.products SET search_aliases = 'aavin avin full ful cream crream milk milkk paal pal' WHERE id = 'aavin-milk';
UPDATE public.products SET search_aliases = 'farm farrm fresh frresh country counthry countrry eggs egs muttai muththai mutai muthai egg eg' WHERE id = 'country-eggs';
UPDATE public.products SET search_aliases = 'milky milkky mist misth fresh frresh paneer panir paneerr panirr' WHERE id = 'milky-mist-paneer';
UPDATE public.products SET search_aliases = 'aavin avin premium prremium fresh frresh curd curdh currd thayir tayir thayirr yogurt yogurth yogurrt' WHERE id = 'aavin-curd';
UPDATE public.products SET search_aliases = 'small smal onions sambar sambarr vengayam vengaayam onion vengaiyam chinna vengayam china vengayam shallots shalloths shalots sambar onion sambarr onion' WHERE id = 'small-onions';
UPDATE public.products SET search_aliases = 'fresh frresh country counthry countrry tomatoes thomathoes thakkali takkali thakali takali thakkaali takkaali thakaali tomato thomatho' WHERE id = 'country-tomatoes';
UPDATE public.products SET search_aliases = 'fresh frresh farm farrm potatoes pothathoes urulaikizhangu urulaikilangu urulaikizangu urrulaikizhangu urulaikkizhangu urrulaikilangu urulaikkilangu potato pothatho urulai urrulai' WHERE id = 'potatoes';
UPDATE public.products SET search_aliases = 'fresh frresh nendran nendhran nendrran bananas' WHERE id = 'nendran-banana';
UPDATE public.products SET search_aliases = 'fresh frresh curry cury leaves karuveppilai karuvepilai karruveppilai kkaruveppilai' WHERE id = 'fresh-curry-leaves';
UPDATE public.products SET search_aliases = 'spicy green grin grreen chillies chilies pachai milagai pachai milagai green chilli grin chilli green chili grreen chilli pacha milakai pacha milakkai milakai milakkai chilli chili mirchi mirrchi' WHERE id = 'fresh-green-chillies';
UPDATE public.products SET search_aliases = 'britannia brithannia britania brritannia marie marrie gold goldh biscuits biscuiths biscuit biscuith cookies cukies cookkies' WHERE id = 'britannia-marie-gold';
UPDATE public.products SET search_aliases = 'special madras madhras madrras mixture mixthure mixturre' WHERE id = 'madras-mixture';
UPDATE public.products SET search_aliases = 'traditional thradithional tradhitional trraditional butter buthther buter butterr murukku muruku murrukku vennai venai' WHERE id = 'butter-murukku';
UPDATE public.products SET search_aliases = 'sunfeast sunfeasth dark dhark darrk darkk fantasy fanthasy choco fills fils' WHERE id = 'dark-fantasy';
UPDATE public.products SET search_aliases = 'bru brru instant insthanth coffee coffi cofee powder powdher powderr kaapi kapi kkaapi kaapi thool kaapi tool kaapi thul kapi thool kkaapi thool' WHERE id = 'bru-coffee';
UPDATE public.products SET search_aliases = 'roses rroses natural nathural naturral care carre tea thea' WHERE id = '3-roses-tea';
UPDATE public.products SET search_aliases = 'boost boosth bust energy enerrgy health healt drink dhrink drrink drinkk' WHERE id = 'boost-health-drink';
UPDATE public.products SET search_aliases = 'natural nathural naturral tender thender tendher tenderr coconut coconuth water wather waterr' WHERE id = 'tender-coconut-water';
UPDATE public.products SET search_aliases = 'surf surrf excel matic mathic front fronth frront top thop load loadh' WHERE id = 'surf-excel-matic';
UPDATE public.products SET search_aliases = 'vim lemon dishwash dhishwash liquid liquidh gel' WHERE id = 'vim-dishwash';
UPDATE public.products SET search_aliases = 'cycle three tree thri thrree one agarbatti agarbaththi agarbati agarrbatti' WHERE id = 'cycle-agarbatti';
UPDATE public.products SET search_aliases = 'pure purre temple themple grade gradhe grrade camphor camphorr karpooram karpuram karrpoorram kkarpooram' WHERE id = 'camphor-karpooram';

COMMIT;
