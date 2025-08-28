import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

/* ===== Firebase Config ===== */
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

/* ===== Elements / Params ===== */
const traineeNameElem = document.getElementById("traineeName");
const overlay = document.getElementById("pin-overlay");
const pinInput = document.getElementById("pin-input");
const pinSubmit = document.getElementById("pin-submit");
const pinError = document.getElementById("pin-error");

const params = new URLSearchParams(window.location.search);
const traineeId = params.get("id");
let traineeDoc = null;

/* ===== Utilities ===== */
async function sha256(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

async function fetchTrainee(){
  if (!traineeId){
    traineeNameElem.textContent = "❌ لا يوجد معرّف متدرب في الرابط";
    return null;
  }
  try {
    const ref = doc(db, "Trainees", traineeId);
    const snap = await getDoc(ref);
    if (!snap.exists()){
      traineeNameElem.textContent = "❌ المتدرب غير موجود";
      return null;
    }
    return snap.data();
  } catch(err){
    console.error(err);
    traineeNameElem.textContent = "❌ حدث خطأ في تحميل بيانات المتدرب";
    return null;
  }
}

async function renderFromDoc(data){
  // Profile info & links
  document.getElementById("traineeName").textContent = `اسم المتدرب: ${data.Name || "بدون اسم"}`;
  document.getElementById("photo").src = data["Photo URL"] || "https://via.placeholder.com/150";
  document.getElementById("program").textContent = data.Program || "بدون برنامج";
  document.getElementById("phone").textContent = data.Phone || "بدون رقم";

  const startDate = data.StartDate?.toDate?.();
  document.getElementById("start-date").textContent = startDate ? startDate.toLocaleDateString("ar-EG") : "بدون تاريخ";

  // Dynamic Link Tree (flexible keys)
  const links = data.Links || data.links || {};
  const cbt = links.CBT16 || links.cbt16 || null;
  const finance = links.Finance || links.FinanceOverview || links.Overview || links.Track || null;
  const attendanceTrack = links.Attendance || links.TrackAttendance || links.Track || null;

  // First button goes to Page 2 (report)
  document.getElementById("report-link").href = `./report.html?id=${encodeURIComponent(traineeId)}`;

  const cbtEl = document.getElementById("CBT16-link");
  const finEl = document.getElementById("finance-link");
  const trackEl = document.getElementById("attendance-track-link");
  if (cbt) { cbtEl.href = cbt; cbtEl.removeAttribute('aria-disabled'); } else { cbtEl.href = '#'; cbtEl.setAttribute('aria-disabled','true'); }
  if (finance) { finEl.href = finance; finEl.removeAttribute('aria-disabled'); } else { finEl.href = '#'; finEl.setAttribute('aria-disabled','true'); }
  if (attendanceTrack) { trackEl.href = attendanceTrack; trackEl.removeAttribute('aria-disabled'); } else { trackEl.href = '#'; trackEl.setAttribute('aria-disabled','true'); }
}

/* ===== PIN Gate ===== */
pinSubmit.addEventListener("click", async () => {
  pinError.hidden = true;
  const entered = (pinInput.value || "").trim();
  if (!entered){ pinError.hidden = false; return; }

  if (!traineeDoc){
    traineeDoc = await fetchTrainee();
    if (!traineeDoc) return;
  }

  const enteredHash = await sha256(entered);
  if (String(traineeDoc.PINHash || "").toLowerCase() === enteredHash.toLowerCase()){
    overlay.classList.remove("show");
    await renderFromDoc(traineeDoc);
  } else {
    pinError.hidden = false;
    pinInput.select();
  }
});

// Allow Enter key
pinInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") pinSubmit.click(); });
