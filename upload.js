import { db, collection, addDoc, onSnapshot, query, orderBy } from './firebase-config.js';
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const msgForm = document.getElementById('msg-form');
const songForm = document.getElementById('song-form');
const cdBtn = document.getElementById('cd-btn');

const CLOUDINARY_CLOUD_NAME = "op4q4mqx"; 
const CLOUDINARY_PRESET = "ml_default"; 
const COUNTDOWN_URL = "https://nincxndy.github.io/NY2027/";

if (cdBtn) {
  cdBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    window.location.href = COUNTDOWN_URL;
  });
}
// ระบบสลับแท็บ
document.addEventListener('DOMContentLoaded', () => {
  const tabMsgBtn = document.getElementById('tab-msg-btn');
  const tabSongBtn = document.getElementById('tab-song-btn');
  const tabViewBtn = document.getElementById('tab-view-btn');
  const tabSongsListBtn = document.getElementById('tab-songs-list-btn');

  const msgTab = document.getElementById('msg-tab');
  const songTab = document.getElementById('song-tab');
  const viewTab = document.getElementById('view-tab');
  const songsListTab = document.getElementById('songs-list-tab');

  function switchTab(activeBtn, activeTab) {
    [tabMsgBtn, tabSongBtn, tabViewBtn, tabSongsListBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    [msgTab, songTab, viewTab, songsListTab].forEach(tab => {
      if (tab) {
        tab.classList.remove('active');
        tab.style.display = 'none';
      }
    });

    if (activeBtn) activeBtn.classList.add('active');
    if (activeTab) {
      activeTab.classList.add('active');
      activeTab.style.display = 'block';
    }
  }

  tabMsgBtn?.addEventListener('click', () => switchTab(tabMsgBtn, msgTab));
  tabSongBtn?.addEventListener('click', () => switchTab(tabSongBtn, songTab));
  tabViewBtn?.addEventListener('click', () => switchTab(tabViewBtn, viewTab));
  tabSongsListBtn?.addEventListener('click', () => switchTab(tabSongsListBtn, songsListTab));
});

// Helper Functions
function getYouTubeVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|music\.youtube\.com\/watch\?v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function fetchYouTubeTitle(url) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return data.title;
    }
  } catch (err) {
    console.error("Error fetching YouTube oEmbed:", err);
  }
  return null;
}

