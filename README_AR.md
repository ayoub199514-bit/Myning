# Myning — قالب تجريبي متصل بـ Firebase

المشروع يستخدم Firebase **Authentication** و**Cloud Firestore** و**Cloud Functions** في المشروع `myning-f9cc2`. الواجهة عربية ومتجاوبة مع الهاتف.

## ما أُضيف
- إنشاء حساب بالبريد وكلمة المرور وتسجيل الدخول.
- إنشاء مستند `users/{uid}` ومعرّف عام يبدأ بـ `MN`.
- رصيد **تجريبي فقط** يبدأ من صفر.
- لوحة مدير تبحث بالمعرّف وتعدّل الرصيد التجريبي من خلال Cloud Functions مع سجل `balanceAudit`.
- طلبات إيداع تحفظ في `depositRequests` بحالة `pending_review` ولا تضيف رصيدًا.
- `firebase.json` و`.firebaserc` مهيآن للاستضافة من ملفات الجذر وربط المشروع الموجود.

## الخطوات المطلوبة لتشغيله
1. من Firebase Console للمشروع `myning-f9cc2`، فعّل Authentication → Sign-in method → Email/Password.
2. تأكد أن Cloud Firestore مفعّل.
3. من جهاز موثوق عليه Node.js، ثبّت Firebase CLI وسجّل الدخول. افتح مجلد المستودع بعد تنزيله، ثم نفّذ:
   - `firebase use myning-f9cc2`
   - راجع `firebase.json` و`firestore.rules` قبل النشر.
   - `firebase deploy --only firestore:rules,functions,hosting`
4. نشر Cloud Functions قد يتطلب تفعيل خطة الفوترة المناسبة في Firebase/Google Cloud. راجع الأسعار وحدود الاستخدام قبل التفعيل.
5. بعد النشر، يعرض أمر Firebase Hosting رابط الموقع. رفع الملفات إلى GitHub وحده لا ينشر Cloud Functions ولا قواعد Firestore.

**تحذير:** قواعد Firestore هنا قواعد بداية صارمة. إذا كان المشروع يحتوي على قواعد أو مجموعات مستخدمة من تطبيق آخر، ادمج القواعد بعناية بدل استبدالها دون مراجعة.

## منح صلاحية المدير
لا يوجد زر داخل الواجهة لمنح صلاحية المدير. يجب منح custom claim من بيئة إدارية موثوقة فقط، بعد إنشاء حساب المدير في Authentication. مثال Node.js محلي على جهاز موثوق باستخدام Firebase Admin SDK وبيانات اعتماد خدمة محمية:

```js
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
initializeApp({ credential: applicationDefault(), projectId: 'myning-f9cc2' });
getAuth().setCustomUserClaims('UID_المدير', { admin: true });
```

شغّل المثال من بيئة آمنة ومصرّح بها مع إعداد Application Default Credentials؛ لا تضع ملف service account أو أي أسرار في GitHub أو في واجهة الموقع. بعد التغيير، سجّل الخروج والدخول مجددًا.

## Binance Pay / USDT
هذا القالب **لا يتصل بـ Binance Pay API ولا يتحقق تلقائيًا من التحويلات**. طلب الإيداع مجرد طلب مراجعة؛ لا تعتبره مدفوعًا ولا تضف رصيدًا حقيقيًا بناء على مرجع يكتبه المستخدم أو صورة. التفعيل التلقائي يتطلب حساب تاجر مؤهلًا، إعدادًا رسميًا من Binance، تحققًا خادميًا من الإشعارات/الطلبات وفق الوثائق الرسمية، ومنع تكرار معالجة المعاملة. لا توجد مفاتيح دفع سرية في ملفات الواجهة.

## بنية Firestore
- `users/{uid}`: `uid`, `publicId`, `displayName`, `email`, `demoBalance`
- `balanceAudit/{id}`: سجل تعديلات المدير التي ينفذها الخادم
- `depositRequests/{id}`: طلبات الدفع، تبدأ `pending_review`

هذا قالب تأسيسي؛ اختبره في بيئة تجريبية قبل إطلاقه للمستخدمين. لا تعرض الرصيد التجريبي باعتباره أموالًا حقيقية أو قابلة للسحب.
