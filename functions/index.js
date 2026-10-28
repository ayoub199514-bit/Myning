const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { randomUUID } = require("node:crypto");
initializeApp();
const db = getFirestore();
function requireAdmin(request) {
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "هذه العملية متاحة للمدير فقط.");
  }
}
exports.findUserByPublicId = onCall({ region: "asia-southeast1" }, async (request) => {
  requireAdmin(request);
  const publicId = String(request.data?.publicId || "").trim().toUpperCase();
  if (!/^MN[A-Z0-9]{5,12}$/.test(publicId)) throw new HttpsError("invalid-argument", "معرّف المستخدم غير صالح.");
  const snap = await db.collection("users").where("publicId", "==", publicId).limit(1).get();
  if (snap.empty) throw new HttpsError("not-found", "لم يتم العثور على المستخدم.");
  const doc = snap.docs[0], u = doc.data();
  return { user: { uid: doc.id, publicId: u.publicId, displayName: u.displayName || "", demoBalance: Number(u.demoBalance || 0) } };
});
exports.adjustDemoBalance = onCall({ region: "asia-southeast1" }, async (request) => {
  requireAdmin(request);
  const uid = String(request.data?.uid || "");
  const delta = Number(request.data?.delta);
  const reason = String(request.data?.reason || "").trim().slice(0,180);
  if (!uid || !Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 100000000 || !reason) {
    throw new HttpsError("invalid-argument", "تحقق من المستخدم والقيمة والسبب.");
  }
  const userRef = db.collection("users").doc(uid);
  const result = await db.runTransaction(async tx => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new HttpsError("not-found", "المستخدم غير موجود.");
    const current = Number(userSnap.get("demoBalance") || 0);
    const next = Math.round((current + delta) * 100) / 100;
    if (!Number.isFinite(next) || next < 0) throw new HttpsError("failed-precondition", "لا يمكن جعل الرصيد التجريبي سالبًا.");
    tx.update(userRef, { demoBalance: next, updatedAt: FieldValue.serverTimestamp() });
    const auditRef = db.collection("balanceAudit").doc();
    tx.set(auditRef, { uid, publicId: userSnap.get("publicId") || "", delta, previousBalance: current, newBalance: next, reason, adminUid: request.auth.uid, createdAt: FieldValue.serverTimestamp(), type: "demo_balance_adjustment" });
    return next;
  });
  return { demoBalance: result };
});
exports.createDepositRequest = onCall({ region: "asia-southeast1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "سجّل الدخول أولًا.");
  const method = String(request.data?.method || "");
  const allowed = ["binance_pay", "usdt_trc20", "usdt_bep20"];
  if (!allowed.includes(method)) throw new HttpsError("invalid-argument", "طريقة الدفع غير مدعومة.");
  const reference = String(request.data?.reference || "").trim().slice(0,120);
  const notes = String(request.data?.notes || "").trim().slice(0,200);
  const id = randomUUID();
  await db.collection("depositRequests").doc(id).set({
    uid: request.auth.uid, method, amount: 5, currency: "USDT", reference, notes,
    status: "pending_review", balanceCredited: false,
    createdAt: FieldValue.serverTimestamp()
  });
  return { requestId: id, status: "pending_review" };
});