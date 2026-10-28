# Myning — قالب تجريبي متصل بـ Firebase

المشروع يستخدم Firebase **Authentication** و**Cloud Firestore** و**Cloud Functions** في المشروع `myning-f9cc2`. الواجهة عربية ومتجاوبة مع الهاتف.

## ما يعمل في القالب
- إنشاء حساب بالبريد وكلمة المرور وتسجيل الدخول.
- إنشاء مستند `users/{uid}` ومعرّف عام يبدأ بـ `MN`.
- رصيد **تجريبي فقط** يبدأ من صفر.
- لوحة مدير تبحث بالمعرّف وتعدّل الرصيد التجريبي من خلال Cloud Functions موثوقة مع سجل `balanceAudit`.
- طلبات إيداع تحفظ في `depositRequests` بحالة `pending_review` ولا تضيف رصيدًا.

## نشر الملفات
1. فعّل Email/Password من Firebase Console → Authentication → Sign-in method.
2. تأكد من إنشاء Cloud Firestore في المشروع `myning-f9cc2`.
3. ارفع ملفات المستودع إلى GitHub. لتشغيل صفحات ES Modules، استخدم استضافة HTTPS مثل Firebase Hosting (GitHub Pages لا ينشر Cloud Functions أو قواعد Firestore).
4. ثبّت Firebase CLI على جهاز موثوق، وسجّل الدخول، ثم من مجلد المشروع شغّل:
   - `firebase init hosting firestore functions` (اختر المشروع الموجود `myning-f9cc2`، لا تنشئ مشروعًا جديدًا)
   - اجعل مجلد الاستضافة `public` وانسخ `index.html`, `styles.css`, `firebase.js`, `app.js`, `admin.html`, `admin.js`, `payments.html`, `payments.js` إلى `public/`.
   - ضع ملف `firestore.rules` في مسار القواعد الذي يحدده `firebase.json`، وملف `functions/` في مجلد functions.
   - انشر القواعد والوظائف والاستضافة بعد مراجعتها باستخدام `firebase deploy --only firestore:rules,functions,hosting`.
5. **مهم:** قواعد Firestore هنا قواعد بداية صارمة؛ ادمجها مع أي قواعد موجودة بدل استبدال قواعد تطبيق آخر دون مراجعة.

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
- `balanceAudit/{id}`: سجل التعديلات التي ينفذها المدير من الخادم
- `depositRequests/{id}`: طلبات الدفع، تبدأ `pending_review`

## ملاحظة
هذا قالب تأسيسي؛ اختبره في بيئة تجريبية قبل إطلاقه للمستخدمين. لا تعرض الرصيد التجريبي باعتباره أموالًا حقيقية أو قابلة للسحب.