function extractSongNameFromUrl(url) {
  if (!url) return "เพลงไม่มีชื่อ";
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    const decodedName = decodeURIComponent(filename);
    const nameWithoutExt = decodedName.replace(/\.[^/.]+$/, "");
    return nameWithoutExt || "เพลงไม่มีชื่อ";
  } catch (e) {
    return "เพลงไม่มีชื่อ";
  }
}
// 1. ส่งฟอร์มข้อความ/รูปภาพ/วิดีโอ
if (msgForm) {
  msgForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = msgForm.querySelector('.submit-btn');
    const senderName = document.getElementById('msg-user-name')?.value.trim() || "";
    const message = document.getElementById('user-message')?.value.trim() || "";
    const file = document.getElementById('user-media')?.files[0];

    if (!message && !file) {
      alert("กรุณากรอกข้อความ หรืออัปโหลดรูปภาพ/วิดีโอ");
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "กำลังบันทึก..."; }

    let mediaUrl = "";
    let mediaType = "";

    try {
      if (file) {
        if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('image/')) mediaType = 'image';

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
          method: "POST",
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error?.message || "อัปโหลดไม่สำเร็จ");
        mediaUrl = uploadData.secure_url;
      }

      await addDoc(collection(db, "wishes"), {
        senderName: senderName,
        message: message,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        createdAt: new Date()
      });

      alert("ส่งข้อความเรียบร้อยแล้ว!");
      msgForm.reset();
      window.location.href = COUNTDOWN_URL;

    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "ส่งข้อความ / สื่อ"; }
    }
  });
}
// 2. ส่งฟอร์มเฉพาะเพลง
if (songForm) {
  songForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = songForm.querySelector('.submit-btn');
    const senderName = document.getElementById('song-user-name')?.value.trim() || "";
    let songTitle = document.getElementById('song-title')?.value.trim() || "";
    const songUrl = document.getElementById('song-url')?.value.trim() || "";

    if (!songUrl) {
      alert("กรุณาใส่ลิงก์เพลง");
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "กำลังค้นหาและเพิ่มเพลง..."; }

    try {
      if (!songTitle) {
        const autoYtTitle = await fetchYouTubeTitle(songUrl);
        songTitle = autoYtTitle || extractSongNameFromUrl(songUrl);
      }

      await addDoc(collection(db, "wishes"), {
        senderName: senderName,
        songTitle: songTitle,
        songUrl: songUrl,
        createdAt: new Date()
      });

      alert("ส่งเพลงเข้าคิวเรียบร้อยแล้ว!");
      songForm.reset();
      window.location.href = COUNTDOWN_URL;

    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "ส่งเพลงเข้าคิว"; }
    }
  });
}
// 3. ดึงข้อมูลแบบ Realtime จาก Firebase
function listenToFirebaseData() {
  const wishesList = document.getElementById('wishes-list');
  const songsList = document.getElementById('songs-list');

  const wishesRef = collection(db, "wishes");
  const q = query(wishesRef, orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    if (wishesList) wishesList.innerHTML = "";
    if (songsList) songsList.innerHTML = "";

    let hasMessages = false;
    let songCount = 0;

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const docId = docSnap.id;

      const sender = item.senderName ? item.senderName.trim() : "ไม่ระบุชื่อ";
      const message = item.message ? item.message.trim() : "";
      const mediaUrl = item.mediaUrl || item.imageUrl || ""; 
      const mediaType = item.mediaType || "image";
      const songUrl = item.songUrl ? item.songUrl.trim() : "";
      const songTitle = item.songTitle ? item.songTitle.trim() : extractSongNameFromUrl(songUrl);

      // --- กรณีที่ 1: การ์ดข้อความ / สื่อ ---
      if (message !== "" || mediaUrl !== "") {
        hasMessages = true;
        const card = document.createElement('div');
        card.className = 'wish-item';

        let mediaHtml = "";
        if (mediaUrl) {
          if (mediaType === "video") mediaHtml = `<video src="${mediaUrl}" controls playsinline></video>`;
          else mediaHtml = `<img src="${mediaUrl}" alt="ภาพอวยพร">`;
        }

        const senderHtml = sender !== "ไม่ระบุชื่อ" ? `<div class="sender">${sender}</div>` : "";
        const messageHtml = message ? `<div class="msg">${message}</div>` : "";

        card.innerHTML = `${senderHtml}${messageHtml}${mediaHtml}`;
        if (wishesList) wishesList.appendChild(card);
      }

      // --- กรณีที่ 2: รายการเพลง ---
      if (songUrl !== "") {
        songCount++;
        const songCard = document.createElement('div');
        songCard.className = 'song-card';

        songCard.innerHTML = `
          <div class="song-card-info">
            <span class="song-card-title">${songCount}. ${songTitle}</span>
            <span class="song-card-sender">โดย: ${sender}</span>
          </div>
          <button class="btn-delete-song" data-id="${docId}">ลบ</button>
        `;

        // ปุ่มลบด้วยตัวเอง (เฉพาะเมื่อผู้ใช้กดลบเอง)
        songCard.querySelector('.btn-delete-song').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`คุณต้องการลบเพลง "${songTitle}" ออกจากคิวหรือไม่?`)) {
            try {
              await deleteDoc(doc(db, "wishes", docId));
            } catch (err) {
              alert("ลบไม่สำเร็จ: " + err.message);
            }
          }
        });

        if (songsList) songsList.appendChild(songCard);
      }
    });

    if (wishesList && !hasMessages) {
      wishesList.innerHTML = '<p style="text-align:center; color:#aaa;">ยังไม่มีข้อความอวยพร</p>';
    }

    if (songsList && songCount === 0) {
      songsList.innerHTML = '<p style="text-align:center; color:#aaa;">ไม่มีเพลงในคิว</p>';
    }
  });
}

listenToFirebaseData();
