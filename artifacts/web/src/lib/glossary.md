# د پروژې د اصطلاحاتو ثبت (Terminology Glossary)

**قانون:** په ټول اپلیکیشن کي باید یوازي دلته ذکر شوي پښتو اصطلاحات وکارول شي. د انګلیسي کلمو کارول (که په انګلیسي تورو وي که په پښتو تورو لیکل شوي وي) بالکل منع دي — د مثال په توګه "دشبورډ" پرځای "کورپاڼه"، "کهاته" پرځای "Ledger" نه لیکل کیږي. دا فایل د ټولو subagent-ونو او راتلونکو بدلونونو لپاره یوازینی مرجع ده.

## عمومي جوړښت
| مفهوم | پښتو اصطلاح |
|---|---|
| Dashboard | کورپاڼه |
| Login | لاګین فارم (already Pashto-adjacent per طرحه, keep as-is — طرحه itself uses "لاګین فارم") |
| Sidebar/Menu | مینو |
| Settings | تنظیمات |
| Users | کاروونکي |
| Roles | رولونه |
| Audit Log / change history | د بدلونونو راپور |
| Search | لټون |
| Print | چاپ |
| Save/Register | ثبت کول |
| Edit | سمول |
| Delete | ړنګول |
| Active/Inactive | فعال / غیر فعال |
| Balance | الباقی |
| Total | ټوټل / جمله |
| Receivable (customer owes company) | طلب |
| Payable (company owes customer) | پور |

## روزنامچه (Daily Cash Journal)
Columns exactly as legacy system: تاریخ، تفصیل، داخل (+)، خروج (-)، الباقی
- Currency tabs: افغانۍ (AFN) / ډالر (USD) / کلدار (PKR)
- هر ورکړه/رسید باید اتومات د مربوطه مشتری کهاتې ته لاړ شي

## کهاتې (Ledgers) — عمومي جوړښت
Every ledger/statement page must carry: د شروع نیټه / د ختم نیټه (date range), لټون (search), چاپ (print), and a طلب/پور summary block at the end.

### د بازار/انفرادي مشتریانو کهاته
شمیره، تاریخ، تفصیل، پیسي، رسید، الباقی حساب

### د اجناسو د خریداري مشتریان (Purchase ledger)
شمیره، تاریخ، تفصیل، بیل نمبر، تعداد، قیمت، مجموع، رسید، الباقی

### د واپسۍ بیل (Purchase returns)
شمیره، تاریخ، تفصیل، بیل نمبر، تعداد، قیمت، مجموع

### فروشات (Sales / unit sale ledger)
نوم، پلار نوم، نیکه نوم، تذکره نمبر، تماس شمیره، خرڅ تاریخ، بلاک آيډي، منزل، کور نمبر، اطاقونو تعداد، اصلي قیمت، وصول، الباقی، اسنادونه

### صرافي (Money exchange / Sarafi ledger)
تاریخ، تفصیل، صراف ته جمع، رسیده، الباقی

### مصارفات (Expenses)
شمیره، تاریخ، تفصیل، پیسي (with د مصرف نوعیت categorization: د دفتر مصرف، اشپزخانی مصرف، د کار د ساحې مصرف، ...)

### کارکوونکي حاضري (Attendance)
شمیره، آيډي نمبر، نوم، د پلار نوم، وظیفه، تماس شمیره، حاضر، غیر حاضر

### د کارکوونکي کهاته (Employee ledger)
تاریخ، تفصیل، حاضري پیسي، غیر حاضري پیسي، رسیده پیسي، د ورځي تعداد، الباقی حساب
- Footer per month: د تیري میاشتي زوړ حساب، اوسنۍ میاشت حساب، موجوده الباقی حساب

### د حاجي صاحب کهاته (Partner/investor ledger)
شمیره، تاریخ، تفصیل، پیسي، رسید، الباقی، ملاحظات

### شرکت عمومي راپور (General company report)
Sections per module (خریداري، فروشات، مصارفات، ...), each showing: جمله قرضداره، جمله رسید شوی، جمله الباقی

## پروژه/بلاک/دوکان
بلاک، منزل، کور/اطاق، دوکان (shop) — دوکان باید دوه فرعي برخي ولري: کرایه (rental) او فروش (sale)

## کرنسۍ (Currencies) — نومونه چي باید وکارول شي
افغانۍ (AFN) — ډالر (USD) — کلدار (PKR)
Do not display raw ISO currency codes (AFN/USD/PKR) to the user; always show the Pashto name. Codes may remain internal (DB values, API params) but never in visible UI text.

## نیټه (Dates)
No Gregorian/English calendar may ever be shown or entered in the UI. Always use the shared `JalaliDateInput` component for entry and `isoToJalaliString` for display (see `src/components/JalaliDateInput.tsx`, `src/lib/jalali.ts`). Month names are the Pashto Solar Hijri names in `PASHTO_MONTHS`.
