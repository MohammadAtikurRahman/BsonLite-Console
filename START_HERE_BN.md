# এখন শুধু app চালাও → Connect চাপো

## একবার SDK আপডেট

**Single-file app:** তোমার আগের `BsonLite.cjs` file-এর জায়গায় দেওয়া নতুন file বসাবে। আগের `require(...)`, database name/directory এবং `BsonLite.connect(...)` code একই থাকবে। আলাদা helper install বা নতুন connection code লাগবে না।

**npm app:** নিজের app-এর terminal-এ একবার:

```powershell
npm install bsonlite-sdk
```

প্রকাশিত `0.6.0-rc.3` package-এ automatic Console connection আছে। Offline file
থেকে install করতে চাইলে দেওয়া package-এর সঠিক path ব্যবহার করতে পারো:

```powershell
npm install "F:\Downloads\BsonLite-Easy-Connect\SDK\bsonlite-sdk-0.6.0-rc.3.tgz"
```

নিজের extract করা location অনুযায়ী path বদলাবে। এটি SDK update; আলাদা helper নয়।

## এরপর প্রতিবার

১. নিজের app আগের মতো চালাও ও চালু রাখো।
২. `BsonLite-Console-0.2.0-Windows-x64.exe` চালাও।
৩. চলমান database নিজে থেকেই dropdown-এ দেখা যাবে এবং URL বসে যাবে। **Connect** চাপো।

একাধিক app/database থাকলে dropdown থেকে বেছে নেবে। কোনো app চালু না থাকলে app চালু করতে বলবে; বন্ধ database বা PC-এর সব data folder নিজে খুলবে না। একই Windows account ব্যবহার করবে। Console বন্ধ করলেও মূল app বন্ধ হবে না।

Documents, filter/sort, JSON view, indexes এবং query console আগের মতো থাকবে। Insert/update/delete করতে Options থেকে Read-only বন্ধ করে Apply options চাপবে।

CLI ব্যবহার করলে একটি database চললে সেটি নিজে পাবে, একাধিক থাকলে list থেকে number বেছে নেবে।

প্রকাশিত SDK-এর native Windows engine দিয়ে automatic discovery, CLI, typed
query, read/write control ও shutdown পরীক্ষা পাস করেছে। Console-এর Windows
test ও portable build-ও পাস করেছে। নতুন 9.0 engine-এর পরীক্ষা আলাদাভাবে চলছে;
শুধু Console update করলে database engine বদলায় না। নতুন engine ব্যবহার করতে
চাইলে আগে [upgrade নির্দেশনা](https://github.com/MohammadAtikurRahman/BsonLite/blob/main/native/modern/UPGRADE_BN.md)
অনুসরণ করবে। বিস্তারিত [VALIDATION.md](VALIDATION.md)-এ আছে।
