import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

/* Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyAhjkeSO42TCDdbd3ZTHcvfMFqF9LF-GNw",
  authDomain: "trainee-pages.firebaseapp.com",
  projectId: "trainee-pages",
  storageBucket: "trainee-pages.appspot.com",
  messagingSenderId: "515476183719",
  appId: "1:515476183719:web:f58a4ed6647b6df035d982"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* DOM / helpers */
const $ = s => document.querySelector(s);
const traineeNameElem = $("#traineeName");
const params = new URLSearchParams(window.location.search);
const traineeId = params.get("id");

const attendanceContainer = $("#attendanceContainer");
const absenceContainer = $("#absenceContainer");
const submitBtn = $("#submitBtn");
const addAttendanceBtn = $("#addAttendanceBtn");
const addAbsenceBtn = $("#addAbsenceBtn");
const reportSection = $("#report-section");

/* PIN modal */
const overlay = $("#pin-overlay");
const pinInput = $("#pin-input");
const pinSubmit = $("#pin-submit");
const pinError = $("#pin-error");

function todayDate(){ return new Date().toISOString().split("T")[0]; }
function checkFormValidity(){
  if (!submitBtn) return;
  const hasAttendance = attendanceContainer?.querySelectorAll(".block").length > 0;
  submitBtn.disabled = !hasAttendance;
}

/* Client meta */
function getPlatform(){ return navigator.userAgentData?.platform || navigator.platform || ""; }
function getDeviceName(){
  const ua = navigator.userAgent || "";
  const platform = getPlatform() || "OS";
  let browser = navigator.userAgentData?.brands?.[0]?.brand || navigator.vendor || "Browser";
  if (ua.includes("Edg/")) { const m = ua.split("Edg/")[1]; browser = "Edge " + (m ? m.split(".")[0] : ""); }
  else if (ua.includes("Chrome/")) { const m = ua.split("Chrome/")[1]; browser = "Chrome/" + (m ? m.split(".")[0] : ""); }
  else if (ua.includes("Firefox/")) { const m = ua.split("Firefox/")[1]; browser = "Firefox " + (m ? m.split(".")[0] : ""); }
  else if (ua.includes("Safari/") && ua.includes("Version/")) { const m = ua.split("Version/")[1]; browser = "Safari " + (m ? m.split(".")[0] : ""); }
  return `${platform} • ${browser}`;
}

/* Load trainee summary (for header) */
async function loadTrainee(){
  if (!traineeId){ traineeNameElem.textContent = "❌ لا يوجد معرّف متدرب في الرابط"; return null; }
  try {
    const ref = doc(db, "Trainees", traineeId);
    const snap = await getDoc(ref);
    if (!snap.exists()){ traineeNameElem.textContent = "❌ المتدرب غير موجود"; return null; }
    const data = snap.data();
    $("#traineeName").textContent = `اسم المتدرب: ${data.Name || "بدون اسم"}`;
    $("#photo").src = data["Photo URL"] || "https://via.placeholder.com/150";
    $("#program").textContent = data.Program || "بدون برنامج";
    $("#phone").textContent = data.Phone || "بدون رقم";
    return data;
  } catch (err){
    console.error(err);
    traineeNameElem.textContent = "❌ حدث خطأ في تحميل بيانات المتدرب";
    return null;
  }
}

/* ===== PIN logic (Page 2 only) ===== */
async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

let traineeDoc = null;
pinSubmit.addEventListener("click", async () => {
  pinError.hidden = true;
  const entered = (pinInput.value || "").trim();
  if (!entered){ pinError.hidden = false; return; }

  if (!traineeDoc){
    traineeDoc = await loadTrainee();
    if (!traineeDoc) return;
  }
  const enteredHash = await sha256(entered);
  if (String(traineeDoc.PINHash || "").toLowerCase() === enteredHash.toLowerCase()){
    overlay.classList.remove("show");
    reportSection.style.display = "block";   // unlock the form
    // add initial block after unlock
    addAttendance();
  } else {
    pinError.hidden = false;
    pinInput.select();
  }
});
pinInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") pinSubmit.click(); });

