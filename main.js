import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

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

/* Params */
const params = new URLSearchParams(window.location.search);
const traineeId = params.get("id");

/* Load + render (no PIN on page 1) */
async function fetchTrainee(){
  if (!traineeId){
    document.getElementById("traineeName").textContent = "❌ لا يوجد معرّف متدرب في الرابط";
    return null;
  }
  try {
    const ref = doc(db, "Trainees", traineeId);
    const snap = await getDoc(ref);
    if (!snap.exists()){
      document.getElementById("traineeName").textContent = "❌ المتدرب غير موجود";
      return null;
    }
    return snap.data();
  } catch (err){
    console.error(err);
    document.getElementById("traineeName").textContent = "❌ حدث خطأ في تحميل بيانات المتدرب";
    return null;
  }
}

async function renderFromDoc(data){
  document.getElementById("traineeName").textContent = `اسم المتدرب: ${data.Name || "بدون اسم"}`;
  document.getElementById("photo").src = data["Photo URL"] || "https://via.placeholder.com/150";
  document.getElementById("program").textContent = data.Program || "بدون برنامج";
  document.getElementById("phone").textContent = data.Phone || "بدون رقم";

  const startDate = data.StartDate?.toDate?.();
  document.getElementById("start-date").textContent = startDate ? startDate.toLocaleDateString("ar-EG") : "بدون تاريخ";

  // Link tree from Firestore Links
  const links = data.Links || {};
  document.getElementById("report-link").href = `./Report.html?id=${encodeURIComponent(traineeId)}`; // first link → page 2
  document.getElementById("CBT16-link").href = links.CBT16 || "#";
  document.getElementById("track-link").href = links.Track || "#";
  document.getElementById("Attendance-link").href = links.Attendance || "#";
}

/* Init */
(async () => {
  const d = await fetchTrainee();
  if (d) await renderFromDoc(d);
})();