/* ===== Blocks + Remove (event delegation) ===== */
function buildAttendanceBlock(){
  const block = document.createElement("div");
  block.className = "block";
  block.innerHTML = `
    <div class="row">
      <label>📅 التاريخ:
        <input type="date" name="date" value="${todayDate()}" required />
      </label>
      <label>👨‍🏫 المدرب:
        <select name="instructor" required>
          <option value="">-- اختر --</option>
          <option value="علاج جمعي إدمان">علاج جمعي إدمان</option>
          <option value="أ. وليد حسني">أ. وليد حسني</option>
          <option value="أ. حازم سمير">أ. حازم سمير</option>
          <option value="أ. مصطفى إمام">أ. مصطفى إمام</option>
          <option value="أ. إسلام رمضان">أ. إسلام رمضان</option>
          <option value="أ. دينا عمر">أ. دينا عمر</option>
          <option value="أ. تيسير السيد">أ. تيسير السيد</option>
          <option value="أ. أشرف عبد الحميد">أ. أشرف عبد الحميد</option>
          <option value="أ. حسن">أ. حسن</option>
          <option value="اجتماع عائلات">اجتماع عائلات</option>
          <option value="دراسة حالة">دراسة حالة</option>
          <option value="محاضرة">محاضرة</option>
          <option value="علاج شخصي">علاج شخصي</option>
        </select>
      </label>
      <label>📘 الفقرة:
        <select name="session" required>
          <option value="">--اختر--</option>
          <option value="جروب جمعي إدمان">جروب جمعي إدمان</option>
          <option value="جروب جمعي تحدي">جروب جمعي تحدي</option>
          <option value="جروب/جلسة لافيزون">جروب/جلسة لافيزون</option>
          <option value="جلسة فردية إدمان">جلسة فردية إدمان</option>
          <option value="جلسة فردية تحدي">جلسة فردية تحدي</option>
          <option value="إحياء الفكر والوجدان">إحياء الفكر والوجدان</option>
          <option value="العلاج بالفن">العلاج بالفن</option>
          <option value="اجتماع العائلات">اجتماع العائلات</option>
          <option value="دراسة الحالة">دراسة الحالة</option>
          <option value="محاضرة">محاضرة</option>
          <option value="علاج شخصي">علاج شخصي</option>
        </select>
      </label>
      <label>🔢 عدد الفقرات:
        <select name="count" required>
          <option value="">--اختر--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>
      </label>
    </div>
    <div class="actions">
      <button type="button" class="btn remove-btn remove-entry">❌ حذف الفقرة</button>
    </div>`;
  return block;
}

function buildAbsenceBlock(){
  const block = document.createElement("div");
  block.className = "block";
  block.innerHTML = `
    <div class="row">
      <label>📅 التاريخ:
        <input type="date" name="date" value="${todayDate()}" required />
      </label>
      <label>📘 الفقرة:
        <select name="session" required>
          <option value="">--اختر--</option>
          <option value="جروب جمعي إدمان">جروب جمعي إدمان</option>
          <option value="جروب جمعي تحدي">جروب جمعي تحدي</option>
          <option value="جروب/جلسة جمعي لافيزون">جروب/جلسة لافيزون</option>
          <option value="جلسة فردية إدمان">جلسة فردية إدمان</option>
          <option value="جلسة فردية تحدي">جلسة فردية تحدي</option>
          <option value="إحياء الفكر والوجدان">إحياء الفكر والوجدان</option>
          <option value="العلاج بالفن">العلاج بالفن</option>
          <option value="اجتماع العائلات">اجتماع العائلات</option>
          <option value="دراسة الحالة">دراسة الحالة</option>
          <option value="محاضرة">محاضرة</option>
          <option value="علاج شخصي">علاج شخصي</option>
        </select>
      </label>
      <label>🔢 عدد الفقرات:
        <select name="count" required>
          <option value="">--اختر--</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>
      </label>
    </div>
    <div class="actions">
      <button type="button" class="btn remove-btn remove-entry">❌ حذف الفقرة</button>
    </div>`;
  return block;
}

/* Add buttons */
function addAttendance(){ attendanceContainer.appendChild(buildAttendanceBlock()); checkFormValidity(); }
function addAbsence(){ absenceContainer.appendChild(buildAbsenceBlock()); checkFormValidity(); }
addAttendanceBtn.addEventListener("click", addAttendance);
addAbsenceBtn.addEventListener("click", addAbsence);

/* Event delegation for delete */
[attendanceContainer, absenceContainer].forEach(container => {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-entry");
    if (btn){ btn.closest(".block")?.remove(); checkFormValidity(); }
  });
});

/* Submit */
async function submitReport(){
  const traineeName = document.getElementById("traineeName").textContent.replace(/^اسم المتدرب:\s*/, "") || "";
  const attendance = [...attendanceContainer.querySelectorAll(".block")].map(b => ({
    date: b.querySelector('[name="date"]').value,
    instructor: b.querySelector('[name="instructor"]')?.value || "",
    session: b.querySelector('[name="session"]').value,
    count: Number(b.querySelector('[name="count"]').value || 0)
  }));
  const absence = [...absenceContainer.querySelectorAll(".block")].map(b => ({
    date: b.querySelector('[name="date"]').value,
    session: b.querySelector('[name="session"]').value,
    count: Number(b.querySelector('[name="count"]').value || 0)
  }));
  const client = { deviceName: getDeviceName(), platform: getPlatform() };

  try {
    await addDoc(collection(db, "daily_reports"), {
      traineeId: traineeId || "",
      traineeName,
      timestamp: new Date().toISOString(),
      attendance,
      absence,
      client
    });
    alert("✅ تم إرسال التقرير بنجاح!");
    location.reload();
  } catch (e){
    console.error(e);
    alert("❌ حدث خطأ أثناء الإرسال");
  }
}
submitBtn.addEventListener("click", submitReport);

/* Init (preload header; keep form hidden until PIN) */
loadTrainee();
